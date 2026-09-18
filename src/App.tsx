import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { useEffect, useRef } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Tasks from "@/pages/tasks";
import TaskForm from "@/pages/task-form";
import Upgrade from "@/pages/upgrade";
import NotifyPrototype from "@/pages/notify-prototype";
import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";
import { useSwMessages } from "@/hooks/use-sw-messages";
import { useRestoreNotificationsFromApi } from "@/hooks/use-restore-notifications";

/** Mounts background services that need Router + QueryClient context */
function AppServices() {
  useSwMessages();
  useRestoreNotificationsFromApi();
  return null;
}

const queryClient = new QueryClient();

// REQUIRED — copy verbatim.
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(231 94% 60%)",
    colorForeground: "hsl(210 29% 93%)",
    colorMutedForeground: "hsl(213 10% 59%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(215 28% 11%)",
    colorInput: "hsl(213 20% 16%)",
    colorInputForeground: "hsl(210 29% 93%)",
    colorNeutral: "hsl(213 20% 16%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#161b22] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-[#21262d]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#e6edf3]",
    headerSubtitle: "text-[#8b949e]",
    socialButtonsBlockButtonText: "text-[#e6edf3]",
    formFieldLabel: "text-[#e6edf3]",
    footerActionLink: "text-[#3b5bfa] hover:text-[#3b5bfa]/80",
    footerActionText: "text-[#8b949e]",
    dividerText: "text-[#8b949e]",
  },
};

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/tasks" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome Back",
            subtitle: "Sign in to access your tasks",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AppServices />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />

          <Route path="/tasks">
            <Show when="signed-in" fallback={<Redirect to="/sign-in" />}>
              <Layout>
                <Tasks />
              </Layout>
            </Show>
          </Route>

          <Route path="/tasks/new">
            <Show when="signed-in" fallback={<Redirect to="/sign-in" />}>
              <Layout>
                <TaskForm />
              </Layout>
            </Show>
          </Route>

          <Route path="/tasks/:id/edit">
            <Show when="signed-in" fallback={<Redirect to="/sign-in" />}>
              <Layout>
                <TaskForm />
              </Layout>
            </Show>
          </Route>

          <Route path="/upgrade">
            <Show when="signed-in" fallback={<Redirect to="/sign-in" />}>
              <Layout>
                <Upgrade />
              </Layout>
            </Show>
          </Route>

          {/* Phase 1: Notification prototype — public */}
          <Route path="/notify-test" component={NotifyPrototype} />

          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <TooltipProvider>
          <ClerkProviderWithRoutes />
          <Toaster />
        </TooltipProvider>
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
