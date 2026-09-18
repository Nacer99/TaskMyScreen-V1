import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Bell, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20"
      >
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl font-bold tracking-tight mb-4"
      >
        Capture Ideas.<br />
        <span className="text-primary">Make them Tasks.</span>
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-muted-foreground text-lg mb-10 max-w-sm"
      >
        Get notified at the time that works for you.
      </motion.p>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-xs"
      >
        <Link href="/sign-in" className="w-full block">
          <Button size="lg" className="w-full rounded-full h-14 text-base font-semibold group">
            Sign In
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <div className="mt-4 text-sm text-muted-foreground">
          Don't have an account? <Link href="/sign-up" className="text-primary hover:underline font-medium">Create one</Link>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40 w-full">
          <Link href="/notify-test">
            <button className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
              Test notification system
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
