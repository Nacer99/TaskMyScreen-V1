/**
 * TaskMyScreen Service Worker
 * Handles personalized notification display and action handling.
 * Also handles PWA Share Target (receiving screenshots from Android share sheet).
 *
 * Notification action buttons depend on the user's plan (passed in notification data.isPro):
 *   FREE: "Mark Done" only
 *   PRO:  "Mark Done" + "Reschedule" + "Snooze 15 min" (up to Notification.maxActions)
 */

const SHARED_MEDIA_CACHE = "taskmyscreen-shared-media-v1";
const SHARED_IMAGE_KEY = "pending-share-image";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ─── Share Target Handler ──────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/share-target" && event.request.method === "POST") {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const imageFile = formData.get("image");

          if (imageFile instanceof File && imageFile.size > 0) {
            const cache = await caches.open(SHARED_MEDIA_CACHE);
            await cache.put(
              SHARED_IMAGE_KEY,
              new Response(imageFile, {
                headers: {
                  "Content-Type": imageFile.type || "image/png",
                  "X-File-Name": imageFile.name || "screenshot.png",
                },
              })
            );
          }
        } catch (err) {
          // Don't block the redirect on error
        }

        return Response.redirect("/tasks/new?share=1", 303);
      })()
    );
    return;
  }
});

// ─── Notification Click ────────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  const isPro = data.isPro === true;

  notification.close();

  if (action === "done") {
    // Post to all open app windows to call the complete API
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: "TASK_MARK_DONE", taskId: data.taskId });
        }
      })
    );

  } else if (action === "reschedule" && isPro) {
    // PRO only: open task edit form in reschedule mode
    const url = data.taskId ? `/tasks/${data.taskId}/edit?reschedule=1` : "/tasks";
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ("focus" in client) {
              client.focus();
              client.postMessage({ type: "NAVIGATE_TO_RESCHEDULE", taskId: data.taskId, url });
              return;
            }
          }
          if (clients.openWindow) return clients.openWindow(url);
        })
    );

  } else if (action === "snooze" && isPro) {
    // PRO only: re-fire notification after 15 minutes
    const snoozeMs = 15 * 60 * 1000;
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          const maxActions = (Notification.maxActions || 2);
          self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
            badge: "/badge-icon.svg",
            image: data.image || undefined,
            vibrate: [100, 50, 100, 50, 200],
            tag: `task-${data.taskId}-snoozed`,
            renotify: true,
            requireInteraction: false,
            actions: [
              { action: "done",       title: "Mark Done" },
              { action: "reschedule", title: "Reschedule" },
              ...(maxActions >= 3 ? [{ action: "snooze", title: "Snooze 15 min" }] : []),
            ],
            data: { ...data, snoozed: true, isPro: true },
          });
          resolve();
        }, snoozeMs);
      })
    );

  } else {
    // Bare tap on notification body — navigate to task list
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ("focus" in client) {
              client.focus();
              client.postMessage({ type: "NAVIGATE_TO_TASK", taskId: data.taskId });
              return;
            }
          }
          if (clients.openWindow) return clients.openWindow(data.url || "/tasks");
        })
    );
  }
});

// ─── Notification Dismissed ───────────────────────────────────────────────────

self.addEventListener("notificationclose", (event) => {
  const data = event.notification.data || {};
  clients.matchAll({ type: "window" }).then((clientList) => {
    for (const client of clientList) {
      client.postMessage({ type: "NOTIFICATION_DISMISSED", taskId: data.taskId });
    }
  });
});

// ─── Message from Main Thread ─────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
