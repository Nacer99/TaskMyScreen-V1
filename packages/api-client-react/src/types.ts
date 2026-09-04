/**
 * Frontend-facing types + the explicit adapter between the backend's real
 * column names (`reminderTime`, `isCompleted` — see packages/db/src/schema)
 * and the `dueAt` / `completed` shape the UI consumes.
 *
 * This is a deliberate, typed adaptation layer (per
 * docs/03-Backend/03-Backend_01_Backend_Architecture_and_API_Contract.md §8:
 * "the backend is authoritative for field names; create an adapter rather
 * than phantom properties") — not a duplicate/fictional contract. Every
 * field below is populated from a real API response field.
 */

export type Plan = "free" | "pro" | "lifetime";
export type PriceType = "monthly" | "annual" | "lifetime";

/** Raw shape returned by the backend (mirrors packages/db/src/schema tasksTable). */
export interface ApiTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  reminderTime: string;
  isCompleted: boolean;
  createdAt: string;
}

/** Shape consumed by the React frontend. */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  dueAt: string;
  completed: boolean;
  createdAt: string;
}

export function mapTask(api: ApiTask): Task {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    imageUrl: api.imageUrl,
    dueAt: api.reminderTime,
    completed: api.isCompleted,
    createdAt: api.createdAt,
  };
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  dueAt: string;
  imageUrl?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  dueAt?: string;
  imageUrl?: string;
  completed?: boolean;
}

/** Maps the frontend input shape to the backend's real request contract. */
export function toApiTaskPayload(input: TaskCreateInput | TaskUpdateInput) {
  return {
    ...("title" in input && input.title !== undefined ? { title: input.title } : {}),
    ...("description" in input && input.description !== undefined
      ? { description: input.description }
      : {}),
    ...("dueAt" in input && input.dueAt !== undefined
      ? { reminderTime: input.dueAt }
      : {}),
    ...("imageUrl" in input && input.imageUrl !== undefined
      ? { imageUrl: input.imageUrl }
      : {}),
    ...("completed" in input && input.completed !== undefined
      ? { isCompleted: input.completed }
      : {}),
  };
}

export interface UserProfile {
  id: string;
  email: string;
  plan: Plan;
  monthlyTasksUsed: number;
}

export interface TaskStats {
  plan: Plan;
  monthlyTasksUsed: number;
  pending: number;
  completed: number;
}

export interface CheckoutSession {
  url: string | null;
}

export interface CaptureResult {
  plan: Plan;
}
