export type NotificationPlan =
  | "free"
  | "pro"
  | "lifetime";

export type NotificationStatus =
  | "pending"
  | "scheduled"
  | "displayed"
  | "dismissed"
  | "completed"
  | "cancelled"
  | "expired";

export type NotificationAction =
  | "MARK_DONE"
  | "RESCHEDULE"
  | "SNOOZE_15";

export interface NotificationActionButton {
  action: NotificationAction;
  title: string;
}

export interface NotificationTask {
  /**
   * Unique notification identifier
   * Example:
   * notif-task-42
   */
  id: string;

  /**
   * Original task id
   */
  taskId: string | number;

  /**
   * Notification title
   */
  title: string;

  /**
   * Notification body
   */
  body: string;

  /**
   * Optional large image
   */
  imageUrl?: string;

  /**
   * ISO reminder date
   */
  dueAt: string;

  /**
   * User subscription plan
   */
  plan: NotificationPlan;

  /**
   * Current notification state
   */
  status: NotificationStatus;

  /**
   * Available notification actions
   */
  actions: NotificationActionButton[];

  /**
   * Number of snoozes already used
   */
  snoozeCount: number;

  /**
   * Version of notification model
   */
  version: number;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Last update timestamp
   */
  updatedAt: string;

  /**
   * Last display timestamp
   */
  lastTriggeredAt?: string;
}

export interface NotificationTheme {
  icon: string;
  badge: string;
  vibrate: number[];
  requireInteraction: boolean;
}

export interface NotificationScheduleResult {
  notificationId: string;
  scheduled: boolean;
}

export interface NotificationEngineState {
  pending: number;
  scheduled: number;
  displayed: number;
}

export interface NotificationStorageAdapter {
  list(): NotificationTask[];

  save(notification: NotificationTask): void;

  update(notification: NotificationTask): void;

  remove(id: string): void;

  clear(): void;

  find(id: string): NotificationTask | undefined;

  findByTaskId(
    taskId: string | number,
  ): NotificationTask | undefined;
}