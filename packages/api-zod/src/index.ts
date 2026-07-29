import { z } from "zod";

// Validation pour la création et la mise à jour d'une tâche
export const taskCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
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

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type UserSyncInput = z.infer<typeof userSyncSchema>;