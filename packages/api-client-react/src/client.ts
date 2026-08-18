import type { TaskStatus } from "./queryKeys";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStats,
  UserProfile,
  CheckoutSession,
} from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const API_BASE = "/api";

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new ApiError(
      response.statusText,
      response.status,
      body,
    );
  }

  return body as T;
}

export const apiClient = {
  //
  // TASKS
  //

listTasks(status?: TaskStatus) {
  const query = status
    ? `?status=${encodeURIComponent(status)}`
    : "";

  return request<Task[]>(`/tasks${query}`);
},

  getTask(id: string | number) {
    return request<Task>(`/tasks/${id}`);
  },

  createTask(data: TaskCreateInput) {
    return request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTask(
    id: string | number,
    data: TaskUpdateInput,
  ) {
    return request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteTask(id: string | number) {
    return request<void>(`/tasks/${id}`, {
      method: "DELETE",
    });
  },

  //
  // TASK STATS
  //

  getTaskStats() {
    return request<TaskStats>("/tasks/stats");
  },

  //
  // USER
  //

  getUserProfile() {
    return request<UserProfile>("/users/profile");
  },

  //
  // STRIPE
  //

  createCheckoutSession() {
    return request<CheckoutSession>(
      "/billing/create-checkout-session",
      {
        method: "POST",
      },
    );
  },
};