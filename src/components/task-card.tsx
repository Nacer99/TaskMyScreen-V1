import { useState } from "react";
import { motion } from "framer-motion";
import { format, isPast, differenceInMinutes } from "date-fns";
import { Check, Clock, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";
import { Task } from "@workspace/api-client-react";
import { useCompleteTask } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListTasksQueryKey, getGetTaskStatsQueryKey } from "@workspace/api-client-react";
import { cancelNotificationByTaskId } from "@/lib/notifications";

interface TaskCardProps {
  task: Task;
  onStatusChange?: () => void;
}

function getDueStatus(dueAt: string | null | undefined, completed: boolean) {
  if (!dueAt || completed) return null;
  const due = new Date(dueAt);
  const now = new Date();
  if (isPast(due)) return "overdue";
  if (differenceInMinutes(due, now) <= 60) return "soon";
  return "upcoming";
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(task.completed);

  const completeTaskMutation = useCompleteTask({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
        if (data.completed) cancelNotificationByTaskId(task.id);
        if (onStatusChange) onStatusChange();
      },
      onError: () => {
        setIsCompleted(!isCompleted);
        toast({
          title: "Error",
          description: "Failed to update task status.",
          variant: "destructive",
        });
      },
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !isCompleted;
    setIsCompleted(newState);
    completeTaskMutation.mutate({ id: task.id, data: { completed: newState } });
    if (newState) toast({ title: "Task completed", description: "Great job!" });
  };

  const dueStatus = getDueStatus(task.dueAt, isCompleted);

  const dueLabel = task.dueAt
    ? isPast(new Date(task.dueAt)) && !isCompleted
      ? `Overdue · ${format(new Date(task.dueAt), "MMM d, h:mm a")}`
      : format(new Date(task.dueAt), "MMM d, h:mm a")
    : null;

  const borderColor = !isCompleted && dueStatus === "overdue"
    ? "border-destructive/60 hover:border-destructive"
    : !isCompleted && dueStatus === "soon"
      ? "border-orange-500/40 hover:border-orange-500/70"
      : !isCompleted
        ? "border-border hover:border-primary/50"
        : "border-border/30";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.18 }}
    >
      <Link href={`/tasks/${task.id}/edit`}>
        <div
          className={`p-4 rounded-xl border transition-colors flex gap-3 shadow-sm ${
            isCompleted ? "bg-card/40 border-border/30 opacity-60" : `bg-card ${borderColor}`
          }`}
        >
          {/* Completion toggle */}
          <button
            onClick={handleToggle}
            className={`shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              isCompleted
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary/60 text-transparent"
            }`}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-base truncate transition-colors ${
                isCompleted ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p
                className={`text-sm mt-0.5 line-clamp-2 leading-snug ${
                  isCompleted ? "text-muted-foreground/40" : "text-muted-foreground"
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Due date + overdue indicator */}
            {dueLabel && (
              <div
                className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${
                  dueStatus === "overdue"
                    ? "text-destructive"
                    : dueStatus === "soon"
                      ? "text-orange-400"
                      : "text-primary/70"
                }`}
              >
                {dueStatus === "overdue" ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span>{dueLabel}</span>
                {dueStatus === "soon" && !isCompleted && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-semibold">
                    Due soon
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Image thumbnail */}
          {task.imageUrl && (
            <div className="shrink-0 ml-1">
              <img
                src={task.imageUrl}
                alt=""
                className="w-14 h-14 rounded-lg object-cover border border-border/50"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute("style");
                }}
              />
              <div
                style={{ display: "none" }}
                className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center border border-border/50"
              >
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
