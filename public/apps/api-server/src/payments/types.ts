/**
 * Provider-agnostic payment contract. Business/plan logic (services/plan.ts)
 * never talks to PayPal (or, later, Stripe) directly — only through this
 * interface, so a future provider swap touches this file plus one new
 * implementation, not the routes or the plan-management logic.
 */

export type PriceType = "monthly" | "annual" | "lifetime";

export interface CreateCheckoutInput {
  userId: string;
  priceType: PriceType;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  /** URL the browser is redirected to in order to approve the payment. */
  approvalUrl: string;
  /** Provider-specific order/session id, opaque to the caller. */
  providerOrderId: string;
}

export type CaptureStatus = "COMPLETED" | "PENDING" | "FAILED";

export interface CaptureResult {
  status: CaptureStatus;
  userId: string;
  priceType: PriceType;
}

export interface PaymentProvider {
  createCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  /** Server-side confirmation — the only place a plan upgrade may originate from. */
  captureOrder(providerOrderId: string): Promise<CaptureResult | null>;
}
