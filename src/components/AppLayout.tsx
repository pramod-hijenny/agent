import { Link, useNavigate, usePathname } from "@/lib/navigation";
import {
  Bell,
  Compass,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { GradientAvatar } from "./Avatar";
import { BeeGlyph, BrandMark } from "./BrandMark";
import { setAuth, setIntros, setUser, useIntros, useUser } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  getCurrentUser,
  fetchMyProfile,
  fetchMyIntros,
  signOut as insforgeSignOut,
} from "@/lib/auth";

const NAV = [
  { to: "/app/home", label: "Feed", icon: Home, badge: null },
  { to: "/app/discover", label: "Discover", icon: Compass, badge: null },
  { to: "/app/messages", label: "Messages", icon: MessageCircle, badge: "pendingIntros" },
  { to: "/app/agent", label: "My Bee", icon: Sparkles, badge: null },
  { to: "/app/profile/me", label: "Profile", icon: User, badge: null },
  { to: "/app/settings", label: "Settings", icon: Settings, badge: null },
] as const;

const MOBILE_NAV = NAV.filter((item) =>
  ["/app/home", "/app/discover", "/app/messages", "/app/agent", "/app/profile/me"].includes(
    item.to,
  ),
);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const intros = useIntros();
  const navigate = useNavigate();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<"checking" | "ready" | "error">(() =>
    user ? "ready" : "checking",
  );
  const [authError, setAuthError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pendingIntroCount = intros.filter((intro) => intro.status === "pending").length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      setAuthState("ready");
      setAuthError("");
      return;
    }
    let cancelled = false;
    setAuthState("checking");
    setAuthError("");
    getCurrentUser()
      .then(async (authUser) => {
        if (cancelled) return;
        if (!authUser) {
          navigate({ to: "/auth" });
          return;
        }
        const profile = await fetchMyProfile();
        if (cancelled) return;
        if (!profile || !profile.full_name || !profile.current_ask) {
          navigate({ to: "/onboarding" });
          return;
        }
        setUser(profile);
        fetchMyIntros()
          .then(setIntros)
          .catch(() => setIntros([]));
        setAuthState("ready");
      })
      .catch((error) => {
        if (!cancelled) {
          setAuthError(error instanceof Error ? error.message : "Unable to load your workspace");
          setAuthState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (authState === "checking") return <AppLoadingScreen />;
  if (authState === "error") {
    return (
      <AppLoadError
        message={authError || "Unable to load your workspace"}
        onRetry={() => window.location.reload()}
      />
    );
  }
  if (!user) return <AppLoadingScreen label="Redirecting..." />;

  function isActive(to: (typeof NAV)[number]["to"]) {
    return (
      pathname === to ||
      (to === "/app/profile/me" && pathname.startsWith("/app/profile")) ||
      (to === "/app/messages" && pathname.startsWith("/app/messages"))
    );
  }

  function badgeFor(item: (typeof NAV)[number]) {
    if (item.badge === "pendingIntros") {
      return pendingIntroCount > 0 ? String(pendingIntroCount) : null;
    }
    return null;
  }

  async function signOut() {
    await insforgeSignOut().catch(() => {});
    setAuth(null);
    setUser(null);
    setIntros([]);
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f6f8] text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#f4f6f8]" />
      <div className="min-h-screen w-full xl:pl-[260px] 2xl:pl-[280px]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] overflow-y-auto bg-transparent px-3 py-4 xl:flex xl:flex-col 2xl:w-[280px]">
          <Link to="/app/home" className="group flex h-12 items-center rounded-[0.75rem] px-2">
            <BrandMark glyphClassName="h-9" />
          </Link>

          <Link
            to="/app/profile/me"
            className="mt-5 flex items-center gap-3 rounded-[0.75rem] p-2.5 transition hover:bg-[#f0f2f5]"
          >
            <div className="relative">
              <GradientAvatar name={user.full_name} colorClass={user.avatar_color} size="md" />
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#f7b801]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-black text-[#1c1e21]">{user.full_name}</p>
              <p className="truncate text-xs font-semibold text-[var(--app-muted)]">
                @{user.id || "member"}
              </p>
            </div>
          </Link>

          <nav className="mt-5 space-y-1">
            {NAV.map((n) => {
              const active = isActive(n.to);
              const badge = badgeFor(n);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex h-12 items-center gap-3 rounded-[0.75rem] px-2.5 text-[15px] font-black transition-colors",
                    active
                      ? "bg-[#f0f2f5] text-[#1c1e21]"
                      : "text-[#30333a] hover:bg-[#f0f2f5] hover:text-[#1c1e21]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      active
                        ? "bg-black text-[#f7b801]"
                        : "bg-[#e9edf2] text-[#606770] group-hover:bg-[#dfe3e8] group-hover:text-[#1c1e21]",
                    )}
                  >
                    <n.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{n.label}</span>
                  {badge && (
                    <span
                      className={cn(
                        "flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-black",
                        active ? "bg-[#f7b801] text-black" : "bg-black text-white",
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[0.9rem] border border-[#dfe3e8] bg-[#f7f8fa] p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#dfe3e8]">
                <BeeGlyph className="h-7 w-9" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black text-[#1c1e21]">Bee is online</p>
                <p className="truncate text-xs font-semibold text-[#65676b]">
                  {pendingIntroCount > 0
                    ? `${pendingIntroCount} intro${pendingIntroCount === 1 ? "" : "s"} need review.`
                    : "Intros are ready."}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-2 h-11 justify-start rounded-[0.75rem] px-3 text-[14px] font-bold text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </aside>

        <div className="min-w-0">
          <header className="app-card sticky top-3 z-30 mx-3 mt-3 rounded-[1.4rem] px-3 py-3 xl:hidden">
            <div className="flex items-center gap-2">
              <Link to="/app/home" className="flex items-center gap-2 rounded-full pr-1">
                <BrandMark glyphClassName="h-9" />
              </Link>
              <div className="ml-auto flex items-center gap-1">
                <Link
                  to="/app/discover"
                  className="app-icon-button flex h-10 w-10 items-center justify-center rounded-[0.9rem]"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Link>
                <Link
                  to="/app/messages"
                  className="app-icon-button flex h-10 w-10 items-center justify-center rounded-[0.9rem]"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Link>
                <button
                  className="app-icon-button flex h-10 w-10 items-center justify-center rounded-[0.9rem]"
                  aria-label="Menu"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="min-h-screen px-4 pb-24 pt-4 md:px-6 xl:px-8 xl:pb-8 xl:pt-6 2xl:px-10">
            {children}
          </main>
        </div>
      </div>

      <nav className="app-card fixed bottom-3 left-3 right-3 z-30 grid grid-cols-5 rounded-[1.45rem] p-1 xl:hidden">
        {MOBILE_NAV.map((n) => {
          const active = isActive(n.to);
          const badge = badgeFor(n);
          return (
            <Link
              key={n.to}
              to={n.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-[1.05rem] py-2 text-[10px] font-black",
                active ? "bg-black text-[#f7b801]" : "text-[var(--app-muted)]",
              )}
            >
              <n.icon className="h-5 w-5" /> {mobileLabel(n.to)}
              {badge && (
                <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f7b801] px-1 text-[9px] font-bold text-black">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm xl:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="ml-auto flex h-full w-[min(22rem,calc(100vw-2rem))] flex-col border-l border-[var(--app-border)] bg-[oklch(0.995_0.012_88)] p-5 shadow-[0_30px_90px_rgb(15_23_42_/_0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-[#fff4c8] text-white ring-1 ring-[#f7b801]/25">
                  <BeeGlyph className="h-7 w-9" />
                </span>
                <div>
                  <p className="text-sm font-black text-black">Get My Bee</p>
                  <p className="text-xs font-semibold text-[#8a6a00]">Builder Hive</p>
                </div>
              </div>
              <button
                className="app-icon-button flex h-10 w-10 items-center justify-center rounded-[0.9rem]"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="app-soft-panel mt-6 flex items-center gap-3 rounded-[1rem] p-3">
              <GradientAvatar name={user.full_name} colorClass={user.avatar_color} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-black">{user.full_name}</p>
                <p className="truncate text-xs font-semibold text-[var(--app-muted)]">
                  @{user.id || "member"}
                </p>
              </div>
            </div>

            <nav className="mt-5 space-y-1.5">
              {NAV.map((n) => {
                const active = isActive(n.to);
                const badge = badgeFor(n);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-[1rem] px-4 text-sm font-black",
                      active
                        ? "bg-black text-[#f7b801]"
                        : "text-[var(--app-ink-soft)] hover:bg-[#fff4c8]",
                    )}
                  >
                    <n.icon className="h-4 w-4" />
                    <span className="min-w-0 flex-1 truncate">{n.label}</span>
                    {badge && (
                      <span
                        className={cn(
                          "flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px]",
                          active ? "bg-[#f7b801] text-black" : "bg-black text-white",
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <Button
              variant="ghost"
              className="mt-auto h-11 justify-start rounded-[1rem] px-4 font-bold text-[var(--app-muted)] hover:bg-[#fff4c8] hover:text-black"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppLoadingScreen({ label = "Loading workspace..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-canvas)] px-4 text-foreground">
      <section className="w-full max-w-sm rounded-[1.25rem] border border-white/80 bg-white/95 p-6 text-center shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-black text-white shadow-lg">
          <BeeGlyph className="h-8 w-10 animate-pulse" />
        </div>
        <p className="mt-4 text-base font-bold text-black">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
          Syncing your profile, bee, and pending approvals.
        </p>
      </section>
    </div>
  );
}

function AppLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-canvas)] px-4 text-foreground">
      <section className="w-full max-w-md rounded-[1.25rem] border border-white/80 bg-white/95 p-6 text-center shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-rose-50 text-rose-600">
          <X className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-black">Couldn’t load Get My Bee</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{message}</p>
        <Button onClick={onRetry} className="mt-5 rounded-full bg-black font-semibold">
          Try again
        </Button>
      </section>
    </div>
  );
}

function mobileLabel(to: (typeof NAV)[number]["to"]) {
  if (to === "/app/home") return "News";
  if (to === "/app/agent") return "Bee";
  if (to === "/app/profile/me") return "Profile";
  if (to === "/app/messages") return "Messages";
  return "Discover";
}
