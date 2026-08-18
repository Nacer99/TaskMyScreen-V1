export interface Task {
  id: string;
  userId: string;

  title: string;
  description: string | null;

  imageUrl: string | null;

  dueAt: string;

  completed: boolean;

  createdAt: string;
}

export interface TaskCreateInput {
  title: string;

  description?: string;

  imageUrl?: string;

  dueAt: string;

  scheduled?: boolean;
}

export interface TaskUpdateInput {
  title?: string;

  description?: string;

  imageUrl?: string | null;

  dueAt?: string;

  completed?: boolean;

  scheduled?: boolean;
}

export interface TaskStats {
  total: number;

  pending: number;

  completed: number;

  overdue: number;
}

export interface UserProfile {
  id: string;

  email: string;

  plan: "free" | "pro" | "lifetime";

  monthlyTasksUsed: number;

  monthlyLimit: number;
}

export interface CheckoutSession {
  url: string;
}