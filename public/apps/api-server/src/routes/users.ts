import { Router } from "express";
import { getAuth } from "@clerk/express";

import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";

import { eq } from "drizzle-orm";

const router = Router();

router.get("/profile", async (req, res) => {

    const { userId } = getAuth(req);

    if (!userId)
        return res.sendStatus(401);

    const rows = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId));

    if (!rows.length)
        return res.sendStatus(404);

    const user = rows[0];

    res.json({

        id: user.id,

        email: user.email,

        plan: user.tier,

        monthlyTasksUsed: user.monthlyTasksUsed,

        monthlyLimit:
            user.tier === "free"
                ? 20
                : Number.MAX_SAFE_INTEGER

    });

});

export default router;