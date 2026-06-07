import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { RouteParamsProvider, RouterProvider, usePathname, navigate } from "@/lib/navigation";
import { Toaster } from "@/components/ui/sonner";

const Landing = lazy(() => import("@/routes").then((module) => ({ default: module.Landing })));
const AuthPage = lazy(() =>
  import("@/routes/auth").then((module) => ({ default: module.AuthPage })),
);
const Onboarding = lazy(() =>
  import("@/routes/onboarding").then((module) => ({ default: module.Onboarding })),
);
const Home = lazy(() => import("@/routes/app.home").then((module) => ({ default: module.Home })));
const Discover = lazy(() =>
  import("@/routes/app.discover").then((module) => ({ default: module.Discover })),
);
const AgentPage = lazy(() =>
  import("@/routes/app.agent").then((module) => ({ default: module.AgentPage })),
);
const MessagesPage = lazy(() =>
  import("@/routes/app.messages").then((module) => ({ default: module.MessagesPage })),
);
const Settings = lazy(() =>
  import("@/routes/app.settings").then((module) => ({ default: module.Settings })),
);
const ProfilePage = lazy(() =>
  import("@/routes/app.profile.$id").then((module) => ({ default: module.ProfilePage })),
);

const TITLES: Record<string, string> = {
  "/": "Get My Bee - Agentic social media",
  "/auth": "Sign in - Get My Bee",
  "/onboarding": "Set up your bee - Get My Bee",
  "/app/home": "Feed - Get My Bee",
  "/app/discover": "Discover - Get My Bee",
  "/app/agent": "My Bee - Get My Bee",
  "/app/messages": "Messages - Get My Bee",
  "/app/settings": "Settings - Get My Bee",
};

export function App() {
  return (
    <RouterProvider>
      <AppRoutes />
      <Toaster position="top-right" />
    </RouterProvider>
  );
}

function AppRoutes() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/app/profile/")) {
      document.title = "Profile - Get My Bee";
      return;
    }
    if (pathname.startsWith("/app/messages")) {
      document.title = "Messages - Get My Bee";
      return;
    }
    document.title = TITLES[pathname] ?? "Get My Bee";
  }, [pathname]);

  if (pathname === "/") return withRouteBoundary(pathname, <Landing />);
  if (pathname === "/auth") return withRouteBoundary(pathname, <AuthPage />);
  if (pathname === "/onboarding") return withRouteBoundary(pathname, <Onboarding />);

  if (pathname === "/app" || pathname === "/app/feed") {
    navigate("/app/home", { replace: true });
    return null;
  }

  if (pathname === "/app/inbox") {
    navigate("/app/messages", { replace: true });
    return null;
  }

  if (pathname.startsWith("/app")) {
    return (
      <AppErrorBoundary key={pathname}>
        <Suspense fallback={<RouteLoading />}>
          <AppLayout>{renderAppRoute(pathname)}</AppLayout>
        </Suspense>
      </AppErrorBoundary>
    );
  }

  return withRouteBoundary(pathname, <NotFound />);
}

function renderAppRoute(pathname: string) {
  if (pathname === "/app/home") return <Home />;
  if (pathname === "/app/discover") return <Discover />;
  if (pathname === "/app/agent") return <AgentPage />;
  if (pathname === "/app/settings") return <Settings />;

  const messagesMatch = pathname.match(/^\/app\/messages(?:\/([^/]+))?$/);
  if (messagesMatch) {
    const threadId = messagesMatch[1];
    return (
      <RouteParamsProvider params={threadId ? { id: decodeURIComponent(threadId) } : {}}>
        <MessagesPage />
      </RouteParamsProvider>
    );
  }

  const profileMatch = pathname.match(/^\/app\/profile\/([^/]+)$/);
  if (profileMatch) {
    return (
      <RouteParamsProvider params={{ id: decodeURIComponent(profileMatch[1]) }}>
        <ProfilePage />
      </RouteParamsProvider>
    );
  }

  return <NotFound compact />;
}

function withRouteBoundary(pathname: string, children: ReactNode) {
  return (
    <AppErrorBoundary key={pathname}>
      <Suspense fallback={<RouteLoading />}>{children}</Suspense>
    </AppErrorBoundary>
  );
}

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-canvas)] px-4">
      <div className="rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-slate-600 shadow-[var(--shadow-card)] backdrop-blur-xl">
        Loading Get My Bee...
      </div>
    </div>
  );
}

function NotFound({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex min-h-[50vh] items-center justify-center px-4"
          : "flex min-h-screen items-center justify-center bg-background px-4"
      }
    >
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
