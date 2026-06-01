import { Link, useNavigate } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Heart,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { setAuth, setIntros, setUser } from "@/lib/store";
import { SEED_PROFILES } from "@/lib/mock-data";
import type { IntroRequest, Profile } from "@/lib/types";
import { signIn, signUp, verifyEmailCode, fetchMyProfile } from "@/lib/auth";

const SOCIAL_IMAGES = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=700&q=85",
];

const PEOPLE = [
  { name: "Maya", color: "bg-[#ff6f91]", x: "left-[7%] top-[16%]" },
  { name: "Omar", color: "bg-[#ffd166]", x: "right-[18%] top-[9%]" },
  { name: "Sofia", color: "bg-[#77ddff]", x: "right-[8%] bottom-[25%]" },
];

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setError("");
    try {
      if (mode === "signup") {
        const result = await signUp(email, password);
        if (result?.requireEmailVerification) {
          setVerifying(true);
        } else if (result?.accessToken) {
          navigate({ to: "/onboarding" });
        }
      } else {
        await signIn(email, password);
        const profile = await fetchMyProfile();
        if (profile && profile.full_name && profile.current_ask) {
          setUser(profile);
          navigate({ to: "/app/home" });
        } else {
          navigate({ to: "/onboarding" });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await verifyEmailCode(email, code);
      navigate({ to: "/onboarding" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setSubmitting(false);
    }
  }

  function loginDemo() {
    const demoUser: Profile = {
      ...SEED_PROFILES[0],
      id: "me",
      user_id: "me",
      full_name: "Alex Morgan",
      profession: "Founder",
      company: "Northstar Studio",
      current_ask:
        "Find AI founders and product mentors who can give feedback on a B2B onboarding flow.",
      agent: {
        ...SEED_PROFILES[0].agent,
        agent_name: "Alex Agent",
        agent_intro:
          "I represent Alex, a founder looking for high-context product feedback and warm startup intros.",
      },
    };
    const demoIntros: IntroRequest[] = [
      {
        id: "demo-intro-1",
        from_user_id: "me",
        to_user_id: "sofia",
        message:
          "Alex and Sofia both care about onboarding quality and AI UX. I think a 20-minute prototype review would be useful for both sides.",
        status: "pending",
        created_at: Date.now() - 1000 * 60 * 18,
      },
      {
        id: "demo-intro-2",
        from_user_id: "me",
        to_user_id: "omar",
        message:
          "Alex is refining early GTM for an onboarding product. Omar can pressure-test the ICP and suggest a sharper first experiment.",
        status: "accepted",
        created_at: Date.now() - 1000 * 60 * 90,
      },
    ];
    setAuth({ email: "demo@agentcircle.app" });
    setUser(demoUser);
    setIntros(demoIntros);
    navigate({ to: "/app/home" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef4ff] text-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,#ffb6d5_0,transparent_28rem),radial-gradient(circle_at_90%_18%,#b8e5ff_0,transparent_32rem),linear-gradient(135deg,#f8fbff,#d9e8ff_48%,#f7eefc)]" />
      <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(#1f2937_1px,transparent_1px),linear-gradient(90deg,#1f2937_1px,transparent_1px)] [background-size:54px_54px]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-xl">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-xl font-black tracking-tight">AgentCircle</span>
        </Link>
        <Button
          asChild
          className="hidden rounded-full bg-black px-5 text-white hover:bg-black/85 sm:inline-flex"
        >
          <Link to="/">
            Explore <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-8 px-5 pb-10 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_430px] xl:grid-cols-[minmax(0,1.15fr)_460px]">
        <section className="relative min-h-[640px] overflow-hidden rounded-[2rem] bg-black text-white shadow-[0_32px_90px_rgb(38_52_78_/_0.28)] md:rounded-[3rem]">
          <img
            src={SOCIAL_IMAGES[0]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0_/_0.74),rgb(0_0_0_/_0.24)_50%,rgb(0_0_0_/_0.58))]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black to-transparent" />

          {PEOPLE.map((person) => (
            <div
              key={person.name}
              className={`absolute ${person.x} hidden animate-float items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-2 text-sm font-black text-white shadow-2xl backdrop-blur-xl md:flex`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${person.color}`}
              >
                {person.name[0]}
              </span>
              {person.name}
            </div>
          ))}

          <div className="relative flex min-h-[640px] flex-col justify-between p-6 md:p-9 lg:p-11">
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-black backdrop-blur-xl">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#7df3c8]" />
              Live founder network
            </div>

            <div className="max-w-2xl">
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                Meet people like a social app.
              </h1>
              <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-white/78">
                AgentCircle turns startup networking into a visual feed of profiles, stories, warm
                intros, reactions, and agent-assisted recommendations.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={loginDemo}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black shadow-xl transition hover:-translate-y-0.5"
                >
                  Use demo account <Play className="h-4 w-4 fill-current" />
                </button>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-black backdrop-blur-xl">
                  <ShieldCheck className="h-4 w-4" /> Approval-gated
                </span>
              </div>
            </div>
          </div>

          <div className="absolute right-5 top-24 hidden w-72 rounded-[1.7rem] border border-white/25 bg-white/18 p-4 shadow-2xl backdrop-blur-2xl xl:block">
            <div className="flex items-center justify-between">
              <p className="font-black">Stories</p>
              <Camera className="h-5 w-5 text-white/75" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {SOCIAL_IMAGES.map((src, index) => (
                <div key={src} className="h-28 overflow-hidden rounded-2xl">
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 hover:scale-110"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <span className="-mt-8 ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-black">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-5 right-5 hidden w-80 rounded-[1.7rem] bg-white p-4 text-black shadow-2xl md:block">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff8fb3] font-black text-white">
                M
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-black">Maya Chen</p>
                <p className="truncate text-sm font-bold text-slate-400">Pre-seed founder</p>
              </div>
              <BadgeCheck className="h-5 w-5 text-[#4aa3ff]" />
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Looking for design partners who can give feedback on onboarding analytics.
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm font-black text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-4 w-4 fill-[#ff6f91] text-[#ff6f91]" /> 2.8k
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" /> 84
              </span>
              <span className="ml-auto rounded-full bg-black px-4 py-2 text-xs text-white">
                Connect
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_26px_80px_rgb(41_55_92_/_0.18)] backdrop-blur-xl md:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7d8ca5]">
                Start here
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                {mode === "signup" ? "Create your social agent" : "Welcome back"}
              </h2>
            </div>
            <div className="hidden h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#e8f0ff] sm:flex">
              <Users className="h-7 w-7 text-black" />
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
            Sign in to preview the feed, discover people, and approve warm intros from your AI
            networking agent.
          </p>

          {verifying ? (
            <form onSubmit={submitCode} className="mt-7 space-y-4">
              <p className="text-sm font-semibold text-slate-600">
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
              </p>
              <div className="space-y-2">
                <Label htmlFor="code" className="font-black">
                  Verification code
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="h-13 rounded-2xl border-slate-200 bg-slate-50 px-4 text-center text-2xl font-black tracking-[0.5em]"
                  placeholder="000000"
                />
              </div>
              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
              <Button
                type="submit"
                className="h-13 w-full rounded-2xl bg-black text-base font-black text-white hover:bg-black/85"
                disabled={submitting}
              >
                {submitting ? "Verifying..." : "Verify email"}
              </Button>
              <button
                type="button"
                onClick={() => setVerifying(false)}
                className="w-full text-center text-sm font-semibold text-slate-500 hover:text-black"
              >
                Back to sign up
              </button>
            </form>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-13 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base font-semibold"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-black">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-13 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base font-semibold"
                  placeholder="Password"
                />
              </div>
              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
              <Button
                type="submit"
                className="h-13 w-full rounded-2xl bg-black text-base font-black text-white hover:bg-black/85"
                disabled={submitting}
              >
                {submitting ? "Connecting..." : "Enter the feed"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={loginDemo}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 text-base font-black text-black transition hover:-translate-y-0.5 hover:bg-slate-200"
              >
                Use demo account <Play className="h-4 w-4 fill-current" />
              </button>
            </form>
          )}

          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Stories", "Matches", "Messages"].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-100 px-3 py-3 text-center">
                <p className="text-xs font-black text-slate-400">{item}</p>
                <p className="mt-1 text-lg font-black">
                  {item === "Stories" ? "24" : item === "Matches" ? "3" : "6"}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
            className="mt-5 w-full text-center text-sm font-black text-slate-500 hover:text-black"
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "New to AgentCircle? Create one"}
          </button>
        </section>
      </main>
    </div>
  );
}
