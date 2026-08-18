import { useEffect } from "react";

import { useAuth } from "@clerk/react";

import {
  useListTasks,
} from "@workspace/api-client-react";

import {
  getNotification,
  restoreNotifications,
  scheduleTask,
} from "@/lib/notifications";

import { usePlan } from "@/hooks/use-plan";

export function useRestoreNotificationsFromApi() {
  const { isSignedIn } = useAuth();

  const { plan } = usePlan();

  const { data: tasks } = useListTasks(
    {
      status: "pending",
    },
    {
      query: {
        enabled: isSignedIn === true,
      },
    },
  );

  /**
   * Restore notifications already persisted
   * by the new notification engine.
   */
  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    restoreNotifications();
  }, [isSignedIn]);

  /**
   * Synchronize pending API tasks with the
   * notification engine.
   */
  useEffect(() => {
    if (!isSignedIn || !tasks?.length) {
      return;
    }

    const now = Date.now();

    for (const task of tasks) {
      if (task.completed) {
        continue;
      }

      if (!task.dueAt) {
        continue;
      }

      const dueAt = new Date(task.dueAt).getTime();

      if (Number.isNaN(dueAt) || dueAt <= now) {
        continue;
      }

      /**
       * Prevent duplicate notifications.
       *
       * The notification engine uses the task ID as
       * the stable notification identity.
       */
      const existing = getNotification(task.id);

      if (
        existing &&
        (
          existing.status === "pending" ||
          existing.status === "scheduled" ||
          existing.status === "displayed"
        )
      ) {
        continue;
      }

      scheduleTask({
        taskId: task.id,
        title: task.title,
        body:
          task.description ||
          "Task reminder",
        imageUrl:
          task.imageUrl ||
          undefined,
        dueAt: task.dueAt,
        plan,
      });
    }
  }, [
    isSignedIn,
    tasks,
    plan,
  ]);
}