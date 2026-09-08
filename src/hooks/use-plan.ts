import { useGetUserProfile } from "@workspace/api-client-react";

export const MONTHLY_LIMIT = 20;

export function usePlan() {
  const { data: profile, isLoading } = useGetUserProfile({
    query: {}
  });

  const plan = profile?.plan ?? "free";
  const isPro = plan === "pro" || plan === "lifetime";
  const monthlyTasksUsed = profile?.monthlyTasksUsed ?? 0;
  const monthlyTaskLimit = isPro ? null : MONTHLY_LIMIT;
  const isAtLimit = !isPro && monthlyTasksUsed >= MONTHLY_LIMIT;

  return {
    plan,
    isPro,
    monthlyTasksUsed,
    monthlyTaskLimit,
    isAtLimit,
    isLoading,
    profile,
  };
}
