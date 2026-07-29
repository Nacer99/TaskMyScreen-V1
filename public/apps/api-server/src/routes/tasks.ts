import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { taskCreateSchema, taskUpdateSchema } from "@workspace/api-zod";
import { getAuth } from "@clerk/express";

const router = Router();

// 1. Récupérer toutes les tâches de l'utilisateur connecté
router.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  try {
    const userTasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId));
    res.json(userTasks);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des tâches" });
  }
});

// 2. Créer une nouvelle tâche de rappel (Vérification Freemium vs Pro gérée côté frontend/serveur)
router.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  const result = taskCreateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Données invalides", details: result.error.format() });
    return;
  }

  try {
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
    res.status(500).json({ error: "Erreur lors de la création de la tâche" });
  }
});

// 3. Mettre à jour une tâche existante (Marquer comme complétée, changer l'heure du rappel)
router.patch("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  const taskId = req.params.id;
  if (!userId) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  const result = taskUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Données invalides", details: result.error.format() });
    return;
  }

  try {
    const updateData: any = {};
    if (result.data.title !== undefined) updateData.title = result.data.title;
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.isCompleted !== undefined) updateData.isCompleted = result.data.isCompleted;
    if (result.data.reminderTime !== undefined) updateData.reminderTime = new Date(result.data.reminderTime);

    const updated = await db
      .update(tasksTable)
      .set(updateData)
      .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: "Tâche introuvable ou non autorisée" });
      return;
    }

    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

export default router;