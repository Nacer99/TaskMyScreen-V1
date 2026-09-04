/**
 * Centralizes plan/quota business logic so it exists exactly once
 * (docs/03-Backend §17, §30: business rules must not be duplicated).
 * Used by both GET /api/users/profile and GET /api/tasks/stats.
 */
import { db } from "@workspace/db";
import { usersTable, tasksTable } from "@workspace/db/schema";
import { and, eq, gte, count } from "drizzle-orm";

export const MONTHLY_TASK_LIMIT = 20;

export type Plan = "free" | "pro" | "lifetime";

export function isPro(plan: Plan): boolean {
  return plan === "pro" || plan === "lifetime";
}

/** Ensures a `users` row exists for this Clerk user, creating it on first sight. */
export async function ensureUser(userId: string, email: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (existing.length > 0) return existing[0];

  const inserted = await db
    .insert(usersTable)
    .values({ id: userId, email, tier: "free" })
    .returning();
  return inserted[0];
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getMonthlyTasksUsed(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tasksTable)
    .where(and(eq(tasksTable.userId, userId), gte(tasksTable.createdAt, startOfCurrentMonth())));
  return row?.value ?? 0;
}

export async function getTaskCounts(userId: string) {
  const [pendingRow] = await db
    .select({ value: count() })
    .from(tasksTable)
    .where(and(eq(tasksTable.userId, userId), eq(tasksTable.isCompleted, false)));
  const [completedRow] = await db
    .select({ value: count() })
    .from(tasksTable)
    .where(and(eq(tasksTable.userId, userId), eq(tasksTable.isCompleted, true)));
  return { pending: pendingRow?.value ?? 0, completed: completedRow?.value ?? 0 };
}

export async function assertQuotaAvailable(userId: string, plan: Plan) {
  if (isPro(plan)) return;
  const used = await getMonthlyTasksUsed(userId);
  if (used >= MONTHLY_TASK_LIMIT) {
    const err = new Error("Monthly reminder limit reached") as Error & { status: number };
    err.status = 402;
    throw err;
  }
}

/**
 * Applies a successful payment to the user's plan. Called only from a
 * server-verified capture (routes/billing.ts) or a verified provider
 * webhook — never from anything the frontend asserts on its own.
 */
export async function assignPlanFromPayment(userId: string, priceType: "monthly" | "annual" | "lifetime") {
  const tier: Plan = priceType === "lifetime" ? "lifetime" : "pro";
  await db.update(usersTable).set({ tier }).where(eq(usersTable.id, userId));
  return tier;
}
