import { Router } from "express";
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import { getAuth } from "@clerk/express";

const router = Router();
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB — matches free-tier compression target
  // Raster images only. Deliberately NOT "image/*" — image/svg+xml is XML and
  // can embed <script>, making it a stored-XSS vector when served back from
  // our own origin (see GET route below).
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("UNSUPPORTED_FILE_TYPE"));
    }
  },
});

const gcs = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "";

// POST /api/storage/upload — stores the file under a per-user prefix and
// returns its object path (not a full URL). The frontend prefixes this with
// `/api/storage` and requests it back through GET /api/storage/:path below,
// which keeps the bucket private and ownership-scoped rather than public-read.
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const status = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      res.status(status).json({ success: false, code: "VALIDATION_ERROR", message: "Fichier invalide ou trop volumineux" });
      return;
    }
    next();
  });
}, async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Aucun fichier fourni" });
    return;
  }
  if (!BUCKET_NAME) {
    res.status(503).json({ success: false, code: "STORAGE_NOT_CONFIGURED", message: "Object storage is not configured" });
    return;
  }

  try {
    const ext = (req.file.originalname.match(/\.[^/.]+$/)?.[0] || "").toLowerCase();
    const objectPath = `${userId}/${crypto.randomUUID()}${ext}`;

    const bucket = gcs.bucket(BUCKET_NAME);
    const gcsFile = bucket.file(objectPath);
    await gcsFile.save(req.file.buffer, {
      contentType: req.file.mimetype,
      resumable: false,
    });

    res.status(201).json({ objectPath: `/${objectPath}` });
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Échec de l'upload" });
  }
});

// GET /api/storage/:userId/:filename — streams the object back, but only to
// the user who owns it (never trust the URL alone — see docs/03-Backend §25).
router.get("/:userId/:filename", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }
  if (userId !== req.params.userId) {
    res.status(403).json({ success: false, code: "FORBIDDEN", message: "Accès refusé" });
    return;
  }
  if (!BUCKET_NAME) {
    res.status(503).json({ success: false, code: "STORAGE_NOT_CONFIGURED", message: "Object storage is not configured" });
    return;
  }

  try {
    const objectPath = `${req.params.userId}/${req.params.filename}`;
    const bucket = gcs.bucket(BUCKET_NAME);
    const gcsFile = bucket.file(objectPath);
    const [exists] = await gcsFile.exists();
    if (!exists) {
      res.status(404).json({ success: false, code: "NOT_FOUND", message: "Fichier introuvable" });
      return;
    }
    const [metadata] = await gcsFile.getMetadata();
    if (metadata.contentType) res.setHeader("Content-Type", metadata.contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    gcsFile.createReadStream().pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Échec de la lecture du fichier" });
  }
});

export default router;
