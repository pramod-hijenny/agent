import { Link, useNavigate, usePathname } from "@/lib/navigation";
import {
  Bell,
  Compass,
  Home,
  Inbox,
  Search,
  Settings,
  Sparkles,
  User,
  LogOut,
  Menu,
} from "lucide-react";
import { GradientAvatar } from "./Avatar";
import { setAuth, setIntros, setUser, useAuthState, useUser } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getMe, hasApi, listIntros } from "@/lib/api";

const NAV = [
  { to: "/app/home", label: "Home", icon: Home },
  { to: "/app/discover", label: "People", icon: Compass },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
  { to: "/app/agent", label: "Agent", icon: Sparkles },
  { to: "/app/profile/me", label: "Me", icon: User },
] as const;

const UTILITY_NAV = [{ to: "/app/settings", label: "Settings", icon: Settings }] as const;

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
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/90 px-3 py-2 backdrop-blur-xl md:px-5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link to="/app/home" className="flex shrink-0 items-center gap-2 rounded-full pr-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
              style={{ background: "var(--gradient-agent)" }}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="hidden text-lg font-black tracking-tight text-foreground sm:block">
              AgentCircle
            </span>
          </Link>

          <div className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-full border border-transparent bg-secondary/80 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="Search members, skills, goals"
            />
          </div>

          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active =
                pathname === n.to ||
                (n.to === "/app/profile/me" && pathname.startsWith("/app/profile"));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex h-11 min-w-20 flex-col items-center justify-center rounded-2xl px-3 text-[11px] font-semibold transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <n.icon className="h-5 w-5" />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {UTILITY_NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                aria-label={n.label}
                className="hidden h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground md:flex"
              >
                <n.icon className="h-5 w-5" />
              </Link>
            ))}
            <button
              className="h-10 w-10 rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="mx-auto h-5 w-5" />
            </button>
            <Link to="/app/profile/me" className="rounded-full ring-card">
              <GradientAvatar name={user.full_name} colorClass={user.avatar_color} size="sm" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="hidden rounded-full text-muted-foreground md:inline-flex"
              aria-label="Sign out"
              onClick={() => {
                setAuth(null);
                setUser(null);
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <button className="h-10 w-10 rounded-full bg-secondary text-muted-foreground md:hidden">
              <Menu className="mx-auto h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-58px)] max-w-6xl px-3 pb-24 pt-4 md:px-5 md:pb-8">
        {children}
      </main>

      <nav className="fixed bottom-3 left-3 right-3 z-30 grid grid-cols-5 rounded-[1.7rem] border border-border/80 bg-card/95 p-1 shadow-[var(--shadow-elevated)] backdrop-blur-xl md:hidden">
        {NAV.map((n) => {
          const active = pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <n.icon className="h-5 w-5" /> {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
