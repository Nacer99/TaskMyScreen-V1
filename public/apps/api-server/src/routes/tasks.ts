import { Router } from "express";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { getAuth } from "@clerk/express";

import { db } from "@workspace/db";
import { tasksTable, usersTable } from "@workspace/db/schema";

import {
  taskCreateSchema,
  taskUpdateSchema,
} from "@workspace/api-zod";

const router = Router();

const FREE_MONTHLY_TASK_LIMIT = 20;

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function getAuthenticatedUserId(req: any): string | null {
  const { userId } = getAuth(req);
  return userId ?? null;
}

function getMonthBoundaries(): {
  start: Date;
  end: Date;
} {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0,
    0,
  );

  return { start, end };
}

/* -------------------------------------------------------------------------- */
/*                              GET /api/tasks                                */
/* -------------------------------------------------------------------------- */

router.get("/", async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  }

  try {
    const userTasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId))
      .orderBy(tasksTable.dueAt);

    res.status(200).json(userTasks);
  } catch (error) {
    console.error("[TASKS] Failed to list tasks:", error);

    res.status(500).json({
      error: "Failed to retrieve tasks",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                           GET /api/tasks/stats                             */
/* -------------------------------------------------------------------------- */

router.get("/stats", async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  }

  try {
    const userTasks = await db
      .select({
        id: tasksTable.id,
        dueAt: tasksTable.dueAt,
        isCompleted: tasksTable.isCompleted,
        createdAt: tasksTable.createdAt,
      })
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId));

    const now = new Date();

    const total = userTasks.length;

    const completed = userTasks.filter(
      (task) => task.isCompleted,
    ).length;

    const pending = userTasks.filter(
      (task) => !task.isCompleted,
    ).length;

    const overdue = userTasks.filter(
      (task) =>
        !task.isCompleted &&
        task.dueAt instanceof Date &&
        task.dueAt < now,
    ).length;

    res.status(200).json({
      total,
      pending,
      completed,
      overdue,
    });
  } catch (error) {
    console.error(
      "[TASKS] Failed to retrieve task statistics:",
      error,
    );

    res.status(500).json({
      error: "Failed to retrieve task statistics",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                            GET /api/tasks/:id                              */
/* -------------------------------------------------------------------------- */

router.get("/:id", async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  }

  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    res.status(400).json({
      error: "Invalid task id",
    });
    return;
  }

  try {
    const result = await db
      .select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.id, taskId),
          eq(tasksTable.userId, userId),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      res.status(404).json({
        error: "Task not found",
      });
      return;
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error(
      "[TASKS] Failed to retrieve task:",
      error,
    );

    res.status(500).json({
      error: "Failed to retrieve task",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                            POST /api/tasks                                 */
/* -------------------------------------------------------------------------- */

router.post("/", async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  }

  const parsed = taskCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid task data",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    /* ---------------------------------------------------------------------- */
    /*                         Retrieve user plan                             */
    /* ---------------------------------------------------------------------- */

    const userResult = await db
      .select({
        tier: usersTable.tier,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      res.status(404).json({
        error: "User profile not found",
      });
      return;
    }

    const tier = userResult[0].tier ?? "free";

    /* ---------------------------------------------------------------------- */
    /*                     Enforce Free monthly limit                        */
    /* ---------------------------------------------------------------------- */

    if (tier === "free") {
      const { start, end } = getMonthBoundaries();

      const monthlyCountResult = await db
        .select({
          total: count(),
        })
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.userId, userId),
            gte(tasksTable.createdAt, start),
            lt(tasksTable.createdAt, end),
          ),
        );

      const monthlyCount = Number(
        monthlyCountResult[0]?.total ?? 0,
      );

      if (monthlyCount >= FREE_MONTHLY_TASK_LIMIT) {
        res.status(402).json({
          error: "Monthly task limit reached",
          code: "MONTHLY_LIMIT_REACHED",
          limit: FREE_MONTHLY_TASK_LIMIT,
          used: monthlyCount,
          tier: "free",
        });
        return;
      }
    }

    /* ---------------------------------------------------------------------- */
    /*                             Create task                                */
    /* ---------------------------------------------------------------------- */

    const newTask = {
      userId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      dueAt: new Date(parsed.data.dueAt),
      isCompleted: false,
      createdAt: new Date(),
    };

    const inserted = await db
      .insert(tasksTable)
      .values(newTask)
      .returning();

    if (inserted.length === 0) {
      res.status(500).json({
        error: "Task creation failed",
      });
      return;
    }

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error(
      "[TASKS] Failed to create task:",
      error,
    );

    res.status(500).json({
      error: "Failed to create task",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                           PATCH /api/tasks/:id                             */
/* -------------------------------------------------------------------------- */

router.patch("/:id", async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  }

  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    res.status(400).json({
      error: "Invalid task id",
    });
    return;
  }

  const parsed = taskUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid task data",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const updateData: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) {
      updateData.title = parsed.data.title;
    }

    if (parsed.data.description !== undefined) {
      updateData.description =
        parsed.data.description;
    }

    if (parsed.data.imageUrl !== undefined) {
      updateData.imageUrl = parsed.data.imageUrl;
    }

    if (parsed.data.dueAt !== undefined) {
      updateData.dueAt = new Date(
        parsed.data.dueAt,
      );
    }

    if (parsed.data.completed !== undefined) {
      updateData.isCompleted =
        parsed.data.completed;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        error: "No fields to update",
      });
      return;
    }

    const updated = await db
      .update(tasksTable)
      .set(updateData)
      .where(
        and(
          eq(tasksTable.id, taskId),
          eq(tasksTable.userId, userId),
        ),
      )
      .returning();

    if (updated.length === 0) {
      res.status(404).json({
        error: "Task not found",
      });
      return;
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.error(
      "[TASKS] Failed to update task:",
      error,
    );

    res.status(500).json({
      error: "Failed to update task",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                           DELETE /api/tasks/:id                            */
/* -------------------------------------------------------------------------- */

router.delete("/:id", async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({
      error: "Unauthorized",
    });
    return;
  }

  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    res.status(400).json({
      error: "Invalid task id",
    });
    return;
  }

  try {
    const deleted = await db
      .delete(tasksTable)
      .where(
        and(
          eq(tasksTable.id, taskId),
          eq(tasksTable.userId, userId),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({
        error: "Task not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      task: deleted[0],
    });
  } catch (error) {
    console.error(
      "[TASKS] Failed to delete task:",
      error,
    );

    res.status(500).json({
      error: "Failed to delete task",
    });
  }
});

export default router;