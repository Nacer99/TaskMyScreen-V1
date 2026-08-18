/* ============================================================================
 * TaskMyScreen Service Worker
 * ----------------------------------------------------------------------------
 * Production Notification Engine
 *
 * Responsibilities
 *  - Service Worker lifecycle
 *  - Share Target
 *  - Notification routing
 *  - Communication with React
 *  - Android support
 * ==========================================================================*/

'use strict';

/* ============================================================================
 * Constants
 * ==========================================================================*/

const CACHE_NAME = "taskmyscreen-share-v2";

const SHARE_IMAGE_KEY = "shared-image";

const APP_ROOT = "/";

const TASKS_URL = "/tasks";

const NEW_TASK_URL = "/tasks/new?share=1";

const DEFAULT_BADGE = "/badge-icon.svg";

const DEFAULT_ICON = "/notification-icon.svg";

const ACTION_DONE = "done";

const ACTION_RESCHEDULE = "reschedule";

const ACTION_SNOOZE = "snooze";

const MESSAGE_TYPES = {

  TASK_DONE: "TASK_MARK_DONE",

  TASK_RESCHEDULE: "TASK_RESCHEDULE",

  TASK_SNOOZE: "TASK_SNOOZE",

  NAVIGATE_TASK: "NAVIGATE_TO_TASK",

  NAVIGATE_RESCHEDULE: "NAVIGATE_TO_RESCHEDULE",

  NOTIFICATION_DISMISSED: "NOTIFICATION_DISMISSED",

  SHOW_NOTIFICATION: "SHOW_NOTIFICATION",

};

/* ============================================================================
 * Install
 * ==========================================================================*/

self.addEventListener("install", (event) => {

  event.waitUntil(self.skipWaiting());

});

/* ============================================================================
 * Activate
 * ==========================================================================*/

self.addEventListener("activate", (event) => {

  event.waitUntil(

    (async () => {

      await clients.claim();

    })(),

  );

});

/* ============================================================================
 * Utilities
 * ==========================================================================*/

async function getClients() {

  return clients.matchAll({

    type: "window",

    includeUncontrolled: true,

  });

}

async function broadcast(message) {

  const list = await getClients();

  for (const client of list) {

    client.postMessage(message);

  }

}

async function focusExistingWindow(url = TASKS_URL) {

  const list = await getClients();

  for (const client of list) {

    if ("focus" in client) {

      await client.focus();

      return client;

    }

  }

  if (clients.openWindow) {

    return clients.openWindow(url);

  }

  return null;

}

/* ============================================================================
 * Share Target
 * ==========================================================================*/

self.addEventListener("fetch", (event) => {

  const request = event.request;

  const url = new URL(request.url);

  if (

    url.pathname === "/share-target" &&

    request.method === "POST"

  ) {

    event.respondWith(handleShareTarget(request));

  }

});

async function handleShareTarget(request) {

  try {

    const formData = await request.formData();

    const image = formData.get("image");

    if (image instanceof File && image.size > 0) {

      const cache = await caches.open(CACHE_NAME);

      await cache.put(

        SHARE_IMAGE_KEY,

        new Response(image, {

          headers: {

            "Content-Type":

              image.type || "image/png",

            "X-File-Name":

              image.name || "shared-image.png",

          },

        }),

      );

    }

  } catch (error) {

    console.error(

      "[SW] Share Target failed",

      error,

    );

  }

  return Response.redirect(

    NEW_TASK_URL,

    303,

  );

}

/* ============================================================================
 * Notification Message API
 * React -> Service Worker
 * ==========================================================================*/

self.addEventListener("message", (event) => {

  const message = event.data;

  if (!message) return;

  switch (message.type) {

    case MESSAGE_TYPES.SHOW_NOTIFICATION:

      event.waitUntil(

        self.registration.showNotification(

          message.title,

          message.options,

        ),

      );

      break;

    default:

      break;

  }

});

/* ============================================================================
 * Part 2 starts here
 * Notification Click
 * Notification Close
 * Android Actions
 * ==========================================================================*/
/* ============================================================================
 * Notification Click
 * ==========================================================================*/

self.addEventListener("notificationclick", (event) => {

  const notification = event.notification;

  const data = notification.data || {};

  const action = event.action || "";

  notification.close();

  event.waitUntil(

    (async () => {

      switch (action) {

        case ACTION_DONE:

          await broadcast({

            type: MESSAGE_TYPES.TASK_DONE,

            taskId: data.taskId,

            notificationId: data.notificationId,

          });

          await focusExistingWindow(TASKS_URL);

          break;

        case ACTION_RESCHEDULE:

          if (data.plan !== "pro") {

            await focusExistingWindow(TASKS_URL);

            break;

          }

          await broadcast({

            type: MESSAGE_TYPES.TASK_RESCHEDULE,

            taskId: data.taskId,

            notificationId: data.notificationId,

          });

          await focusExistingWindow(

            `/tasks/${data.taskId}/edit?reschedule=1`,

          );

          break;

        case ACTION_SNOOZE:

          if (data.plan !== "pro") {

            break;

          }

          await broadcast({

            type: MESSAGE_TYPES.TASK_SNOOZE,

            taskId: data.taskId,

            notificationId: data.notificationId,

            minutes: 15,

          });

          break;

        default:

          await broadcast({

            type: MESSAGE_TYPES.NAVIGATE_TASK,

            taskId: data.taskId,

          });

          await focusExistingWindow(

            data.url || TASKS_URL,

          );

          break;

      }

    })(),

  );

});

/* ============================================================================
 * Notification Closed
 * ==========================================================================*/

self.addEventListener(

  "notificationclose",

  (event) => {

    const data = event.notification.data || {};

    event.waitUntil(

      broadcast({

        type: MESSAGE_TYPES.NOTIFICATION_DISMISSED,

        taskId: data.taskId,

        notificationId: data.notificationId,

      }),

    );

  },

);

/* ============================================================================
 * Notification Helpers
 * ==========================================================================*/

async function showNotification(title, options) {

  return self.registration.showNotification(

    title,

    options,

  );

}

async function closeNotification(tag) {

  const notifications =

    await self.registration.getNotifications({

      tag,

    });

  for (const notification of notifications) {

    notification.close();

  }

}

async function closeTaskNotification(taskId) {

  return closeNotification(

    `task-${taskId}`,

  );

}

/* ============================================================================
 * Part 3 starts here
 * Future Android extensions
 * Cleanup
 * Background Sync
 * ==========================================================================*/
/* ============================================================================
 * Android Helpers
 * ==========================================================================*/

async function reopenTask(taskId) {

  const url = taskId
    ? `/tasks/${taskId}`
    : TASKS_URL;

  await focusExistingWindow(url);

}

async function reopenTaskEditor(taskId) {

  const url = taskId
    ? `/tasks/${taskId}/edit`
    : TASKS_URL;

  await focusExistingWindow(url);

}

/* ============================================================================
 * Cache Utilities
 * ==========================================================================*/

async function clearSharedImage() {

  const cache = await caches.open(CACHE_NAME);

  await cache.delete(SHARE_IMAGE_KEY);

}

async function getSharedImage() {

  const cache = await caches.open(CACHE_NAME);

  return cache.match(SHARE_IMAGE_KEY);

}

/* ============================================================================
 * Future Background Sync
 * ==========================================================================*/

self.addEventListener("sync", (event) => {

  switch (event.tag) {

    case "taskmyscreen-sync":

      event.waitUntil(

        (async () => {

          await broadcast({

            type: "SYNC_REQUEST",

          });

        })(),

      );

      break;

    default:

      break;

  }

});

/* ============================================================================
 * Push (reserved for future native gateway)
 * ==========================================================================*/

self.addEventListener("push", (event) => {

  if (!event.data) {

    return;

  }

  event.waitUntil(

    (async () => {

      try {

        const payload = event.data.json();

        await showNotification(

          payload.title,

          payload.options,

        );

      }

      catch {

        await showNotification(

          "TaskMyScreen",

          {

            body: event.data.text(),

            icon: DEFAULT_ICON,

            badge: DEFAULT_BADGE,

          },

        );

      }

    })(),

  );

});

/* ============================================================================
 * Notification Errors
 * ==========================================================================*/

self.addEventListener("error", (event) => {

  console.error(

    "[SW]",

    event.message,

  );

});

self.addEventListener(

  "unhandledrejection",

  (event) => {

    console.error(

      "[SW]",

      event.reason,

    );

  },

);

/* ============================================================================
 * Exposed helpers
 * ==========================================================================*/

self.TaskMyScreenSW = {

  showNotification,

  closeNotification,

  closeTaskNotification,

  clearSharedImage,

  getSharedImage,

};

/* ============================================================================
 * End of File
 * ==========================================================================*/