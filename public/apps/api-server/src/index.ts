import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import pino from "pino";
import { clerkMiddleware } from "@clerk/express";
import tasksRouter from "./routes/tasks.js";
import usersRouter from "./routes/users.js";
import billingRouter from "./routes/billing.js";
import storageRouter from "./routes/storage.js";
import { verifyPayPalWebhookSignature, parsePayPalCaptureEvent } from "./payments/paypal.js";
import { assignPlanFromPayment } from "./services/plan.js";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true }
  }
});

const app = express();

app.use(express.json());
// Reflecting any Origin while allowing credentials (the previous
// `origin: true`) lets ANY third-party site make authenticated requests
// using a signed-in user's session — restrict to the app's own origin(s).
const allowedOrigins = (process.env.APP_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin/non-browser requests (curl, server-to-server) send no
      // Origin header at all — allow those through.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(clerkMiddleware());

// Enregistrement des routeurs
app.use("/api/tasks", tasksRouter);
app.use("/api/users", usersRouter);
app.use("/api/billing", billingRouter);
app.use("/api/storage", storageRouter);

// --- WEBHOOK PAYPAL ---
// Defense-in-depth alongside POST /api/billing/capture: applies the plan
// upgrade even if the browser never returns to call /capture itself
// (closed tab, network drop, etc). Every event is verified against PayPal
// before anything is written to the database.
app.post("/api/webhooks/paypal", async (req, res) => {
  try {
    const verified = await verifyPayPalWebhookSignature(
      {
        transmissionId: String(req.headers["paypal-transmission-id"] ?? ""),
        transmissionTime: String(req.headers["paypal-transmission-time"] ?? ""),
        certUrl: String(req.headers["paypal-cert-url"] ?? ""),
        authAlgo: String(req.headers["paypal-auth-algo"] ?? ""),
        transmissionSig: String(req.headers["paypal-transmission-sig"] ?? ""),
      },
      req.body
    );

    if (!verified) {
      logger.warn("❌ Signature de webhook PayPal invalide");
      res.status(400).json({ received: false });
      return;
    }

    const parsed = parsePayPalCaptureEvent(req.body);
    if (parsed) {
      const tier = await assignPlanFromPayment(parsed.userId, parsed.priceType);
      logger.info(`💰 Utilisateur ${parsed.userId} est passé au plan ${tier.toUpperCase()} via PayPal (webhook)`);
    }

    res.json({ received: true });
  } catch (err) {
    logger.error(`❌ Erreur webhook PayPal: ${(err as Error).message}`);
    res.status(500).json({ received: false });
  }
});

// --- ROUTES API DE BASE ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Serveur API TaskMyScreen démarré sur le port ${PORT}`);
});
