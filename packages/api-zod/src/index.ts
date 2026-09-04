import { z } from "zod";

// Validation pour la création et la mise à jour d'une tâche
export const taskCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(150, "150 caractères maximum"),
  description: z.string().max(2000, "2000 caractères maximum").optional(),
  // Accepts absolute URLs as well as the relative object-storage paths returned
  // by POST /api/storage/upload (e.g. "/tasks/<uuid>.jpg") — not restricted to
  // z.string().url() since the app never stores third-party absolute URLs.
  imageUrl: z.string().min(1).optional().nullable(),
  reminderTime: z.string().datetime("La date de rappel doit être un format ISO valide"),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  isCompleted: z.boolean().optional(),
});

// Validation pour l'utilisateur
export const userSyncSchema = z.object({
  id: z.string().min(1),
  email: z.string().email("Email invalide"),
});

export const checkoutSchema = z.object({
  priceType: z.enum(["monthly", "annual", "lifetime"]),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type UserSyncInput = z.infer<typeof userSyncSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;