import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import pino from "pino";
import { clerkMiddleware } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, tasksTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import tasksRouter from "./routes/tasks.js";
import usersRouter from "./routes/users.js";
import statsRouter from "./routes/stats.js";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true }
  }
});

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

// Middleware essentiel pour capturer le corps brut (indispensable pour la sécurité des webhooks Stripe)
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(clerkMiddleware());

// Enregistrement du routeur pour la gestion des tâches
app.use("/api/tasks", tasksRouter);
app.use("/api/users", usersRouter);
app.use("/api/tasks/stats", statsRouter);

// --- ROUTE WEBHOOK STRIPE (Sécurisée avec signature) ---
app.post("/api/webhooks/stripe", async (req: any, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig || "",
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    logger.error(`❌ Erreur Signature Webhook: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    
    if (userId) {
      await db
        .update(usersTable)
        .set({ tier: "pro" })
        .where(eq(usersTable.id, userId));
      logger.info(`💰 Utilisateur ${userId} est passé au plan PRO via Stripe`);
    }
  }

  res.json({ received: true });
});

// --- ROUTES API DE BASE ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Serveur API TaskMyScreen démarré sur le port ${PORT}`);
});