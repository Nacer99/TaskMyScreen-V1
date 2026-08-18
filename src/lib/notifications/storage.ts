import {
  STORAGE_KEY,
} from "./constants";

import type {
  NotificationStorageAdapter,
  NotificationTask,
} from "./types";

function readStorage(): NotificationTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as NotificationTask[];
  } catch (error) {
    console.error(
      "[NotificationStorage] Failed to read storage",
      error,
    );

    return [];
  }
}

function writeStorage(
  notifications: NotificationTask[],
): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications),
    );
  } catch (error) {
    console.error(
      "[NotificationStorage] Failed to write storage",
      error,
    );
  }
}

class LocalNotificationStorage
  implements NotificationStorageAdapter
{
  list(): NotificationTask[] {
    return readStorage();
  }

  save(
    notification: NotificationTask,
  ): void {
    const notifications = readStorage();

    const index = notifications.findIndex(
      (item) => item.id === notification.id,
    );

    if (index >= 0) {
      notifications[index] = notification;
    } else {
      notifications.push(notification);
    }

    writeStorage(notifications);
  }

  update(
    notification: NotificationTask,
  ): void {
    this.save(notification);
  }

  remove(id: string): void {
    const notifications = readStorage();

    writeStorage(
      notifications.filter(
        (item) => item.id !== id,
      ),
    );
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  find(
    id: string,
  ): NotificationTask | undefined {
    return readStorage().find(
      (item) => item.id === id,
    );
  }

  findByTaskId(
    taskId: string | number,
  ): NotificationTask | undefined {
    return readStorage().find(
      (item) =>
        String(item.taskId) ===
        String(taskId),
    );
  }

  exists(id: string): boolean {
    return this.find(id) !== undefined;
  }

  count(): number {
    return readStorage().length;
  }

  replaceAll(
    notifications: NotificationTask[],
  ): void {
    writeStorage(notifications);
  }

  pending(): NotificationTask[] {
    return readStorage().filter(
      (item) =>
        item.status === "pending" ||
        item.status === "scheduled",
    );
  }

  displayed(): NotificationTask[] {
    return readStorage().filter(
      (item) =>
        item.status === "displayed",
    );
  }

  completed(): NotificationTask[] {
    return readStorage().filter(
      (item) =>
        item.status === "completed",
    );
  }

  cancelled(): NotificationTask[] {
    return readStorage().filter(
      (item) =>
        item.status === "cancelled",
    );
  }
}

export const notificationStorage =
  new LocalNotificationStorage();