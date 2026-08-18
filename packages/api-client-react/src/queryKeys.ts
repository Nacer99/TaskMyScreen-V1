export type TaskStatus = "pending" | "completed";

export const getListTasksQueryKey = (
  params?: { status?: TaskStatus }
) => ["tasks", params ?? {}] as const;

export const getGetTaskQueryKey = (
  id: string | number
) => ["task", String(id)] as const;

export const getGetTaskStatsQueryKey = () =>
  ["task-stats"] as const;

export const getGetUserProfileQueryKey = () =>
  ["user-profile"] as const;