export type TaskListStatus = "pending" | "completed" | "all";

export const getListTasksQueryKey = (params?: { status?: TaskListStatus }) =>
  ["tasks", "list", params?.status ?? "all"] as const;

export const getGetTaskQueryKey = (id: string) => ["tasks", "detail", id] as const;

export const getGetTaskStatsQueryKey = () => ["tasks", "stats"] as const;

export const getGetUserProfileQueryKey = () => ["users", "profile"] as const;
