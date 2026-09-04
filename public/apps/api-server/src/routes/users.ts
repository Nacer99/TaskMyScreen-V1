import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { ensureUser, getMonthlyTasksUsed, type Plan } from "../services/plan.js";

const router = Router();

// GET /api/users/profile — upserts the Clerk user into `users` on first sight,
// then returns the plan/quota fields the frontend needs (use-plan.ts).
router.get("/profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Non autorisé" });
    return;
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";

    const user = await ensureUser(userId, email);
    const monthlyTasksUsed = await getMonthlyTasksUsed(userId);

    res.json({
      id: user.id,
      email: user.email,
      plan: user.tier as Plan,
      monthlyTasksUsed,
    });
  } catch (error) {
    res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erreur lors de la récupération du profil" });
  }
});

export default router;
