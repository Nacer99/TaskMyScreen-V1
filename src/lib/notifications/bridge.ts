import { SW_PATH } from "./constants";

import type {
  NotificationTask,
} from "./types";

import {
  buildNotification,
} from "./renderer";

let registration:
  | ServiceWorkerRegistration
  | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  if (registration) {
    return registration;
  }

  registration =
    await navigator.serviceWorker.register(
      SW_PATH,
      {
        scope: "/",
      },
    );

  await navigator.serviceWorker.ready;

  return registration;
}

export async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  if (registration) {
    return registration;
  }

  registration =
    await navigator.serviceWorker.ready;

  return registration;
}

export async function showNotification(
  notification: NotificationTask,
): Promise<void> {
  const sw =
    await getRegistration();

  const rendered =
    buildNotification(notification);

  if (sw) {
    await sw.showNotification(
      rendered.title,
      rendered.options,
    );

    return;
  }

  if (
    Notification.permission !==
    "granted"
  ) {
    return;
  }

  new Notification(
    rendered.title,
    rendered.options,
  );
}

export async function postMessage(
  message: unknown,
): Promise<void> {
  const sw =
    await getRegistration();

  if (!sw?.active) {
    return;
  }

  sw.active.postMessage(message);
}

export async function closeNotification(
  tag: string,
): Promise<void> {
  const sw =
    await getRegistration();

  if (!sw) {
    return;
  }

  const notifications =
    await sw.getNotifications({
      tag,
    });

  notifications.forEach((notification) =>
    notification.close(),
  );
}

export async function closeTaskNotification(
  taskId: string | number,
): Promise<void> {
  return closeNotification(
    `task-${taskId}`,
  );
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (
    !("Notification" in window)
  ) {
    return "denied";
  }

  if (
    Notification.permission ===
    "granted"
  ) {
    return "granted";
  }

  if (
    Notification.permission ===
    "denied"
  ) {
    return "denied";
  }

  return Notification.requestPermission();
}

export function getPermission(): NotificationPermission {
  if (
    !("Notification" in window)
  ) {
    return "denied";
  }

  return Notification.permission;
}