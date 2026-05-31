import { Link, useNavigate, usePathname } from "@/lib/navigation";
import {
  Bell,
  Compass,
  Home,
  Inbox,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { GradientAvatar } from "./Avatar";
import { setAuth, setIntros, setUser, useAuthState, useUser } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getMe, hasApi, listIntros } from "@/lib/api";

const NAV = [
  { to: "/app/home", label: "News Feed", icon: Home, badge: null },
  { to: "/app/discover", label: "Discover", icon: Compass, badge: null },
  { to: "/app/inbox", label: "Messages", icon: Inbox, badge: "6" },
  { to: "/app/connections", label: "Connections", icon: Users, badge: "3" },
  { to: "/app/agent", label: "My Agent", icon: Sparkles, badge: null },
  { to: "/app/profile/me", label: "Profile", icon: User, badge: null },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const auth = useAuthState();
  const navigate = useNavigate();
  const pathname = usePathname();
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) return;
    if (hasApi() && auth?.token) {
      setHydrating(true);
      getMe(auth.token)
        .then((profile) => {
          if (profile.full_name && profile.current_ask) {
            setUser(profile);
            listIntros(auth.token)
              .then(setIntros)
              .catch(() => setIntros([]));
          } else {
            navigate({ to: "/onboarding" });
          }
        })
        .catch(() => {
          setAuth(null);
          navigate({ to: "/auth" });
        })
        .finally(() => setHydrating(false));
      return;
    }
    navigate({ to: "/auth" });
  }, [auth?.token, user, navigate]);

  if (!user || hydrating) return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--app-canvas)] text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_9%_14%,oklch(0.82_0.06_305_/_0.28),transparent_30rem),radial-gradient(circle_at_92%_8%,oklch(0.88_0.07_215_/_0.32),transparent_34rem),linear-gradient(135deg,oklch(0.68_0.035_288),oklch(0.94_0.025_220)_48%,oklch(0.77_0.045_250))]" />
      <div className="mx-auto grid min-h-screen w-full max-w-[1560px] grid-cols-1 lg:grid-cols-[238px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-white/55 bg-white/78 px-5 py-5 shadow-[14px_0_48px_oklch(0.25_0.04_260_/_0.07)] backdrop-blur-2xl lg:flex lg:flex-col">
          <Link to="/app/home" className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#eaf2ff]">
              <span className="absolute h-7 w-7 rounded-full bg-[#83d9c4] blur-md transition-transform group-hover:scale-125" />
              <Sparkles className="relative h-5 w-5 text-[#0f172a]" />
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">AgentCircle</span>
              <span className="text-xs font-semibold text-slate-400">SF Builders</span>
            </span>
          </Link>

          <div className="mt-7 flex items-center gap-3">
            <div className="relative">
              <GradientAvatar name={user.full_name} colorClass={user.avatar_color} size="lg" />
              <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#f6bb4f]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.full_name}</p>
              <p className="truncate text-xs font-semibold text-slate-400">
                @{user.id || "member"}
              </p>
            </div>
          </div>

          <nav className="mt-7 space-y-1.5">
            {NAV.map((n) => {
              const active =
                pathname === n.to ||
                (n.to === "/app/profile/me" && pathname.startsWith("/app/profile"));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "group flex h-11 items-center gap-3 rounded-[0.9rem] px-4 text-[13px] font-semibold transition-all",
                    active
                      ? "bg-black text-white shadow-[0_10px_22px_oklch(0_0_0_/_0.16)]"
                      : "text-slate-900 hover:bg-slate-100",
                  )}
                >
                  <n.icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-white" : "text-slate-900 group-hover:text-black",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{n.label}</span>
                  {n.badge && (
                    <span
                      className={cn(
                        "flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px]",
                        active ? "bg-white text-black" : "bg-black text-white",
                      )}
                    >
                      {n.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[1.2rem] border border-dashed border-[#d8e2f5] bg-white p-4 text-center shadow-[0_14px_34px_oklch(0.5_0.05_240_/_0.1)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#b381ff,#6ee7c9,#f8d06a)] text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold">Agent is online</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
              Approval-gated intros are ready.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-3 z-30 mx-3 mt-3 rounded-[1.5rem] border border-white/80 bg-white/90 px-3 py-3 shadow-[0_14px_40px_oklch(0.37_0.04_250_/_0.12)] backdrop-blur-xl lg:hidden">
            <div className="flex items-center gap-2">
              <Link to="/app/home" className="flex items-center gap-2 rounded-full pr-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-lg font-bold tracking-tight">AgentCircle</span>
              </Link>
              <div className="ml-auto flex items-center gap-1">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="min-h-screen px-4 pb-24 pt-4 md:px-6 lg:px-7 lg:pb-8 lg:pt-6 xl:px-9">
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed bottom-3 left-3 right-3 z-30 grid grid-cols-5 rounded-[1.5rem] border border-white/80 bg-white/95 p-1 shadow-[0_20px_60px_oklch(0.25_0.04_260_/_0.22)] backdrop-blur-xl lg:hidden">
        {NAV.slice(0, 5).map((n) => {
          const active = pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[1.15rem] py-2 text-[10px] font-semibold",
                active ? "bg-black text-white" : "text-slate-500",
              )}
            >
              <n.icon className="h-5 w-5" /> {n.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      <Button
        variant="ghost"
        size="icon"
        className="fixed right-5 top-5 z-40 hidden rounded-full bg-white/85 text-slate-500 shadow-sm backdrop-blur-xl hover:bg-white hover:text-black lg:inline-flex"
        aria-label="Sign out"
        onClick={() => {
          setAuth(null);
          setUser(null);
          navigate({ to: "/" });
        }}
      >
        <LogOut className="h-4 w-4" />
      </Button>

      <Link
        to="/app/settings"
        className="fixed right-[4.25rem] top-5 z-40 hidden h-10 w-10 items-center justify-center rounded-full bg-white/85 text-slate-500 shadow-sm backdrop-blur-xl hover:bg-white hover:text-black lg:flex"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </Link>
    </div>
  );
}
