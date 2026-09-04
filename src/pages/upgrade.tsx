import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Zap, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCreateCheckoutSession,
  useCaptureCheckout,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/use-plan";
import { useQueryClient } from "@tanstack/react-query";

type PriceType = "monthly" | "annual" | "lifetime";

const PLANS = [
  {
    id: "monthly" as PriceType,
    name: "Monthly",
    price: "$4.99",
    period: "/mo",
    detail: "Try Pro month to month",
    badge: null,
    highlighted: false,
  },
  {
    id: "annual" as PriceType,
    name: "Annual",
    price: "$29.99",
    period: "/yr",
    detail: "$2.50 / month · Save 50%",
    badge: "Best Value",
    highlighted: true,
  },
  {
    id: "lifetime" as PriceType,
    name: "Lifetime",
    price: "$79.99",
    period: " once",
    detail: "Pay once, use forever",
    badge: "Premium",
    highlighted: false,
  },
];

const FEATURE_COMPARISON = [
  { free: "20 tasks / month", pro: "Unlimited tasks" },
  { free: "Fixed-time reminders only", pro: "Snooze & reschedule from alerts" },
  { free: "Compressed images", pro: "Full-resolution images" },
];

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isPro, plan } = usePlan();
  const [loadingPlan, setLoadingPlan] = useState<PriceType | null>(null);

  // PayPal redirects back with ?token=<orderId>&PayerID=... after approval —
  // capture is a server-verified call; the frontend never assumes success
  // from the mere presence of a return URL.
  const params = new URLSearchParams(search);
  const paypalOrderId = params.get("token");
  const [captureState, setCaptureState] = useState<"idle" | "pending" | "success" | "error">(
    paypalOrderId ? "pending" : "idle"
  );

  const captureMutation = useCaptureCheckout({
    mutation: {
      onSuccess: () => {
        setCaptureState("success");
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
      },
      onError: () => setCaptureState("error"),
    },
  });

  useEffect(() => {
    if (paypalOrderId && captureState === "pending" && !captureMutation.isPending) {
      captureMutation.mutate({ orderId: paypalOrderId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalOrderId]);

  const isSuccess = captureState === "success";

  const checkoutMutation = useCreateCheckoutSession({
    mutation: {
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: () => {
        setLoadingPlan(null);
        toast({
          title: "Checkout unavailable",
          description: "PayPal is not yet configured. Please try again later.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSelectPlan = (priceType: PriceType) => {
    if (loadingPlan || isPro) return;
    setLoadingPlan(priceType);
    checkoutMutation.mutate({ data: { priceType } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col min-h-[100dvh] bg-background"
    >
      <header className="px-4 h-14 flex items-center border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 h-9 w-9 rounded-full"
          onClick={() => setLocation("/tasks")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg ml-3">Upgrade to Pro</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-5">
        {/* Payment confirmation banner */}
        {captureState === "pending" && (
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border/50 text-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Confirming your payment with PayPal…
          </div>
        )}

        {captureState === "error" && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
            <p className="text-destructive font-semibold">We couldn't confirm your payment.</p>
            <p className="text-sm text-muted-foreground mt-1">
              If PayPal charged you, contact support — no charge is applied without a plan change.
            </p>
          </div>
        )}

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center"
          >
            <p className="text-green-400 font-semibold">Payment successful! Welcome to Pro.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your plan will activate in a few seconds.
            </p>
          </motion.div>
        )}

        {/* Hero */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Unlock Your Full Potential</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Unlimited tasks, smart reminders,<br />and full-resolution images.
          </p>
        </div>

        {/* Feature comparison */}
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="grid grid-cols-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-4 py-2.5">
            <span>Free</span>
            <span className="text-primary">Pro</span>
          </div>
          {FEATURE_COMPARISON.map((f, i) => (
            <div
              key={i}
              className={`grid grid-cols-2 px-4 py-3 text-sm ${
                i > 0 ? "border-t border-border/30" : ""
              }`}
            >
              <div className="flex items-start gap-2 text-muted-foreground pr-3">
                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                <span className="leading-snug">{f.free}</span>
              </div>
              <div className="flex items-start gap-2 text-foreground pl-3">
                <Check className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                <span className="leading-snug">{f.pro}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing cards */}
        <div className="space-y-3">
          {PLANS.map((p) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleSelectPlan(p.id)}
              disabled={!!loadingPlan || isPro}
              className={`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                p.highlighted
                  ? "border-primary bg-primary/5 shadow-[0_0_24px_rgba(59,91,250,0.18)]"
                  : "border-border/50 bg-card hover:border-primary/40"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {p.badge && (
                <span
                  className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    p.highlighted
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {p.badge}
                </span>
              )}
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-xl font-bold">{p.price}</span>
                <span className="text-muted-foreground text-sm">{p.period}</span>
              </div>
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.detail}</div>
              {loadingPlan === p.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {isPro && (
          <p className="text-center text-sm text-green-400 font-medium">
            You already have a{" "}
            {plan === "lifetime" ? "Lifetime" : "Pro"} plan.
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground px-4 leading-relaxed">
          Subscriptions can be cancelled anytime from your billing portal.
          Lifetime is a single one-time payment with no recurring charges.
        </p>
      </div>
    </motion.div>
  );
}
