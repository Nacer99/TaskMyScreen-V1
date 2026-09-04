import { Router } from "express";
import { getAuth } from "@clerk/express";
import { checkoutSchema } from "@workspace/api-zod";
import { PayPalProvider } from "../payments/paypal.js";
import type { PaymentProvider } from "../payments/types.js";
import { assignPlanFromPayment } from "../services/plan.js";

const router = Router();

// V1 uses PayPal. Swapping providers later means constructing a different
// PaymentProvider here — the routes and plan logic below don't change.
const paymentProvider: PaymentProvider = new PayPalProvider();

const APP_URL = process.env.APP_URL || "http://localhost:5173";

// POST /api/billing/checkout — creates a checkout session for the selected
// plan and returns the URL to redirect the browser to.
router.post("/checkout", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }

  const result = checkoutSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Données invalides", details: result.error.format() });
    return;
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    res.status(503).json({ success: false, code: "BILLING_NOT_CONFIGURED", message: "PayPal is not yet configured" });
    return;
  }

  try {
    const { approvalUrl } = await paymentProvider.createCheckoutSession({
      userId,
      priceType: result.data.priceType,
      // PayPal appends `token` (order id) and `PayerID` to this URL itself.
      successUrl: `${APP_URL}/upgrade?upgrade=paypal-return`,
      cancelUrl: `${APP_URL}/upgrade?upgrade=cancelled`,
    });
    res.json({ url: approvalUrl });
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erreur lors de la création de la session de paiement" });
  }
});

// POST /api/billing/capture — called by the frontend once PayPal redirects
// the user back with an order token. This is the ONLY place (besides the
// webhook below) a plan upgrade is committed — never on the frontend's say-so.
router.post("/capture", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }

  const orderId = typeof req.body?.orderId === "string" ? req.body.orderId : undefined;
  if (!orderId) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "orderId manquant" });
    return;
  }

  try {
    const result = await paymentProvider.captureOrder(orderId);

    if (!result || result.userId !== userId) {
      // Either PayPal couldn't resolve the order, or it belongs to a
      // different user than the one asking — never apply it either way.
      res.status(403).json({ success: false, code: "FORBIDDEN", message: "Commande introuvable ou non autorisée" });
      return;
    }

    if (result.status !== "COMPLETED") {
      res.status(202).json({ success: false, code: "PAYMENT_PENDING", message: "Paiement non finalisé", status: result.status });
      return;
    }

    const tier = await assignPlanFromPayment(userId, result.priceType);
    res.json({ plan: tier });
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erreur lors de la confirmation du paiement" });
  }
});

export default router;
