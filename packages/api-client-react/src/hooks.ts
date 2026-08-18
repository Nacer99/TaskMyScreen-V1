import type { TaskStatus } from "./queryKeys";

import {
  useQuery,
  useMutation,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiClient } from "./client";

import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStats,
  UserProfile,
  CheckoutSession,
} from "./types";

import {
  getListTasksQueryKey,
  getGetTaskQueryKey,
  getGetTaskStatsQueryKey,
  getGetUserProfileQueryKey,
} from "./queryKeys";

/* ============================================================
   TASKS
============================================================ */

export function useListTasks(
  params?: {
    status?: TaskStatus;
  },
  options?: {
    query?: Omit<
      UseQueryOptions<
        Task[],
        Error,
        Task[],
        ReturnType<typeof getListTasksQueryKey>
      >,
      "queryKey" | "queryFn"
    >;
  },
) {
  return useQuery({
    queryKey: getListTasksQueryKey(params),

    queryFn: () => apiClient.listTasks(params?.status),

    ...options?.query,
  });
}

export function useGetTask(
  id: string | number,
  options?: {
    query?: Omit<
      UseQueryOptions<
        Task,
        Error,
        Task,
        ReturnType<typeof getGetTaskQueryKey>
      >,
      "queryKey" | "queryFn"
    >;
  },
) {
  return useQuery({
    queryKey: getGetTaskQueryKey(id),

    queryFn: () => apiClient.getTask(id),

    enabled: !!id,

    ...options?.query,
  });
}

/* ============================================================
   CREATE
============================================================ */

export function useCreateTask(
  options?: {
    mutation?: UseMutationOptions<
      Task,
      Error,
      {
        data: TaskCreateInput;
      }
    >;
  },
) {
  return useMutation({
    mutationFn: ({ data }) =>
      apiClient.createTask(data),

    ...options?.mutation,
  });
}

/* ============================================================
   UPDATE
============================================================ */

export function useUpdateTask(
  options?: {
    mutation?: UseMutationOptions<
      Task,
      Error,
      {
        id: string | number;
        data: TaskUpdateInput;
      }
    >;
  },
) {
  return useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.updateTask(id, data),

    ...options?.mutation,
  });
}

/* ============================================================
   COMPLETE
============================================================ */

export function useCompleteTask(
  options?: {
    mutation?: UseMutationOptions<
      Task,
      Error,
      {
        id: string | number;
      }
    >;
  },
) {
  return useMutation({
    mutationFn: ({ id }) =>
      apiClient.updateTask(id, {
        isCompleted: true,
      } as TaskUpdateInput),

    ...options?.mutation,
  });
}

/* ============================================================
   DELETE
============================================================ */

export function useDeleteTask(
  options?: {
    mutation?: UseMutationOptions<
      void,
      Error,
      {
        id: string | number;
      }
    >;
  },
) {
  return useMutation({
    mutationFn: ({ id }) =>
      apiClient.deleteTask(id),

    ...options?.mutation,
  });
}

/* ============================================================
   TASK STATS
============================================================ */

export function useGetTaskStats(
  options?: {
    query?: Omit<
      UseQueryOptions<
        TaskStats,
        Error,
        TaskStats,
        ReturnType<typeof getGetTaskStatsQueryKey>
      >,
      "queryKey" | "queryFn"
    >;
  },
) {
  return useQuery({
    queryKey: getGetTaskStatsQueryKey(),

    queryFn: () =>
      apiClient.getTaskStats(),

    ...options?.query,
  });
}

/* ============================================================
   USER PROFILE
============================================================ */

export function useGetUserProfile(
  options?: {
    query?: Omit<
      UseQueryOptions<
        UserProfile,
        Error,
        UserProfile,
        ReturnType<typeof getGetUserProfileQueryKey>
      >,
      "queryKey" | "queryFn"
    >;
  },
) {
  return useQuery({
    queryKey: getGetUserProfileQueryKey(),

    queryFn: () =>
      apiClient.getUserProfile(),

    ...options?.query,
  });
}

/* ============================================================
   BILLING
============================================================ */

export function useCreateCheckoutSession(
  options?: {
    mutation?: UseMutationOptions<
      CheckoutSession,
      Error,
      void
    >;
  },
) {
  return useMutation({
    mutationFn: () =>
      apiClient.createCheckoutSession(),

    ...options?.mutation,
  });
}