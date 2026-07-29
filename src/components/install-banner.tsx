import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallBanner() {
  const { canInstall, isDismissed, install, dismiss } = usePwaInstall();

  const show = canInstall && !isDismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="mx-4 mt-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 flex items-start gap-3"
        >
          <Download className="mt-0.5 shrink-0 text-blue-400" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white leading-snug">
              Install for better notifications
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">
              Installing removes the "Unsubscribe" button and delivers reminders like a native app.
            </p>
            <button
              onClick={install}
              className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Add to Home Screen
            </button>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
