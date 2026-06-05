import { Link, useNavigate } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/BrandMark";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Heart,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { setUser } from "@/lib/store";
import { signInWithEmailOnly, fetchMyProfile } from "@/lib/auth";

const SOCIAL_IMAGES = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=700&q=85",
];

const PEOPLE = [
  { name: "Maya", color: "bg-[#f7b801] text-black", x: "left-[7%] top-[16%]" },
  { name: "Omar", color: "bg-[#ffd166]", x: "right-[18%] top-[9%]" },
  { name: "Sofia", color: "bg-black text-[#f7b801]", x: "right-[8%] bottom-[25%]" },
];

export function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await signInWithEmailOnly(email.trim());
      const profile = await fetchMyProfile();
      if (profile && profile.full_name && profile.current_ask) {
        setUser(profile);
        navigate({ to: "/app/home" });
      } else {
        navigate({ to: "/onboarding" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffaf0] text-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgb(247_184_1_/_0.28)_0,transparent_28rem),radial-gradient(circle_at_90%_18%,rgb(17_17_17_/_0.1)_0,transparent_32rem),linear-gradient(135deg,#fffef8,#fff4c8_48%,#ffffff)]" />
      <div className="honeycomb-bg absolute inset-0 opacity-55" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark />
        </Link>
        <Button
          asChild
          className="hidden rounded-full bg-[#111111] px-5 text-white hover:bg-[#111111]/85 sm:inline-flex"
        >
          <Link to="/">
            Explore <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-8 px-5 pb-10 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_430px] xl:grid-cols-[minmax(0,1.15fr)_460px]">
        <section className="relative min-h-[640px] overflow-hidden rounded-[2rem] bg-[#111111] text-white shadow-[0_32px_90px_rgb(17_17_17_/_0.28)] md:rounded-[3rem]">
          <img
            src={SOCIAL_IMAGES[0]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgb(17_17_17_/_0.95),rgb(17_17_17_/_0.72)_54%,rgb(247_184_1_/_0.42))]" />
          <div className="honeycomb-bg absolute inset-0 opacity-20 mix-blend-screen" />
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
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#f7b801]" />
              Live founder network
            </div>

            <div className="max-w-2xl">
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                Meet people like a social app.
              </h1>
              <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-white/78">
                Get My Bee turns startup networking into a visual feed of profiles, stories, warm
                intros, reactions, and agent-assisted recommendations.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-black backdrop-blur-xl">
                  <ShieldCheck className="h-4 w-4" /> Approval-gated
                </span>
              </div>
            </div>
          </div>

          <div className="absolute right-5 top-24 hidden w-72 rounded-[1.7rem] border border-[#f7b801]/50 bg-black/55 p-4 shadow-2xl backdrop-blur-2xl xl:block">
            <div className="flex items-center justify-between">
              <p className="font-black">Stories</p>
              <Camera className="h-5 w-5 text-[#f7b801]" />
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
                  <span className="-mt-8 ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#f7b801] text-[10px] font-black text-black">
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
                <p className="truncate text-sm font-bold text-[#8a6a00]">Pre-seed founder</p>
              </div>
              <BadgeCheck className="h-5 w-5 text-[#4aa3ff]" />
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Looking for design partners who can give feedback on onboarding analytics.
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm font-black text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-4 w-4 fill-[#f7b801] text-[#111111]" /> 2.8k
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
                Sign in with your email
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
            <p className="text-xs font-semibold text-slate-400">
              No password needed — your email gets you in.
            </p>
            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            <Button
              type="submit"
              className="h-13 w-full rounded-2xl bg-black text-base font-black text-white hover:bg-black/85"
              disabled={submitting}
            >
              {submitting ? "Connecting..." : "Continue with email"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Stories", "Matches", "Messages"].map((item) => (
              <div key={item} className="rounded-2xl bg-[#fff4c8] px-3 py-3 text-center">
                <p className="text-xs font-black text-[#8a6a00]">{item}</p>
                <p className="mt-1 text-lg font-black">
                  {item === "Stories" ? "24" : item === "Matches" ? "3" : "6"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
