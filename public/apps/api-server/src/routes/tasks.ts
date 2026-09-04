import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { taskCreateSchema, taskUpdateSchema } from "@workspace/api-zod";
import { getAuth } from "@clerk/express";
import {
  assertQuotaAvailable,
  getMonthlyTasksUsed,
  getTaskCounts,
  type Plan,
} from "../services/plan.js";

const router = Router();

async function getUserPlan(userId: string): Promise<Plan> {
  const [row] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return (row?.tier as Plan) ?? "free";
}

// 1. Récupérer toutes les tâches de l'utilisateur connecté
router.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }

  try {
    const userTasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId));
    res.json(userTasks);
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erreur lors de la récupération des tâches" });
  }
});

// 2. Statistiques de l'utilisateur (dashboard) — doit être déclaré AVANT /:id
router.get("/stats", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }

  try {
    const plan = await getUserPlan(userId);
    const [monthlyTasksUsed, counts] = await Promise.all([
      getMonthlyTasksUsed(userId),
      getTaskCounts(userId),
    ]);
    res.json({ plan, monthlyTasksUsed, pending: counts.pending, completed: counts.completed });
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erreur lors de la récupération des statistiques" });
  }
});

// 3. Récupérer une tâche précise (édition)
router.get("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  const taskId = req.params.id;
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }

  try {
    const [task] = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

    if (!task) {
      res.status(404).json({ success: false, code: "NOT_FOUND", message: "Tâche introuvable" });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erreur lors de la récupération de la tâche" });
  }
});

// 4. Créer une nouvelle tâche de rappel
router.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }

  const result = taskCreateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Données invalides", details: result.error.format() });
    return;
  }

  try {
    const plan = await getUserPlan(userId);
    await assertQuotaAvailable(userId, plan);

    const taskId = crypto.randomUUID();
    const newTask = {
      id: taskId,
      userId,
      title: result.data.title,
      description: result.data.description || null,
      imageUrl: result.data.imageUrl || null,
      reminderTime: new Date(result.data.reminderTime),
      isCompleted: false,
      createdAt: new Date(),
    };

    await db.insert(tasksTable).values(newTask);
    res.status(201).json(newTask);
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status === 402) {
      res.status(402).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        message: "Monthly reminder limit reached",
      });
      return;
    }
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erreur lors de la création de la tâche" });
  }
});

// 5. Mettre à jour une tâche existante (Marquer comme complétée, changer l'heure du rappel)
router.patch("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  const taskId = req.params.id;
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }

  const result = taskUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Données invalides", details: result.error.format() });
    return;
  }

  try {
    const updateData: Partial<typeof tasksTable.$inferInsert> = {};
    if (result.data.title !== undefined) updateData.title = result.data.title;
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.imageUrl !== undefined) updateData.imageUrl = result.data.imageUrl;
    if (result.data.isCompleted !== undefined) updateData.isCompleted = result.data.isCompleted;
    if (result.data.reminderTime !== undefined) updateData.reminderTime = new Date(result.data.reminderTime);

    const updated = await db
      .update(tasksTable)
      .set(updateData)
      .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ success: false, code: "NOT_FOUND", message: "Tâche introuvable ou non autorisée" });
      return;
    }

    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erreur lors de la mise à jour" });
  }
});

// 6. Supprimer une tâche (idempotent — voir docs/03-Backend §14)
router.delete("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  const taskId = req.params.id;
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }

  try {
    await db
      .delete(tasksTable)
      .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));
    // Idempotent: absence of a prior row is not an error.
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erreur lors de la suppression" });
  }
});

export default router;
