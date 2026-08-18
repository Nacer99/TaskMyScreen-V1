import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

import {
  useUpdateTask,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey,
} from "@workspace/api-client-react";

import {
  cancelNotificationByTaskId,
  scheduleNotification,
} from "@/lib/notifications";

interface SwMessage {

  type: string;

  taskId?: number | string;

  notificationId?: string;

  minutes?: number;

}

export function useSwMessages() {

  const [, navigate] = useLocation();

  const queryClient = useQueryClient();

  const updateTask = useUpdateTask();

  useEffect(() => {

    if (!("serviceWorker" in navigator)) {

      return;

    }

    const handler = (event: MessageEvent<SwMessage>) => {

      const message = event.data;

      if (!message?.type) {

        return;

      }

      switch (message.type) {

        case "TASK_MARK_DONE": {

          if (!message.taskId) {

            return;

          }

          updateTask.mutate(

            {

              id: message.taskId,

              data: {

                completed: true,

              },

            },

            {

              onSuccess: () => {

                cancelNotificationByTaskId(

                  message.taskId!,

                );

                queryClient.invalidateQueries({

                  queryKey: getListTasksQueryKey(),

                });

                queryClient.invalidateQueries({

                  queryKey: getGetTaskStatsQueryKey(),

                });

              },

            },

          );

          break;

        }

        case "TASK_RESCHEDULE": {

          if (!message.taskId) {

            return;

          }

          navigate(

            `/tasks/${message.taskId}/edit?reschedule=1`,

          );

          break;

        }

        case "TASK_SNOOZE": {

          if (!message.taskId) {

            return;

          }

          navigate(

            `/tasks/${message.taskId}/edit?snooze=1`,

          );

          break;

        }

        case "NAVIGATE_TO_TASK": {

          if (!message.taskId) {

            return;

          }

          navigate(

            `/tasks/${message.taskId}`,

          );

          break;

        }

        case "NOTIFICATION_DISMISSED": {

          break;

        }

        default:

          break;

      }

    };

    navigator.serviceWorker.addEventListener(

      "message",

      handler,

    );

    return () => {

      navigator.serviceWorker.removeEventListener(

        "message",

        handler,

      );

    };

  }, [

    navigate,

    queryClient,

    updateTask,

  ]);

}