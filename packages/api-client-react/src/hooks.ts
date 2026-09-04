import { useAuth } from "@clerk/react";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiRequest, type GetToken } from "./client";
import {
  getGetTaskQueryKey,
  getGetTaskStatsQueryKey,
  getGetUserProfileQueryKey,
  getListTasksQueryKey,
  type TaskListStatus,
} from "./queryKeys";
import {
  mapTask,
  toApiTaskPayload,
  type ApiTask,
  type CaptureResult,
  type CheckoutSession,
  type PriceType,
  type Task,
  type TaskCreateInput,
  type TaskStats,
  type TaskUpdateInput,
  type UserProfile,
} from "./types";

function useGetToken(): GetToken {
  const { getToken } = useAuth();
  return () => getToken();
}

type QueryOpts<T> = { query?: Partial<UseQueryOptions<T>> };
type MutationOpts<TData, TVars> = { mutation?: Partial<UseMutationOptions<TData, unknown, TVars>> };

// ─── Tasks: list / detail / stats ──────────────────────────────────────────

export function useListTasks(
  params?: { status?: TaskListStatus },
  options?: QueryOpts<Task[]>
) {
  const getToken = useGetToken();
  const status = params?.status ?? "all";
  return useQuery<Task[]>({
    queryKey: getListTasksQueryKey(params),
    queryFn: async () => {
      const all = await apiRequest<ApiTask[]>("/tasks", { getToken });
      const mapped = all.map(mapTask);
      if (status === "all") return mapped;
      return mapped.filter((t) => (status === "completed" ? t.completed : !t.completed));
    },
    ...options?.query,
  });
}

export function useGetTask(id: string, options?: QueryOpts<Task>) {
  const getToken = useGetToken();
  return useQuery<Task>({
    queryKey: getGetTaskQueryKey(id),
    queryFn: async () => mapTask(await apiRequest<ApiTask>(`/tasks/${id}`, { getToken })),
    ...options?.query,
  });
}

export function useGetTaskStats(options?: QueryOpts<TaskStats>) {
  const getToken = useGetToken();
  return useQuery<TaskStats>({
    queryKey: getGetTaskStatsQueryKey(),
    queryFn: () => apiRequest<TaskStats>("/tasks/stats", { getToken }),
    ...options?.query,
  });
}

export function useGetUserProfile(options?: QueryOpts<UserProfile>) {
  const getToken = useGetToken();
  return useQuery<UserProfile>({
    queryKey: getGetUserProfileQueryKey(),
    queryFn: () => apiRequest<UserProfile>("/users/profile", { getToken }),
    ...options?.query,
  });
}

// ─── Tasks: mutations ───────────────────────────────────────────────────────

export function useCreateTask(options?: MutationOpts<Task, { data: TaskCreateInput }>) {
  const getToken = useGetToken();
  return useMutation<Task, unknown, { data: TaskCreateInput }>({
    mutationFn: async ({ data }) =>
      mapTask(
        await apiRequest<ApiTask>("/tasks", {
          method: "POST",
          body: toApiTaskPayload(data),
          getToken,
        })
      ),
    ...options?.mutation,
  });
}

export function useUpdateTask(
  options?: MutationOpts<Task, { id: string; data: TaskUpdateInput }>
) {
  const getToken = useGetToken();
  return useMutation<Task, unknown, { id: string; data: TaskUpdateInput }>({
    mutationFn: async ({ id, data }) =>
      mapTask(
        await apiRequest<ApiTask>(`/tasks/${id}`, {
          method: "PATCH",
          body: toApiTaskPayload(data),
          getToken,
        })
      ),
    ...options?.mutation,
  });
}

export function useCompleteTask(
  options?: MutationOpts<Task, { id: string; data: { completed: boolean } }>
) {
  const getToken = useGetToken();
  return useMutation<Task, unknown, { id: string; data: { completed: boolean } }>({
    mutationFn: async ({ id, data }) =>
      mapTask(
        await apiRequest<ApiTask>(`/tasks/${id}`, {
          method: "PATCH",
          body: { isCompleted: data.completed },
          getToken,
        })
      ),
    ...options?.mutation,
  });
}

export function useDeleteTask(options?: MutationOpts<void, { id: string }>) {
  const getToken = useGetToken();
  return useMutation<void, unknown, { id: string }>({
    mutationFn: async ({ id }) => {
      await apiRequest<void>(`/tasks/${id}`, { method: "DELETE", getToken });
    },
    ...options?.mutation,
  });
}

// ─── Billing ────────────────────────────────────────────────────────────────

export function useCreateCheckoutSession(
  options?: MutationOpts<CheckoutSession, { data: { priceType: PriceType } }>
) {
  const getToken = useGetToken();
  return useMutation<CheckoutSession, unknown, { data: { priceType: PriceType } }>({
    mutationFn: ({ data }) =>
      apiRequest<CheckoutSession>("/billing/checkout", {
        method: "POST",
        body: data,
        getToken,
      }),
    ...options?.mutation,
  });
}

/**
 * Confirms a payment server-side after the payment provider (PayPal)
 * redirects the user back to the app. The frontend never marks a user as
 * Pro/Lifetime on its own — only this call, backed by the backend's
 * verified capture, can do that (see routes/billing.ts POST /capture).
 */
export function useCaptureCheckout(
  options?: MutationOpts<CaptureResult, { orderId: string }>
) {
  const getToken = useGetToken();
  return useMutation<CaptureResult, unknown, { orderId: string }>({
    mutationFn: ({ orderId }) =>
      apiRequest<CaptureResult>("/billing/capture", {
        method: "POST",
        body: { orderId },
        getToken,
      }),
    ...options?.mutation,
  });
}
