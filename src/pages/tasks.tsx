import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListTodo, CheckCircle2, Zap } from "lucide-react";
import { Link } from "wouter";
import { useListTasks, useGetTaskStats } from "@workspace/api-client-react";
import { TaskCard } from "@/components/task-card";
import { Skeleton } from "@/components/ui/skeleton";
import { requestPermission } from "@/lib/notifications";

const MONTHLY_LIMIT = 20;

export default function Tasks() {
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  const { data: tasks, isLoading } = useListTasks({ status: tab });
  const { data: stats } = useGetTaskStats();

  useEffect(() => {
    requestPermission();
  }, []);

  const plan = stats?.plan ?? "free";
  const isPro = plan === "pro" || plan === "lifetime";
  const monthlyUsed = stats?.monthlyTasksUsed ?? 0;
  const isAtLimit = !isPro && monthlyUsed >= MONTHLY_LIMIT;
  const usagePercent = Math.min(100, (monthlyUsed / MONTHLY_LIMIT) * 100);

  return (
    <div className="flex flex-col h-full bg-background relative pb-24">
      {/* Monthly usage section */}
      <div className="p-4 pt-6 border-b border-border/50 bg-card/30">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {isPro ? "Monthly Tasks" : "Monthly Limit"}
          </h2>
          <div className="text-sm font-bold">
            {isPro ? (
              <span className="text-primary">Unlimited</span>
            ) : (
              <>
                <span className={isAtLimit ? "text-destructive" : "text-primary"}>
                  {monthlyUsed}
                </span>
                <span className="text-muted-foreground"> / {MONTHLY_LIMIT} this month</span>
              </>
            )}
          </div>
        </div>

        {!isPro && (
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isAtLimit ? "bg-destructive" : "bg-primary"}`}
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        )}

        {isAtLimit && (
          <Link href="/upgrade">
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Monthly limit reached — Upgrade to Pro for unlimited tasks
            </motion.button>
          </Link>
        )}

        {!isPro && !isAtLimit && monthlyUsed >= 15 && (
          <Link href="/upgrade">
            <button className="mt-2 w-full text-xs text-center py-1.5 text-muted-foreground hover:text-primary transition-colors">
              {MONTHLY_LIMIT - monthlyUsed} tasks remaining this month · Upgrade to Pro
            </button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="p-4">
        <div className="flex bg-secondary p-1 rounded-xl">
          <button
            onClick={() => setTab('pending')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'completed' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 px-4 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : tasks?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-48 text-center"
          >
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              {tab === 'pending' ? (
                <ListTodo className="w-8 h-8 text-muted-foreground" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground font-medium">
              {tab === 'pending' ? "You're all caught up!" : "No completed tasks yet."}
            </p>
            {tab === 'pending' && (
              <p className="text-sm text-muted-foreground/70 mt-1">Tap + to add a new task.</p>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4 pb-8">
            <AnimatePresence mode="popLayout">
              {tasks?.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center z-50">
        <div className="pointer-events-none w-full max-w-md px-4 flex justify-end">
          <Link href={isAtLimit ? "/upgrade" : "/tasks/new"}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="pointer-events-auto w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl shadow-primary/40"
              aria-label="New task"
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}
