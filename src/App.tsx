import { useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { RouteParamsProvider, RouterProvider, usePathname, navigate } from "@/lib/navigation";
import { Toaster } from "@/components/ui/sonner";
import { Landing } from "@/routes";
import { AuthPage } from "@/routes/auth";
import { Onboarding } from "@/routes/onboarding";
import { Home } from "@/routes/app.home";
import { Discover } from "@/routes/app.discover";
import { AgentPage } from "@/routes/app.agent";
import { InboxPage } from "@/routes/app.inbox";
import { Connections } from "@/routes/app.connections";
import { Settings } from "@/routes/app.settings";
import { ProfilePage } from "@/routes/app.profile.$id";

const TITLES: Record<string, string> = {
  "/": "AgentCircle - AI networking for startup communities",
  "/auth": "Sign in - AgentCircle",
  "/onboarding": "Set up your agent - AgentCircle",
  "/app/home": "Home - AgentCircle",
  "/app/discover": "Discover - AgentCircle",
  "/app/agent": "My Agent - AgentCircle",
  "/app/inbox": "Inbox - AgentCircle",
  "/app/connections": "Connections - AgentCircle",
  "/app/settings": "Settings - AgentCircle",
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
      document.title = "Profile - AgentCircle";
      return;
    }
    document.title = TITLES[pathname] ?? "AgentCircle";
  }, [pathname]);

  if (pathname === "/") return <Landing />;
  if (pathname === "/auth") return <AuthPage />;
  if (pathname === "/onboarding") return <Onboarding />;

  if (pathname === "/app") {
    navigate("/app/home", { replace: true });
    return null;
  }

  if (pathname.startsWith("/app")) {
    return <AppLayout>{renderAppRoute(pathname)}</AppLayout>;
  }

  return <NotFound />;
}

function renderAppRoute(pathname: string) {
  if (pathname === "/app/home") return <Home />;
  if (pathname === "/app/discover") return <Discover />;
  if (pathname === "/app/agent") return <AgentPage />;
  if (pathname === "/app/inbox") return <InboxPage />;
  if (pathname === "/app/connections") return <Connections />;
  if (pathname === "/app/settings") return <Settings />;

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
