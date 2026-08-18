import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  PLAN TYPE                                 */
/* -------------------------------------------------------------------------- */

export const planTypeSchema = z.enum([
  "free",
  "pro",
  "lifetime",
]);

export type PlanType = z.infer<
  typeof planTypeSchema
>;

/* -------------------------------------------------------------------------- */
/*                                    TASK                                    */
/* -------------------------------------------------------------------------- */

export const taskSchema = z.object({
  id: z.string(),

  userId: z.string(),

  title: z.string().min(1),

  description: z.string().nullable(),

  imageUrl: z.string().nullable(),

  dueAt: z.string().datetime(),

  completed: z.boolean(),

  scheduled: z.boolean(),

  createdAt: z.string().datetime(),
});

export type Task = z.infer<
  typeof taskSchema
>;

/* -------------------------------------------------------------------------- */
/*                              CREATE TASK                                   */
/* -------------------------------------------------------------------------- */

export const taskCreateSchema = z.object({
  title: z.string().min(
    1,
    "Title is required",
  ),

  description: z
    .string()
    .optional(),

  imageUrl: z
    .string()
    .optional(),

  dueAt: z.string().datetime(
    "Invalid due date",
  ),

  scheduled: z
    .boolean()
    .optional()
    .default(true),
});

export type TaskCreateInput = z.infer<
  typeof taskCreateSchema
>;

/* -------------------------------------------------------------------------- */
/*                              UPDATE TASK                                   */
/* -------------------------------------------------------------------------- */

export const taskUpdateSchema =
  z.object({
    title: z
      .string()
      .min(1)
      .optional(),

    description: z
      .string()
      .nullable()
      .optional(),

    imageUrl: z
      .string()
      .nullable()
      .optional(),

    dueAt: z
      .string()
      .datetime("Invalid due date")
      .optional(),

    scheduled: z
      .boolean()
      .optional(),

    completed: z
      .boolean()
      .optional(),
  });

export type TaskUpdateInput = z.infer<
  typeof taskUpdateSchema
>;

/* -------------------------------------------------------------------------- */
/*                                 TASK STATS                                 */
/* -------------------------------------------------------------------------- */

export const taskStatsSchema =
  z.object({
    total: z.number(),

    pending: z.number(),

    completed: z.number(),

    overdue: z.number(),

    plan: planTypeSchema,

    monthlyTasksUsed: z.number(),

    monthlyLimit: z.number(),
  });

export type TaskStats = z.infer<
  typeof taskStatsSchema
>;

/* -------------------------------------------------------------------------- */
/*                                USER PROFILE                                */
/* -------------------------------------------------------------------------- */

export const userProfileSchema =
  z.object({
    id: z.string(),

    email: z.string(),

    plan: planTypeSchema,

    monthlyTasksUsed: z.number(),

    monthlyLimit: z.number(),
  });

export type UserProfile = z.infer<
  typeof userProfileSchema
>;

/* -------------------------------------------------------------------------- */
/*                              STRIPE CHECKOUT                               */
/* -------------------------------------------------------------------------- */

export const checkoutSessionSchema =
  z.object({
    url: z.string().url(),
  });

export type CheckoutSession =
  z.infer<
    typeof checkoutSessionSchema
  >;