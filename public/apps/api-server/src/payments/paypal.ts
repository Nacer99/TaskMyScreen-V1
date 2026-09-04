/**
 * PayPal implementation of PaymentProvider (Orders v2 API).
 * No PayPal SDK dependency — plain fetch against the REST API, so there is
 * nothing extra to add/remove from package.json when this is swapped out.
 */
import type {
  CaptureResult,
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  PriceType,
} from "./types.js";

const PAYPAL_ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
const BASE_URL =
  PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

// Server-side price catalogue — mirrors src/pages/upgrade.tsx's displayed
// prices. Never trust a price submitted by the client.
const PRICES: Record<PriceType, { value: string; currency: string }> = {
  monthly: { value: "4.99", currency: "USD" },
  annual: { value: "29.99", currency: "USD" },
  lifetime: { value: "79.99", currency: "USD" },
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal OAuth failed with status ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

export class PayPalProvider implements PaymentProvider {  async createCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const token = await getAccessToken();
    const price = PRICES[input.priceType];

    const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            // Encodes who is paying for what — read back on capture so the
            // plan upgrade never has to trust anything the browser sends.
            custom_id: `${input.userId}:${input.priceType}`,
            description: `TaskMyScreen — ${input.priceType} plan`,
            amount: { currency_code: price.currency, value: price.value },
          },
        ],
        application_context: {
          brand_name: "TaskMyScreen",
          user_action: "PAY_NOW",
          return_url: input.successUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`PayPal order creation failed with status ${res.status}`);
    }

    const data = (await res.json()) as {
      id: string;
      links: { rel: string; href: string }[];
    };
    const approveLink = data.links.find((l) => l.rel === "approve");
    if (!approveLink) throw new Error("PayPal response missing approval link");

    return { approvalUrl: approveLink.href, providerOrderId: data.id };
  }

  async captureOrder(providerOrderId: string): Promise<CaptureResult | null> {
    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/v2/checkout/orders/${providerOrderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // PayPal returns 422 UNPROCESSABLE_ENTITY when an order was already
    // captured — treat that as "go re-read the order" rather than a hard error.
    if (res.status === 422) {
      return this.getOrderCaptureStatus(providerOrderId, token);
    }
    if (!res.ok) {
      throw new Error(`PayPal capture failed with status ${res.status}`);
    }

    const data = (await res.json()) as PayPalOrder;
    return this.parseOrder(data);
  }

  private async getOrderCaptureStatus(orderId: string, token: string): Promise<CaptureResult | null> {
    const res = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PayPalOrder;
    return this.parseOrder(data);
  }

  private parseOrder(data: PayPalOrder): CaptureResult | null {
    const unit = data.purchase_units?.[0];
    const customId = unit?.custom_id ?? unit?.payments?.captures?.[0]?.custom_id;
    if (!customId || !customId.includes(":")) return null;

    const [userId, priceType] = customId.split(":") as [string, PriceType];
    const captureStatus = unit?.payments?.captures?.[0]?.status;

    const status: CaptureResult["status"] =
      captureStatus === "COMPLETED" || data.status === "COMPLETED"
        ? "COMPLETED"
        : captureStatus === "DECLINED" || captureStatus === "FAILED"
          ? "FAILED"
          : "PENDING";

    return { status, userId, priceType };
  }
}

interface PayPalOrder {
  status?: string;
  purchase_units?: {
    custom_id?: string;
    payments?: { captures?: { status?: string; custom_id?: string }[] };
  }[];
}

// ─── Webhook verification (defense-in-depth alongside /capture) ────────────

export interface PayPalWebhookHeaders {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
}

export async function verifyPayPalWebhookSignature(
  headers: PayPalWebhookHeaders,
  webhookEvent: unknown
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      transmission_id: headers.transmissionId,
      transmission_time: headers.transmissionTime,
      cert_url: headers.certUrl,
      auth_algo: headers.authAlgo,
      transmission_sig: headers.transmissionSig,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

export function parsePayPalCaptureEvent(
  webhookEvent: unknown
): { userId: string; priceType: PriceType } | null {
  const event = webhookEvent as {
    event_type?: string;
    resource?: { custom_id?: string };
  };
  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") return null;

  const customId = event.resource?.custom_id;
  if (!customId || !customId.includes(":")) return null;

  const [userId, priceType] = customId.split(":") as [string, PriceType];
  return { userId, priceType };
}
