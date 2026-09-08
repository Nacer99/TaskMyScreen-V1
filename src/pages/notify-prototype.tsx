import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, CheckCircle2, Clock, Trash2, BellRing, ImageIcon, AlarmClock, ShieldCheck, Info } from "lucide-react";
import {
  requestPermission,
  getPermission,
  scheduleTask,
  cancel,
  getAllNotifications,
  registerServiceWorker,
  restoreNotifications,
  type NotificationTask,
} from "@/lib/notifications";

/** Active (not yet fired/cancelled) notifications — mirrors the old flat API's getPendingNotifications(). */
function getActiveNotifications(): NotificationTask[] {
  return getAllNotifications().filter(
    (n) => n.status === "pending" || n.status === "scheduled"
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCountdown(dueAt: string): string {
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) return "firing soon…";
  const s = Math.ceil(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function formatTime(dueAt: string): string {
  return new Date(dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Permission Banner ────────────────────────────────────────────────────────

function PermissionBanner({
  permission,
  onRequest,
}: {
  permission: NotificationPermission;
  onRequest: () => void;
}) {
  if (permission === "granted") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#3FB950]/30 bg-[#3FB950]/10 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-[#3FB950]" />
        <div>
          <p className="text-sm font-medium text-[#3FB950]">Notifications enabled</p>
          <p className="text-xs text-[#8b949e]">Personalized notifications will fire even when this tab is in background.</p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#F85149]/30 bg-[#F85149]/10 px-4 py-3">
        <BellOff className="h-5 w-5 shrink-0 text-[#F85149]" />
        <div>
          <p className="text-sm font-medium text-[#F85149]">Notifications blocked</p>
          <p className="text-xs text-[#8b949e]">
            Go to your browser settings → Site settings → Notifications → allow this site.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#3B5BFA]/30 bg-[#3B5BFA]/10 px-4 py-3">
      <Bell className="h-5 w-5 shrink-0 text-[#3B5BFA]" />
      <div className="flex-1">
        <p className="text-sm font-medium text-[#e6edf3]">Permission required</p>
        <p className="text-xs text-[#8b949e]">Allow notifications to test the personalized delivery system.</p>
      </div>
      <button
        onClick={onRequest}
        className="shrink-0 rounded-lg bg-[#3B5BFA] px-3 py-1.5 text-xs font-semibold text-white active:scale-95 transition-transform"
        data-testid="button-request-permission"
      >
        Allow
      </button>
    </div>
  );
}

// ─── Scheduled Item Card ──────────────────────────────────────────────────────

function ScheduledCard({
  notif,
  onCancel,
  tick: _tick,
}: {
  notif: NotificationTask;
  onCancel: (id: string) => void;
  /** Unused directly — forces this card to re-render each second so the countdown updates. */
  tick: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 rounded-xl border border-[#21262d] bg-[#161b22] px-4 py-3"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3B5BFA]/15">
        <AlarmClock className="h-4 w-4 text-[#3B5BFA]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#e6edf3]">{notif.title}</p>
        <p className="truncate text-xs text-[#8b949e]">{notif.body}</p>
        <div className="mt-1 flex items-center gap-2">
          <Clock className="h-3 w-3 text-[#8b949e]" />
          <span className="text-xs text-[#8b949e]">
            {formatTime(notif.dueAt)} —{" "}
            <span className="text-[#3B5BFA] font-medium">{formatCountdown(notif.dueAt)}</span>
          </span>
        </div>
        {notif.imageUrl && (
          <div className="mt-1 flex items-center gap-1">
            <ImageIcon className="h-3 w-3 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] truncate max-w-[160px]">Image attached</span>
          </div>
        )}
      </div>
      <button
        onClick={() => onCancel(notif.id)}
        className="shrink-0 rounded-lg p-1.5 text-[#8b949e] hover:bg-[#F85149]/10 hover:text-[#F85149] transition-colors"
        data-testid={`button-cancel-notif-${notif.id}`}
        title="Cancel notification"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotifyPrototype() {
  const [permission, setPermission] = useState<NotificationPermission>(getPermission());
  const [swReady, setSwReady] = useState(false);
  const [pending, setPending] = useState<NotificationTask[]>(getActiveNotifications());
  const [tick, setTick] = useState(0);

  // Form state
  const [title, setTitle] = useState("TaskMyScreen Reminder");
  const [body, setBody] = useState("Your task is due now. Tap to review.");
  const [imageUrl, setImageUrl] = useState("");
  const [delayMode, setDelayMode] = useState<"quick" | "custom">("quick");
  const [customTime, setCustomTime] = useState("");
  const [customSeconds, setCustomSeconds] = useState(30);
  const [lastFired, setLastFired] = useState<string | null>(null);

  // Init SW and restore pending notifications on mount
  useEffect(() => {
    registerServiceWorker().then((registration) => {
      const ok = !!registration;
      setSwReady(ok);
      if (ok) restoreNotifications();
    });

    // Tick every second to update countdowns
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setPending(getActiveNotifications());
    }, 1000);

    // Listen for SW messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "TASK_MARK_DONE") {
        setLastFired(`Task ${event.data.taskId} marked done via notification`);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const result = await requestPermission();
    setPermission(result);
  }, []);

  const handleSchedule = useCallback(
    async (seconds: number) => {
      if (permission !== "granted") {
        const result = await requestPermission();
        setPermission(result);
        if (result !== "granted") return;
      }

      const due = new Date(Date.now() + seconds * 1000);
      scheduleTask({
        taskId: `test-${Date.now()}`,
        title: title || "TaskMyScreen Reminder",
        body: body || "Your task is due. Tap to open.",
        dueAt: due.toISOString(),
        imageUrl: imageUrl || undefined,
        plan: "free",
      });

      setPending(getActiveNotifications());
      setLastFired(null);
    },
    [permission, title, body, imageUrl]
  );

  const handleScheduleCustomTime = useCallback(async () => {
    if (!customTime) return;
    if (permission !== "granted") {
      const result = await requestPermission();
      setPermission(result);
      if (result !== "granted") return;
    }

    // Build a full ISO datetime from the time input (today's date + picked time)
    const [hours, minutes] = customTime.split(":").map(Number);
    const due = new Date();
    due.setHours(hours, minutes, 0, 0);

    // If picked time is in the past, schedule for tomorrow
    if (due.getTime() <= Date.now()) {
      due.setDate(due.getDate() + 1);
    }

    scheduleTask({
      taskId: `test-${Date.now()}`,
      title: title || "TaskMyScreen Reminder",
      body: body || "Your task is due. Tap to open.",
      imageUrl: imageUrl || undefined,
      dueAt: due.toISOString(),
      plan: "free",
    });

    setPending(getActiveNotifications());
  }, [customTime, permission, title, body, imageUrl]);

  const handleCancel = useCallback((id: string) => {
    cancel(id);
    setPending(getActiveNotifications());
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0d1117] px-4 pb-10 pt-6">
      <div className="mx-auto max-w-md">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B5BFA]/15">
            <BellRing className="h-5 w-5 text-[#3B5BFA]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#e6edf3]">Notification Prototype</h1>
            <p className="text-xs text-[#8b949e]">Phase 1 — Personalized notification system</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${swReady ? "bg-[#3FB950]" : "bg-[#F85149]"}`} />
            <span className="text-xs text-[#8b949e]">{swReady ? "SW active" : "SW loading"}</span>
          </div>
        </div>

        {/* Permission banner */}
        <div className="mb-5">
          <PermissionBanner permission={permission} onRequest={handleRequestPermission} />
        </div>

        {/* How it works — info banner */}
        <div className="mb-5 flex gap-3 rounded-xl border border-[#21262d] bg-[#161b22] px-4 py-3">
          <Info className="h-4 w-4 shrink-0 text-[#8b949e] mt-0.5" />
          <p className="text-xs leading-relaxed text-[#8b949e]">
            Notifications are delivered via <strong className="text-[#e6edf3]">Service Worker</strong> — they fire with your custom icon, large image, and action buttons (<strong className="text-[#e6edf3]">Mark Done</strong> / <strong className="text-[#e6edf3]">Reschedule</strong>) even when this tab is in the background.
          </p>
        </div>

        {/* Notification content form */}
        <div className="mb-5 space-y-3 rounded-xl border border-[#21262d] bg-[#161b22] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">Notification Content</p>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#e6edf3]">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title…"
              className="w-full rounded-lg border border-[#21262d] bg-[#0d1117] px-3 py-2.5 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none focus:border-[#3B5BFA] transition-colors"
              data-testid="input-notif-title"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#e6edf3]">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification body text…"
              rows={2}
              className="w-full resize-none rounded-lg border border-[#21262d] bg-[#0d1117] px-3 py-2.5 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none focus:border-[#3B5BFA] transition-colors"
              data-testid="input-notif-body"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#e6edf3]">
              Image URL <span className="text-[#8b949e] font-normal">(optional — shown as large image in notification)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-[#21262d] bg-[#0d1117] px-3 py-2.5 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none focus:border-[#3B5BFA] transition-colors"
              data-testid="input-notif-image"
            />
          </div>
        </div>

        {/* Schedule mode toggle */}
        <div className="mb-4 flex gap-2 rounded-xl border border-[#21262d] bg-[#161b22] p-1">
          <button
            onClick={() => setDelayMode("quick")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              delayMode === "quick"
                ? "bg-[#3B5BFA] text-white"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
            data-testid="button-mode-quick"
          >
            Quick Test
          </button>
          <button
            onClick={() => setDelayMode("custom")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              delayMode === "custom"
                ? "bg-[#3B5BFA] text-white"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
            data-testid="button-mode-custom"
          >
            Custom Time
          </button>
        </div>

        <AnimatePresence mode="wait">
          {delayMode === "quick" ? (
            <motion.div
              key="quick"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="mb-5 space-y-3"
            >
              <div className="mb-3">
                <label className="mb-2 block text-xs font-medium text-[#e6edf3]">
                  Delay: <span className="text-[#3B5BFA]">{customSeconds}s</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(Number(e.target.value))}
                  className="w-full accent-[#3B5BFA]"
                  data-testid="slider-delay"
                />
                <div className="flex justify-between text-xs text-[#8b949e]">
                  <span>5s</span><span>120s</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 30].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSchedule(s)}
                    disabled={permission === "denied"}
                    className="rounded-lg border border-[#21262d] bg-[#161b22] py-2.5 text-sm font-medium text-[#e6edf3] hover:border-[#3B5BFA] hover:bg-[#3B5BFA]/10 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid={`button-quick-${s}s`}
                  >
                    in {s}s
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleSchedule(customSeconds)}
                disabled={permission === "denied"}
                className="w-full rounded-xl bg-[#3B5BFA] py-3.5 text-sm font-semibold text-white active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-schedule-quick"
              >
                <Bell className="h-4 w-4" />
                Schedule in {customSeconds} seconds
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="mb-5 space-y-3"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#e6edf3]">
                  Fire at (today or tomorrow if past)
                </label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full rounded-lg border border-[#21262d] bg-[#0d1117] px-3 py-2.5 text-sm text-[#e6edf3] outline-none focus:border-[#3B5BFA] transition-colors"
                  data-testid="input-custom-time"
                />
              </div>
              <button
                onClick={handleScheduleCustomTime}
                disabled={!customTime || permission === "denied"}
                className="w-full rounded-xl bg-[#3B5BFA] py-3.5 text-sm font-semibold text-white active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-schedule-custom"
              >
                <Clock className="h-4 w-4" />
                Schedule at {customTime || "—"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last fired confirmation */}
        <AnimatePresence>
          {lastFired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-[#3FB950]/30 bg-[#3FB950]/10 px-4 py-3"
            >
              <CheckCircle2 className="h-4 w-4 text-[#3FB950]" />
              <p className="text-xs text-[#3FB950]">{lastFired}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending notifications list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
              Scheduled ({pending.length})
            </p>
            {pending.length > 0 && (
              <button
                onClick={() => {
                  pending.forEach((n) => cancel(n.id));
                  setPending([]);
                }}
                className="text-xs text-[#F85149] hover:underline"
                data-testid="button-cancel-all"
              >
                Cancel all
              </button>
            )}
          </div>

          <AnimatePresence>
            {pending.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-dashed border-[#21262d] py-8 text-center"
              >
                <BellOff className="mx-auto mb-2 h-6 w-6 text-[#8b949e]" />
                <p className="text-sm text-[#8b949e]">No notifications scheduled</p>
              </motion.div>
            ) : (
              pending.map((n) => (
                <ScheduledCard key={n.id} notif={n} onCancel={handleCancel} tick={tick} />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* What to expect */}
        <div className="mt-6 rounded-xl border border-[#21262d] bg-[#161b22] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8b949e]">What to expect on Android</p>
          <ul className="space-y-1.5">
            {[
              "TaskMyScreen branded icon in the notification",
              "Custom title and body text",
              "Large image (if URL provided)",
              'Two action buttons: "Mark Done" and "Reschedule"',
              "Custom vibration pattern on arrival",
              "Fires even when tab is in background",
              "Tapping opens the app",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3B5BFA]" />
                <span className="text-xs text-[#8b949e]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
