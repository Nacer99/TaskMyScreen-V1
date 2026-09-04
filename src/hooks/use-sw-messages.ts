/**
 * Listens for messages posted by the Service Worker and routes them into the app.
 *
 * Handled message types:
 *  TASK_MARK_DONE       — calls the complete-task API for the given taskId
 *  NAVIGATE_TO_TASK     — navigates to the task edit page
 *  NAVIGATE_TO_RESCHEDULE — navigates to the task edit page in reschedule mode
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  useCompleteTask,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cancelNotificationByTaskId } from "@/lib/notifications";

export function useSwMessages() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { mutate: completeTask } = useCompleteTask();

  // Refs so the effect closure never goes stale
  const setLocationRef = useRef(setLocation);
  setLocationRef.current = setLocation;
  const completeTaskRef = useRef(completeTask);
  completeTaskRef.current = completeTask;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      const msg = event.data as {
        type: string;
        taskId?: number | string;
        url?: string;
      };
      if (!msg?.type) return;

      switch (msg.type) {
        case "TASK_MARK_DONE": {
          // Task ids are backend-generated UUID strings — never coerce to Number.
          const id = msg.taskId != null ? String(msg.taskId) : undefined;
          if (!id) return;
          completeTaskRef.current(
            { id, data: { completed: true } },
            {
              onSuccess: () => {
                cancelNotificationByTaskId(id);
                queryClientRef.current.invalidateQueries({
                  queryKey: getListTasksQueryKey(),
                });
                queryClientRef.current.invalidateQueries({
                  queryKey: getGetTaskStatsQueryKey(),
                });
              },
            }
          );
          break;
        }
        case "NAVIGATE_TO_TASK":
          if (msg.taskId) setLocationRef.current(`/tasks/${msg.taskId}/edit`);
          break;
        case "NAVIGATE_TO_RESCHEDULE":
          if (msg.taskId)
            setLocationRef.current(`/tasks/${msg.taskId}/edit?reschedule=1`);
          break;
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []); // stable — deps accessed via refs
}
