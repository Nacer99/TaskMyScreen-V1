/**
 * When the app loads and the user is signed in, fetches all pending tasks
 * from the API and re-schedules any that have a future dueAt but aren't
 * already registered in localStorage (e.g. after clearing storage or a
 * new device session).
 *
 * PRO status is passed to each notification so Snooze/Reschedule actions
 * are only shown to PRO users.
 */

import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useListTasks, getListTasksQueryKey } from "@workspace/api-client-react";
import { scheduleNotification, getPendingNotifications } from "@/lib/notifications";
import { usePlan } from "@/hooks/use-plan";

export function useRestoreNotificationsFromApi() {
  const { isSignedIn } = useAuth();
  const { isPro } = usePlan();

  const { data: tasks } = useListTasks(
    { status: "pending" },
    {
      query: {
        enabled: isSignedIn === true,
        queryKey: getListTasksQueryKey({ status: "pending" }),
      },
    }
  );

  useEffect(() => {
    if (!tasks || !isSignedIn) return;

    const now = Date.now();
    const alreadyPending = new Set(
      getPendingNotifications().map((n) => String(n.taskId))
    );

    for (const task of tasks) {
      if (!task.dueAt || task.completed) continue;
      if (new Date(task.dueAt).getTime() <= now) continue;
      if (alreadyPending.has(String(task.id))) continue;

      scheduleNotification({
        taskId: task.id,
        title: task.title,
        body: task.description ?? "Your task is due now.",
        imageUrl: task.imageUrl ?? undefined,
        dueAt: task.dueAt,
        isPro,
      });
    }
  }, [tasks, isSignedIn, isPro]);
}
