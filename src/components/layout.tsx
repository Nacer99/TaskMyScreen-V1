import { ReactNode } from "react";
import { CheckSquare, LogOut, Moon, Sun, Zap } from "lucide-react";
import { useAuth } from "@clerk/react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { InstallBanner } from "@/components/install-banner";
import { useTheme } from "@/hooks/use-theme";
import { usePlan } from "@/hooks/use-plan";

export function Layout({ children }: { children: ReactNode }) {
  const { signOut, isSignedIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isPro, plan } = usePlan();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-[100dvh] relative shadow-2xl bg-background border-x border-border/50">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <CheckSquare className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">TaskMyScreen</span>
            {isPro && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wide">
                {plan === "lifetime" ? "Lifetime" : "Pro"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isPro && isSignedIn && (
              <Link href="/upgrade">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 rounded-full text-xs font-semibold text-primary hover:bg-primary/10 gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Pro
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            {isSignedIn && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" })}
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </header>
        <InstallBanner />
        <main className="flex-1 flex flex-col relative">{children}</main>
      </div>
    </div>
  );
}
