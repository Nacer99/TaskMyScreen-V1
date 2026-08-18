import { Router } from "express";

import { getAuth } from "@clerk/express";

import { db } from "@workspace/db";

import {
    tasksTable,
    usersTable
} from "@workspace/db/schema";

import {
    eq
} from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {

    const { userId } = getAuth(req);

    if (!userId)
        return res.sendStatus(401);

    const tasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.userId, userId));

    const user = (
        await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId))
    )[0];

    const completed =
        tasks.filter(t => t.isCompleted).length;

    res.json({

        total: tasks.length,

        pending:
            tasks.length - completed,

        completed,

        plan: user.tier,

        monthlyTasksUsed:
            user.monthlyTasksUsed,

        monthlyLimit:
            user.tier === "free"
                ? 20
                : Number.MAX_SAFE_INTEGER

    });

});

export default router;