import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Heart,
  Lock,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=700&q=85",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=700&q=85",
];

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef4ff] text-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,#ffb6d5_0,transparent_28rem),radial-gradient(circle_at_90%_18%,#b8e5ff_0,transparent_32rem),linear-gradient(135deg,#f8fbff,#d9e8ff_48%,#f7eefc)]" />
      <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(#1f2937_1px,transparent_1px),linear-gradient(90deg,#1f2937_1px,transparent_1px)] [background-size:54px_54px]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-xl">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-xl font-black tracking-tight">AgentCircle</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-full font-black">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-black px-5 font-black text-white hover:bg-black/85"
          >
            <Link to="/auth">
              Enter feed <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-8 px-5 pb-10 md:px-8 lg:grid-cols-[minmax(0,1fr)_520px]">
        <section className="relative min-h-[680px] overflow-hidden rounded-[2rem] bg-black text-white shadow-[0_32px_90px_rgb(38_52_78_/_0.28)] md:rounded-[3rem]">
          <img
            src={HERO_IMAGES[0]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-75"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0_/_0.78),rgb(0_0_0_/_0.22)_54%,rgb(0_0_0_/_0.55))]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black to-transparent" />

          <div className="relative flex min-h-[680px] flex-col justify-between p-6 md:p-10 lg:p-12">
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-black backdrop-blur-xl">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#7df3c8]" />
              AI social networking for builders
            </div>

            <div className="max-w-3xl">
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                A social feed for warm startup intros.
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/78">
                Browse stories, react to founder updates, discover high-fit people, and approve
                agent-drafted intros before anyone gets contacted.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  className="h-12 rounded-full bg-white px-6 text-sm font-black text-black hover:bg-white/90"
                >
                  <Link to="/auth">
                    Try live demo <Play className="h-4 w-4 fill-current" />
                  </Link>
                </Button>
                <span className="inline-flex h-12 items-center gap-2 rounded-full bg-white/15 px-5 text-sm font-black backdrop-blur-xl">
                  <ShieldCheck className="h-4 w-4" /> Human approval first
                </span>
              </div>
            </div>
          </div>

          <FloatingProfile />
          <StoryPreview />
        </section>

        <section className="space-y-5">
          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_26px_80px_rgb(41_55_92_/_0.18)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black tracking-tight">What feels different</h2>
              <Users className="h-7 w-7" />
            </div>
            <div className="mt-6 grid gap-3">
              {[
                ["Stories", "See what active members are building before you ask for an intro."],
                [
                  "Agent ranked matches",
                  "Every card explains mutual value, shared context, and a first topic.",
                ],
                [
                  "Approval-gated messages",
                  "Your AI can draft, but you approve every sensitive action.",
                ],
              ].map(([title, desc], index) => (
                <div key={title} className="flex gap-4 rounded-[1.4rem] bg-slate-100 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-black">{title}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["24", "stories"],
              ["3", "matches"],
              ["6", "drafts"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-[1.4rem] bg-white/90 p-4 text-center shadow-[0_16px_40px_rgb(41_55_92_/_0.12)]"
              >
                <p className="text-3xl font-black">{value}</p>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] bg-black p-6 text-white shadow-[0_26px_70px_rgb(0_0_0_/_0.22)]">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff78a8]">
                <Zap className="h-6 w-6 fill-current" />
              </span>
              <div>
                <p className="text-xl font-black">Live demo ready</p>
                <p className="text-sm font-semibold text-white/60">No setup needed to preview.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FloatingProfile() {
  return (
    <div className="absolute bottom-6 right-6 hidden w-80 rounded-[1.7rem] bg-white p-4 text-black shadow-2xl md:block">
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
        Looking for design partners who can react to onboarding analytics.
      </p>
      <div className="mt-4 flex items-center gap-4 text-sm font-black text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Heart className="h-4 w-4 fill-[#ff6f91] text-[#ff6f91]" /> 2.8k
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" /> 84
        </span>
        <span className="ml-auto rounded-full bg-black px-4 py-2 text-xs text-white">Connect</span>
      </div>
    </div>
  );
}

function StoryPreview() {
  return (
    <div className="absolute right-6 top-24 hidden w-72 rounded-[1.7rem] border border-white/25 bg-white/18 p-4 shadow-2xl backdrop-blur-2xl xl:block">
      <div className="flex items-center justify-between">
        <p className="font-black">Stories</p>
        <Camera className="h-5 w-5 text-white/75" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {HERO_IMAGES.map((src, index) => (
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
      <div className="mt-4 flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-black">
        <Lock className="h-3.5 w-3.5" /> Consent-first intros
      </div>
    </div>
  );
}
