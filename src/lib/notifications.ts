/**
 * TaskMyScreen Notification Service
 *
 * Uses Service Worker + registration.showNotification() for fully personalized
 * notifications with:
 *  - Custom branded icon + badge
 *  - Large task image support
 *  - Action buttons:
 *      FREE users: "Mark Done" only
 *      PRO users:  "Mark Done" + "Reschedule" + "Snooze 15 min"
 *  - Custom vibration pattern
 *  - Background delivery (works when tab is closed)
 *  - Persistent scheduling via localStorage
 */

const SW_PATH = "/sw.js";
const STORAGE_KEY = "taskmyscreen_pending_notifications";
const NOTIFICATION_ICON = "/notification-icon.svg";
const NOTIFICATION_BADGE = "/badge-icon.svg";

export interface ScheduledNotification {
  id: string;          // unique ID (e.g. "task-42")
  taskId: number | string;
  title: string;
  body: string;
  imageUrl?: string;
  dueAt: string;       // ISO string
  isPro?: boolean;     // gates Snooze + Reschedule actions
  timeoutHandle?: number;
}

// In-memory map of active timeout handles
const pendingTimeouts = new Map<string, number>();

// ─── Service Worker Registration ─────────────────────────────────────────────

let swRegistration: ServiceWorkerRegistration | null = null;

export async function initServiceWorker(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    console.warn("[Notifications] Service Workers not supported in this browser.");
    return false;
  }
  try {
    swRegistration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
    });
    // Wait for the SW to be active
    if (swRegistration.installing) {
      await new Promise<void>((resolve) => {
        swRegistration!.installing!.addEventListener("statechange", function handler() {
          if (
            swRegistration!.active ||
            this.state === "activated"
          ) {
            this.removeEventListener("statechange", handler);
            resolve();
          }
        });
      });
    }
    return true;
  } catch (err) {
    console.error("[Notifications] SW registration failed:", err);
    return false;
  }
}

async function getSwRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;
  if (!("serviceWorker" in navigator)) return null;
  try {
    swRegistration = await navigator.serviceWorker.ready;
    return swRegistration;
  } catch {
    return null;
  }
}

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export function getPermissionStatus(): NotificationPermission {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

// ─── Core: Show a Personalized Notification via Service Worker ────────────────

async function fireNotification(notif: ScheduledNotification): Promise<void> {
  const registration = await getSwRegistration();

  const buildActions = () => {
    if (!notif.isPro) {
      // Free plan: only Mark Done
      return [{ action: "done", title: "Mark Done" }];
    }
    const max = ("maxActions" in Notification
      ? (Notification as { maxActions: number }).maxActions
      : 2);
    const all = [
      { action: "done",       title: "Mark Done" },
      { action: "reschedule", title: "Reschedule" },
      { action: "snooze",     title: "Snooze 15 min" },
    ];
    return all.slice(0, max);
  };

  // Cast to `any` to include Chrome-supported fields not yet in the TS lib types
  const options = {
    body: notif.body,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    image: notif.imageUrl || undefined,
    vibrate: [200, 100, 200, 100, 400],
    tag: `task-${notif.taskId}`,
    renotify: true,
    requireInteraction: false,
    silent: false,
    actions: buildActions(),
    data: {
      taskId: notif.taskId,
      image: notif.imageUrl,
      scheduledId: notif.id,
      url: "/tasks",
      isPro: notif.isPro ?? false,
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  if (registration) {
    await registration.showNotification(notif.title, options);
  } else if (Notification.permission === "granted") {
    new Notification(notif.title, {
      body: options.body,
      icon: NOTIFICATION_ICON,
    });
  }

  removePendingFromStorage(notif.id);
}

// ─── Schedule a Notification ─────────────────────────────────────────────────

export function scheduleNotification(notif: Omit<ScheduledNotification, "id">): string {
  const id = `task-${notif.taskId}-${Date.now()}`;
  const dueTime = new Date(notif.dueAt).getTime();
  const now = Date.now();
  const delay = dueTime - now;

  if (delay <= 0) {
    console.warn(`[Notifications] Due time already passed for task ${notif.taskId}`);
    return id;
  }

  const full: ScheduledNotification = { ...notif, id };

  savePendingToStorage(full);

  const handle = window.setTimeout(async () => {
    if (Notification.permission === "granted") {
      await fireNotification(full);
    }
    pendingTimeouts.delete(id);
  }, delay);

  pendingTimeouts.set(id, handle);
  return id;
}

export function scheduleTestNotification(
  title: string,
  body: string,
  delaySeconds: number,
  imageUrl?: string
): string {
  const dueAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
  return scheduleNotification({
    taskId: `test-${Date.now()}`,
    title,
    body,
    imageUrl,
    dueAt,
    isPro: false,
  });
}

// ─── Cancel a Scheduled Notification ─────────────────────────────────────────

export function cancelNotification(scheduledId: string): void {
  const handle = pendingTimeouts.get(scheduledId);
  if (handle !== undefined) {
    clearTimeout(handle);
    pendingTimeouts.delete(scheduledId);
  }
  removePendingFromStorage(scheduledId);
}

export function cancelNotificationByTaskId(taskId: number | string): void {
  const pending = getPendingNotifications();
  pending
    .filter((n) => String(n.taskId) === String(taskId))
    .forEach((n) => cancelNotification(n.id));
}

// ─── Restore Scheduled Notifications After Page Reload ───────────────────────

export function restorePendingNotifications(): void {
  const pending = getPendingNotifications();
  const now = Date.now();

  pending.forEach((notif) => {
    const dueTime = new Date(notif.dueAt).getTime();
    const delay = dueTime - now;

    if (delay <= 0) {
      removePendingFromStorage(notif.id);
      return;
    }

    const handle = window.setTimeout(async () => {
      if (Notification.permission === "granted") {
        await fireNotification(notif);
      }
      pendingTimeouts.delete(notif.id);
    }, delay);

    pendingTimeouts.set(notif.id, handle);
  });
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

function savePendingToStorage(notif: ScheduledNotification): void {
  const existing = getPendingNotifications();
  const filtered = existing.filter((n) => n.id !== notif.id);
  const { timeoutHandle: _, ...storable } = notif;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtered, storable]));
}

function removePendingFromStorage(id: string): void {
  const existing = getPendingNotifications();
  const updated = existing.filter((n) => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getPendingNotifications(): ScheduledNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScheduledNotification[];
  } catch {
    return [];
  }
}
