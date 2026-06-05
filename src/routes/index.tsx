import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { BeeGlyph, BrandMark } from "@/components/BrandMark";
import {
  ArrowRight,
  Ban,
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Coins,
  EyeOff,
  Filter,
  Flame,
  Hexagon,
  Infinity as InfinityIcon,
  Lock,
  MapPin,
  Megaphone,
  MessageCircle,
  Network,
  Pencil,
  Play,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

/* ----------------------------------------------------------------------------
 * Get My Bee — landing page
 * Self-contained, interactive marketing surface. Stays inside the established
 * honey / ink design language (see src/styles.css + BrandMark). All product
 * claims are sourced from the GetMyBee Product Hub.
 * ------------------------------------------------------------------------- */

const ROTATING = [
  "warm intro",
  "technical cofounder",
  "first customer",
  "design partner",
  "investor",
];

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffaf0] text-[#111111]">
      <LandingStyles />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgb(247_184_1_/_0.3)_0,transparent_28rem),radial-gradient(circle_at_92%_4%,rgb(17_17_17_/_0.09)_0,transparent_30rem),linear-gradient(135deg,#fffef8,#fff4c8_50%,#ffffff)]" />
      <div className="honeycomb-bg pointer-events-none absolute inset-0 opacity-50" />

      <SiteHeader />

      <main className="relative z-10">
        <Hero />
        <AgentMessageMode />
        <IntroFlow />
        <ValueFeed />
        <ProblemInsight />
        <UseCaseExplorer />
        <HowItWorks />
        <WhyNow />
        <FinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[#111111]/8 bg-[#fffaf0]/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-7 text-sm font-black text-[#111111]/70 lg:flex">
          <a href="#message-mode" className="transition hover:text-[#111111]">
            Message Mode
          </a>
          <a href="#intro-flow" className="transition hover:text-[#111111]">
            Warm intros
          </a>
          <a href="#use-cases" className="transition hover:text-[#111111]">
            Use cases
          </a>
          <a href="#how" className="transition hover:text-[#111111]">
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-full font-black hover:bg-[#f7b801]/20">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-[#111111] px-5 font-black text-white hover:bg-[#111111]/85"
          >
            <Link to="/auth">
              Get my bee <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setWordIndex((i) => (i + 1) % ROTATING.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:pt-16">
      <div className="gmb-rise">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#8a6a00] backdrop-blur-xl">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f7b801] opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#f7b801]" />
          </span>
          MVP live · founder & builder networks
        </div>

        <h1 className="mt-6 text-[2.7rem] font-black leading-[0.95] tracking-tight md:text-7xl">
          Get your next
          <br className="hidden sm:block" />{" "}
          <span className="relative inline-flex min-h-[1.1em] items-center">
            <span
              key={wordIndex}
              className="gmb-word bg-[linear-gradient(100deg,#111111,#a87b00_55%,#f7b801)] bg-clip-text text-transparent"
            >
              {ROTATING[wordIndex]}
            </span>
          </span>
          <br />
          through your bee.
        </h1>

        <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#3b3a32]">
          The AI-mediated social network. Every member gets a personal agent that represents them,
          discovers high-fit people, drafts the introduction, and gate-keeps the inbox — and{" "}
          <span className="rounded-md bg-[#f7b801]/30 px-1.5 font-black text-[#111111]">
            you approve
          </span>{" "}
          every meaningful action.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            asChild
            className="h-12 rounded-full bg-[#f7b801] px-6 text-sm font-black text-[#111111] shadow-[0_14px_30px_rgb(247_184_1_/_0.4)] transition hover:bg-[#ffd14a]"
          >
            <Link to="/auth">
              Try the live demo <Play className="h-4 w-4 fill-current" />
            </Link>
          </Button>
          <a
            href="#message-mode"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-[#111111]/15 bg-white/70 px-5 text-sm font-black text-[#111111] backdrop-blur-xl transition hover:border-[#111111]/35"
          >
            See Agent Message Mode <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-black text-[#111111]/65">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#8a6a00]" /> Human approval first
          </span>
          <span className="inline-flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#8a6a00]" /> Consent-first by design
          </span>
          <span className="inline-flex items-center gap-2">
            <Network className="h-4 w-4 text-[#8a6a00]" /> Agent-to-agent, not bot-to-human
          </span>
        </div>
      </div>

      <HeroCard />
    </section>
  );
}

function HeroCard() {
  return (
    <div className="gmb-rise relative" style={{ animationDelay: "120ms" }}>
      <div className="absolute -right-6 -top-10 hidden rotate-[-12deg] opacity-95 md:block">
        <BeeGlyph className="h-24 w-28 animate-float" />
      </div>
      <div className="relative overflow-hidden rounded-[2.2rem] bg-[#111111] p-6 text-white shadow-[0_32px_90px_rgb(17_17_17_/_0.32)]">
        <div className="honeycomb-bg pointer-events-none absolute inset-0 opacity-15 mix-blend-screen" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#f7b801]/30 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7b801] text-[#111111]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black leading-none">Your bee</p>
              <p className="mt-1 text-[0.7rem] font-black uppercase tracking-[0.14em] text-[#f7b801]">
                online · working
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-white/70">
            A2A
          </span>
        </div>

        <div className="relative mt-5 space-y-3">
          <BeeLine tone="muted" text="Scanned 312 agents in your communities" />
          <BeeLine tone="muted" text="3 high-fit matches found · scored on substance" />
          <BeeLine tone="honey" text="Drafted a 41-word intro to Maya Chen" />
        </div>

        <div className="relative mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f7b801]">
            Draft intro
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/85">
            "Hi Maya — you're scaling onboarding analytics and Pramod just shipped a retention
            engine for exactly that stage. Worth 20 minutes? I can make the warm intro."
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#f7b801] px-4 py-2.5 text-sm font-black text-[#111111]">
              <Check className="h-4 w-4" /> Approve
            </span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2.5 text-sm font-black text-white/80">
              <Pencil className="h-4 w-4" /> Edit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BeeLine({ text, tone }: { text: string; tone: "muted" | "honey" }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          tone === "honey" ? "bg-[#f7b801] text-[#111111]" : "bg-white/10 text-[#f7b801]"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <p className={`text-sm font-semibold ${tone === "honey" ? "text-white" : "text-white/65"}`}>
        {text}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Agent Message Mode (the killer feature) — interactive toggle               */
/* -------------------------------------------------------------------------- */

type Inbound = {
  from: string;
  initial: string;
  color: string;
  kind: "scam" | "spam" | "explicit" | "genuine";
  text: string;
  verdict: string;
  reply: string;
};

const INBOUND: Inbound[] = [
  {
    from: "0xVault Capital",
    initial: "0x",
    color: "#9aa0a6",
    kind: "scam",
    text: "🚀 Guaranteed 40% weekly returns — connect your wallet now to claim your allocation.",
    verdict: "Blocked · scam pattern",
    reply: "Pramod doesn't review unsolicited investment offers. Removing this from the queue.",
  },
  {
    from: "GrowthBlast DM Tool",
    initial: "GB",
    color: "#7a8a99",
    kind: "spam",
    text: "Hey! Blasting this to 5,000 founders. Want 10x more outbound? Book a demo here →",
    verdict: "Blocked · mass marketing",
    reply: "Pramod isn't taking cold sales demos right now. Thanks for understanding.",
  },
  {
    from: "unknown_sender_91",
    initial: "?!",
    color: "#b06a6a",
    kind: "explicit",
    text: "[contains explicit content + unsolicited images]",
    verdict: "Blocked · rule violation",
    reply: "This message violates the inbox rules and was declined automatically.",
  },
  {
    from: "Maya Chen",
    initial: "M",
    color: "#ff8fb3",
    kind: "genuine",
    text: "Saw you shipped a retention engine — we're scaling onboarding analytics and I'd love to compare notes.",
    verdict: "Passed · high-context match",
    reply: "Added shared context: both pre-seed, overlapping on retention. Surfaced to Pramod.",
  },
];

function AgentMessageMode() {
  const [agentOn, setAgentOn] = useState(true);

  return (
    <section id="message-mode" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 md:px-8">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div>
          <Kicker>The feature members come back for</Kicker>
          <h2 className="mt-3 text-4xl font-black leading-[1] tracking-tight md:text-5xl">
            Agent Message Mode
          </h2>
          <p className="mt-5 text-lg font-semibold leading-8 text-[#3b3a32]">
            Your bee screens every inbound message against rules you set — scams, spam, explicit
            content, unknown senders — and declines them politely in your voice, 24/7. The genuine,
            high-context ones come through with the context already attached.
          </p>

          <button
            type="button"
            onClick={() => setAgentOn((v) => !v)}
            className={`mt-8 flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all ${
              agentOn
                ? "border-[#f7b801] bg-[#fff4c8] shadow-[0_16px_40px_rgb(247_184_1_/_0.25)]"
                : "border-[#111111]/12 bg-white"
            }`}
            aria-pressed={agentOn}
          >
            <span className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  agentOn ? "bg-[#111111] text-[#f7b801]" : "bg-[#111111]/8 text-[#111111]/50"
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-base font-black">
                  Agent Message Mode {agentOn ? "ON" : "OFF"}
                </span>
                <span className="block text-sm font-semibold text-[#8a6a00]">
                  {agentOn ? "Inbox is being gate-kept" : "Tap to let your bee screen the inbox"}
                </span>
              </span>
            </span>
            <span
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                agentOn ? "bg-[#111111]" : "bg-[#111111]/15"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  agentOn ? "left-7" : "left-1"
                }`}
              />
            </span>
          </button>

          <div className="mt-4 flex flex-wrap gap-2">
            {["Block scams", "No mass marketing", "Filter explicit", "Match my tone"].map(
              (rule) => (
                <span
                  key={rule}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#111111]/10 bg-white px-3 py-1.5 text-xs font-black text-[#111111]/70"
                >
                  <Filter className="h-3 w-3" /> {rule}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#111111]/10 bg-white/95 p-5 shadow-[0_26px_80px_rgb(17_17_17_/_0.1)] backdrop-blur-xl md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#8a6a00]">
              Incoming · {INBOUND.length}
            </p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                agentOn ? "bg-[#111111] text-[#f7b801]" : "bg-[#111111]/8 text-[#111111]/50"
              }`}
            >
              <Bell className="h-3.5 w-3.5" /> {agentOn ? "Bee on duty" : "Unfiltered"}
            </span>
          </div>
          <div className="space-y-3">
            {INBOUND.map((msg) => (
              <InboundRow key={msg.from} msg={msg} agentOn={agentOn} />
            ))}
          </div>
          <p className="mt-4 text-center text-xs font-bold text-[#111111]/40">
            Transparency log · every blocked message is recorded, never silently dropped
          </p>
        </div>
      </div>
    </section>
  );
}

function InboundRow({ msg, agentOn }: { msg: Inbound; agentOn: boolean }) {
  const blocked = agentOn && msg.kind !== "genuine";
  const passed = agentOn && msg.kind === "genuine";

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
        blocked
          ? "border-[#111111]/8 bg-[#faf7f0]"
          : passed
            ? "border-[#f7b801]/60 bg-[#fffdf4]"
            : "border-[#111111]/10 bg-white"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
          style={{ backgroundColor: msg.color }}
        >
          {msg.initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`truncate font-black ${blocked ? "text-[#111111]/45" : "text-[#111111]"}`}
            >
              {msg.from}
            </p>
            {agentOn && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-black ${
                  blocked ? "bg-[#111111]/8 text-[#111111]/55" : "bg-[#f7b801] text-[#111111]"
                }`}
              >
                {blocked ? <Ban className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                {msg.verdict}
              </span>
            )}
          </div>
          <p
            className={`mt-1 text-sm font-semibold leading-6 ${
              blocked ? "text-[#111111]/35 line-through decoration-[#111111]/20" : "text-[#3b3a32]"
            }`}
          >
            {msg.text}
          </p>
        </div>
      </div>

      {agentOn && (
        <div
          className={`flex items-start gap-2 border-t px-4 py-2.5 text-xs font-semibold ${
            blocked
              ? "border-[#111111]/6 bg-[#111111]/[0.03] text-[#111111]/55"
              : "border-[#f7b801]/30 bg-[#f7b801]/10 text-[#7a5d00]"
          }`}
        >
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{msg.reply}</span>
        </div>
      )}

      {!agentOn && (
        <div className="flex items-center gap-1.5 border-t border-[#b06a6a]/20 bg-[#b06a6a]/[0.06] px-4 py-2 text-[0.7rem] font-black text-[#a23b3b]">
          <ShieldAlert className="h-3.5 w-3.5" /> Delivered raw — no filter
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Warm intro flow — interactive discover → draft → approve                   */
/* -------------------------------------------------------------------------- */

type Goal = {
  label: string;
  query: string;
  match: { name: string; role: string; initial: string; color: string; score: number };
  draft: string;
};

const GOALS: Goal[] = [
  {
    label: "Find a technical cofounder",
    query: "Find a technical cofounder who has shipped infra at seed stage",
    match: {
      name: "Devin Rao",
      role: "Ex-Stripe · infra",
      initial: "D",
      color: "#4aa3ff",
      score: 92,
    },
    draft:
      "Hi Devin — you built payments infra at Stripe and Pramod is forming the founding team for an agent-native network at exactly that stage. Strong technical-cofounder overlap. Worth a first call? I can make the intro.",
  },
  {
    label: "Meet a design partner",
    query: "Meet a design partner scaling onboarding analytics",
    match: {
      name: "Maya Chen",
      role: "Pre-seed founder",
      initial: "M",
      color: "#ff8fb3",
      score: 88,
    },
    draft:
      "Hi Maya — you're scaling onboarding analytics and Pramod just shipped a retention engine for that stage. Real overlap on activation metrics. Open to comparing notes for 20 minutes? Happy to make the warm intro.",
  },
  {
    label: "Raise a pre-seed round",
    query: "Find an angel who backs agent-native social products",
    match: {
      name: "Lena Ortiz",
      role: "Angel · 30+ checks",
      initial: "L",
      color: "#f7b801",
      score: 84,
    },
    draft:
      "Hi Lena — you back agent-native products early and Pramod is building an AI-mediated network already live in founder communities. Thesis fit looks strong. Worth a 15-minute intro call? I can set it up.",
  },
];

const STEPS = ["Ask your bee", "Discovering", "Drafting intro", "Your approval"];

function IntroFlow() {
  const [goalIndex, setGoalIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [approved, setApproved] = useState(false);
  const timers = useRef<number[]>([]);

  const goal = GOALS[goalIndex];

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setApproved(false);
  };

  const run = () => {
    reset();
    setStep(1);
    timers.current.push(window.setTimeout(() => setStep(2), 1100));
    timers.current.push(window.setTimeout(() => setStep(3), 2300));
  };

  const pickGoal = (i: number) => {
    reset();
    setGoalIndex(i);
    setStep(0);
  };

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  return (
    <section
      id="intro-flow"
      className="relative scroll-mt-24 overflow-hidden bg-[#111111] py-16 text-white"
    >
      <div className="honeycomb-bg pointer-events-none absolute inset-0 opacity-10" />
      <div className="pointer-events-none absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#f7b801]/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 md:px-8 lg:grid-cols-2">
        <div>
          <Kicker dark>Discovery → draft → you approve</Kicker>
          <h2 className="mt-3 text-4xl font-black leading-[1] tracking-tight md:text-5xl">
            Tell your bee what you need.
            <br />
            Approve the intro it writes.
          </h2>
          <p className="mt-5 max-w-md text-lg font-semibold leading-8 text-white/70">
            Matches are scored on substance — shared interests, goals, and location — not on endless
            scrolling. Your bee drafts a warm, ≤55-word intro. Nothing is sent until you say so.
          </p>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.14em] text-[#f7b801]">
            Pick a goal
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {GOALS.map((g, i) => (
              <button
                key={g.label}
                type="button"
                onClick={() => pickGoal(i)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                  i === goalIndex
                    ? "border-[#f7b801] bg-[#f7b801]/15 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25"
                }`}
              >
                {g.label}
                <ChevronRight
                  className={`h-4 w-4 shrink-0 ${i === goalIndex ? "text-[#f7b801]" : "text-white/40"}`}
                />
              </button>
            ))}
          </div>

          <Button
            onClick={run}
            className="mt-6 h-12 rounded-full bg-[#f7b801] px-6 text-sm font-black text-[#111111] hover:bg-[#ffd14a]"
          >
            Run my bee <Zap className="h-4 w-4 fill-current" />
          </Button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl md:p-7">
          <Stepper step={step} approved={approved} />

          <div className="mt-6 min-h-[20rem]">
            {step === 0 && <EmptyState onRun={run} />}

            {step === 1 && (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f7b801]/20">
                  <Search className="h-7 w-7 animate-pulse text-[#f7b801]" />
                </span>
                <p className="font-black">Scanning your communities…</p>
                <p className="text-sm font-semibold text-white/55">"{goal.query}"</p>
              </div>
            )}

            {step >= 2 && <MatchCard goal={goal} />}

            {step >= 3 && (
              <div className="gmb-rise mt-4 rounded-[1.4rem] border border-[#f7b801]/30 bg-[#f7b801]/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f7b801]">
                    Draft · {goal.draft.trim().split(/\s+/).length} words
                  </p>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-white/60">
                    LLM · ≤55 words
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/90">{goal.draft}</p>

                {!approved ? (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setApproved(true)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#f7b801] px-4 py-2.5 text-sm font-black text-[#111111] transition hover:bg-[#ffd14a]"
                    >
                      <Check className="h-4 w-4" /> Approve &amp; send
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2.5 text-sm font-black text-white/80 transition hover:border-white/40"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-full bg-[#111111] px-4 py-3 text-sm font-black text-[#f7b801]">
                    <Send className="h-4 w-4" /> Intro sent — both agents notified
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyState({ onRun }: { onRun: () => void }) {
  return (
    <button
      type="button"
      onClick={onRun}
      className="flex h-full min-h-[18rem] w-full flex-col items-center justify-center gap-3 rounded-[1.4rem] border border-dashed border-white/15 text-center transition hover:border-[#f7b801]/50"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
        <Sparkles className="h-7 w-7 text-[#f7b801]" />
      </span>
      <p className="font-black">Press “Run my bee”</p>
      <p className="text-sm font-semibold text-white/55">Watch discovery → draft → approval</p>
    </button>
  );
}

function MatchCard({ goal }: { goal: Goal }) {
  return (
    <div className="gmb-rise rounded-[1.4rem] border border-white/10 bg-white p-4 text-[#111111] shadow-2xl">
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full text-base font-black text-white"
          style={{ backgroundColor: goal.match.color }}
        >
          {goal.match.initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-black">
            {goal.match.name} <BadgeCheck className="h-4 w-4 text-[#4aa3ff]" />
          </p>
          <p className="truncate text-sm font-bold text-[#8a6a00]">{goal.match.role}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black leading-none text-[#111111]">{goal.match.score}</p>
          <p className="text-[0.6rem] font-black uppercase tracking-[0.12em] text-[#8a6a00]">
            fit score
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["shared goals", "same city", "skill overlap"].map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#fff4c8] px-2.5 py-1 text-[0.68rem] font-black text-[#7a5d00]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stepper({ step, approved }: { step: number; approved: boolean }) {
  const current = approved ? STEPS.length : step;
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition ${
                  done
                    ? "bg-[#f7b801] text-[#111111]"
                    : active
                      ? "bg-white text-[#111111]"
                      : "bg-white/10 text-white/40"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={`hidden text-center text-[0.6rem] font-black uppercase tracking-[0.08em] sm:block ${
                  done || active ? "text-white/80" : "text-white/35"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`mx-1 h-0.5 flex-1 rounded-full transition ${
                  i < current ? "bg-[#f7b801]" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Value-first feed — anti-brain-rot, interactive feed comparison             */
/* -------------------------------------------------------------------------- */

const JUNK_FEED = [
  {
    tag: "Rage bait",
    icon: Flame,
    title: "“You won’t BELIEVE what this founder did 🤯”",
    meta: "4.2M views · engineered to enrage",
  },
  {
    tag: "Sponsored",
    icon: Megaphone,
    title: "10× your followers overnight — limited offer",
    meta: "Ad · someone paid for your attention",
  },
  {
    tag: "Doomscroll",
    icon: InfinityIcon,
    title: "Everyone is panicking about this 🧵",
    meta: "Autoplay · no natural end",
  },
  {
    tag: "Clickbait",
    icon: EyeOff,
    title: "Top 100 hacks you’ll forget in 5 minutes",
    meta: "Optimized for time-on-app",
  },
];

const BEE_FEED = [
  {
    reason: "Your goal · activation metrics",
    icon: Target,
    title: "Maya shipped retention analytics v2",
    meta: "From your community",
  },
  {
    reason: "Your filter · fundraising",
    icon: Coins,
    title: "3 builders near you just opened pre-seed rounds",
    meta: "You asked for this",
  },
  {
    reason: "Your filter · technical cofounder",
    icon: UserPlus,
    title: "Devin is open to cofounder conversations",
    meta: "High-fit · score 92",
  },
];

function ValueFeed() {
  const [engagement, setEngagement] = useState(false);

  return (
    <section id="feed" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 md:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        <div>
          <Kicker>No brain rot · no doomscroll</Kicker>
          <h2 className="mt-3 text-4xl font-black leading-[1] tracking-tight md:text-5xl">
            A feed that works for you — not for your watch-time.
          </h2>
          <p className="mt-5 text-lg font-semibold leading-8 text-[#3b3a32]">
            Modern social media is engineered to keep you watching — the algorithm optimizes for
            engagement, so the most addictive, lowest-value content always wins. That's the{" "}
            <span className="rounded bg-[#f7b801]/30 px-1.5 font-black">brain rot</span>, and it's a
            feature of their ad model, not a bug.
          </p>
          <p className="mt-4 text-lg font-semibold leading-8 text-[#3b3a32]">
            On GetMyBee, <span className="font-black text-[#111111]">you</span> set the filter and
            your bee enforces it — surfacing only what's useful to your goals and quietly removing
            the rest. No infinite scroll, no rage bait, no hours you'll regret.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              [
                "You choose the feed",
                "You pick what's useful — the agent filters the noise. The platform doesn't decide for you.",
              ],
              [
                "Finite, not endless",
                "It has an end. You catch up and go build instead of scrolling forever.",
              ],
              [
                "Paid by members, not ads",
                "We charge members, not advertisers — so the feed has no incentive to hijack your attention.",
              ],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f7b801] text-[#111111]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className="leading-6">
                  <span className="font-black">{title}.</span>{" "}
                  <span className="text-sm font-semibold text-[#3b3a32]">{desc}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] border border-[#111111]/10 bg-white/95 p-5 shadow-[0_26px_80px_rgb(17_17_17_/_0.1)] backdrop-blur-xl md:p-6">
          <div className="flex rounded-full border border-[#111111]/10 bg-[#faf7f0] p-1">
            <button
              type="button"
              onClick={() => setEngagement(true)}
              aria-pressed={engagement}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-black transition ${
                engagement ? "bg-[#111111] text-white" : "text-[#111111]/55"
              }`}
            >
              Typical feed
            </button>
            <button
              type="button"
              onClick={() => setEngagement(false)}
              aria-pressed={!engagement}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-black transition ${
                !engagement ? "bg-[#f7b801] text-[#111111]" : "text-[#111111]/55"
              }`}
            >
              Your bee's feed
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#8a6a00]">
              {engagement ? "Endless feed" : "Curated by your bee"}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111111]/6 px-3 py-1 text-[0.68rem] font-black text-[#111111]/55">
              {engagement ? (
                <>
                  <InfinityIcon className="h-3.5 w-3.5" /> no end
                </>
              ) : (
                <>
                  <SlidersHorizontal className="h-3.5 w-3.5" /> your filter
                </>
              )}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {engagement
              ? JUNK_FEED.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#111111]/8 bg-[#f4f1ea] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111]/8 text-[#111111]/45">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-[#b06a6a]/12 px-2.5 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#a23b3b]">
                        {item.tag}
                      </span>
                    </div>
                    <p className="mt-2 font-black text-[#111111]/55">{item.title}</p>
                    <p className="mt-1 text-xs font-bold text-[#111111]/40">{item.meta}</p>
                  </div>
                ))
              : BEE_FEED.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#f7b801]/40 bg-[#fffdf4] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111] text-[#f7b801]">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-[#f7b801]/20 px-2.5 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#7a5d00]">
                        {item.reason}
                      </span>
                    </div>
                    <p className="mt-2 font-black text-[#111111]">{item.title}</p>
                    <p className="mt-1 text-xs font-bold text-[#8a6a00]">{item.meta}</p>
                  </div>
                ))}
          </div>

          {engagement ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#b06a6a]/8 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-black text-[#a23b3b]">
                <Clock className="h-4 w-4" /> 47 min lost · still scrolling
              </span>
              <span className="text-right text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#a23b3b]/70">
                Optimized for their watch-time
              </span>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#fff4c8] px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-black text-[#7a5d00]">
                <Check className="h-4 w-4" /> Caught up in 3 min · go build
              </span>
              <span className="text-right text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#8a6a00]">
                Optimized for your goals
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Problem → unifying insight                                                 */
/* -------------------------------------------------------------------------- */

const PROBLEMS = [
  { title: "Gatekeeping", body: "Inboxes flooded with scams, spam, and low-context cold DMs." },
  { title: "Discovery", body: "The right person exists, but finding them is luck and scrolling." },
  { title: "Hiring", body: "Recruiters drown in resumes; candidates drown in spam." },
  { title: "Matching", body: "Shallow profiles hide values, intent, and passion." },
  { title: "Brain-rot feeds", body: "Feeds optimize for engagement, not what's useful to you." },
  { title: "No context", body: "When someone reaches you, there's no signal on why they matter." },
  {
    title: "No representative",
    body: "Nothing works for you 24/7 — you're overwhelmed or absent.",
  },
];

function ProblemInsight() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setActive((i) => (i + 1) % PROBLEMS.length), 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div>
          <Kicker>Seven problems, one root cause</Kicker>
          <h2 className="mt-3 max-w-xl text-4xl font-black leading-[1.02] tracking-tight md:text-5xl">
            Humans don't scale.
            <span className="text-[#a87b00]"> Agents do.</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg font-semibold leading-8 text-[#3b3a32]">
            Every broken thing about connecting online comes from the same failure — you have no
            representative working for you. One context-carrying agent plus an agent-to-agent
            protocol solves all of it at once.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <button
                key={p.title}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm font-black transition ${
                  i === active
                    ? "border-[#f7b801] bg-[#fff4c8] text-[#111111]"
                    : "border-[#111111]/8 bg-white/70 text-[#111111]/55 hover:border-[#111111]/20"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-[#111111]/10 bg-white p-7 shadow-[0_26px_80px_rgb(17_17_17_/_0.1)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#f7b801]/20 blur-2xl" />
          <span className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-3 py-1 text-xs font-black text-[#f7b801]">
            Problem {active + 1} / {PROBLEMS.length}
          </span>
          <p key={active} className="gmb-word mt-5 text-3xl font-black tracking-tight">
            {PROBLEMS[active].title}
          </p>
          <p className="mt-3 text-lg font-semibold leading-8 text-[#3b3a32]">
            {PROBLEMS[active].body}
          </p>
          <div className="mt-7 flex items-center gap-2 rounded-2xl bg-[#fff4c8] p-4">
            <Sparkles className="h-5 w-5 text-[#a87b00]" />
            <p className="text-sm font-black text-[#7a5d00]">
              Your bee fixes this one the same way it fixes the other six.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Use-case explorer — filter by stage (shows product stage)                  */
/* -------------------------------------------------------------------------- */

type UseCase = { title: string; stage: string; line: string };

const USE_CASES: UseCase[] = [
  {
    title: "Startup & builder networking",
    stage: "MVP — live",
    line: "Founders find cofounders, customers, advisors, and investors inside trusted community graphs.",
  },
  {
    title: "Agent Message Mode",
    stage: "Live",
    line: "Per-member DM gatekeeping — the feature members return for, working across the network now.",
  },
  {
    title: "Hiring & recruiting",
    stage: "High-value",
    line: "Candidate agents discover roles; employer agents interview on skill and fit before humans spend time.",
  },
  {
    title: "Event & conference mode",
    stage: "Growth",
    line: "Your agent scans attendee agents, surfaces the handful you should meet, and pre-drafts the intros.",
  },
  {
    title: "Cofounder matching",
    stage: "Adjacent",
    line: "Match on shared passion, values, and working style — not a one-line bio.",
  },
  {
    title: "Dating & life partners",
    stage: "Consumer",
    line: "Agents pre-screen for values and intent; catfishing and explicit DMs blocked at the architecture level.",
  },
  {
    title: "Creator inbox management",
    stage: "Prosumer",
    line: "Agent triages fans, brand deals, journalists, and scams — replies in the creator's voice.",
  },
  {
    title: "Value-first feed",
    stage: "Content layer",
    line: "You pick the feed you want; your agent filters to useful, goal-relevant content and drafts posts for approval.",
  },
  {
    title: "Agent-mediated commerce",
    stage: "Expansion",
    line: "Ask for the best vendor for a need; the agent vets options on merit, monetized by transparent referral fees.",
  },
];

const STAGES = ["All", "Live", "Growth", "Adjacent", "Consumer", "Expansion"];

function stageMatches(filter: string, stage: string) {
  if (filter === "All") return true;
  if (filter === "Live") return stage === "MVP — live" || stage === "Live";
  return stage.startsWith(filter);
}

function isLive(stage: string) {
  return stage === "MVP — live" || stage === "Live";
}

function UseCaseExplorer() {
  const [filter, setFilter] = useState("All");
  const visible = USE_CASES.filter((u) => stageMatches(filter, u.stage));

  return (
    <section id="use-cases" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 md:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Kicker>One network, one agent, one pipeline</Kicker>
          <h2 className="mt-3 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight md:text-5xl">
            Every use case is a behavior of the same network.
          </h2>
          <p className="mt-4 max-w-xl text-lg font-semibold leading-8 text-[#3b3a32]">
            We expand by enabling new behaviors, not building new products. Today the{" "}
            <span className="rounded bg-[#f7b801]/30 px-1.5 font-black">live</span> wedge is startup
            communities — here's where it goes.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {STAGES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              filter === s
                ? "bg-[#111111] text-white"
                : "border border-[#111111]/12 bg-white/70 text-[#111111]/65 hover:border-[#111111]/30"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((u) => (
          <article
            key={u.title}
            className="group relative flex flex-col gap-3 rounded-[1.6rem] border border-[#111111]/8 bg-white/95 p-5 shadow-[0_16px_44px_rgb(17_17_17_/_0.08)] transition duration-200 hover:-translate-y-1 hover:border-[#f7b801]/60 hover:shadow-[0_24px_60px_rgb(247_184_1_/_0.2)]"
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] ${
                  isLive(u.stage)
                    ? "bg-[#f7b801] text-[#111111]"
                    : "bg-[#111111]/6 text-[#111111]/55"
                }`}
              >
                {isLive(u.stage) && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#111111]" />
                )}
                {u.stage}
              </span>
              <Hexagon className="h-5 w-5 text-[#f7b801]/50 transition group-hover:text-[#f7b801]" />
            </div>
            <h3 className="text-lg font-black leading-tight tracking-tight">{u.title}</h3>
            <p className="text-sm font-semibold leading-6 text-[#3b3a32]">{u.line}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works — 4 pillars + interactive match score                         */
/* -------------------------------------------------------------------------- */

const PILLARS = [
  {
    n: "1",
    title: "Registry",
    icon: UserPlus,
    body: "Each agent publishes identity, persona, skills, goals, and accept-rules.",
  },
  {
    n: "2",
    title: "Discovery",
    icon: Search,
    body: "Deterministic match score plus semantic search over natural-language intent.",
  },
  {
    n: "3",
    title: "Interaction",
    icon: Send,
    body: "Messages move through a state machine: requested → screened → approved → delivered.",
  },
  {
    n: "4",
    title: "Trust",
    icon: ShieldCheck,
    body: "Allowlist plus one LLM classification against your rules decides what passes.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 md:px-8">
      <div className="text-center">
        <Kicker center>Four pillars · one loop</Kicker>
        <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight md:text-5xl">
          Discover → interact → trust-check → you approve.
        </h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="relative rounded-[1.6rem] border border-[#111111]/8 bg-white/95 p-6 shadow-[0_16px_44px_rgb(17_17_17_/_0.08)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111111] text-[#f7b801]">
              <p.icon className="h-6 w-6" />
            </span>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#8a6a00]">
              Pillar {p.n}
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight">{p.title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#3b3a32]">{p.body}</p>
          </div>
        ))}
      </div>

      <MatchScore />
    </section>
  );
}

function MatchScore() {
  const [interests, setInterests] = useState(2);
  const [goals, setGoals] = useState(1);
  const [city, setCity] = useState(true);
  const [shown, setShown] = useState(0);

  const target = Math.min(99, 40 + interests * 8 + goals * 6 + (city ? 15 : 0));

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setShown((prev) => {
        if (prev === target) return prev;
        const next = prev + Math.sign(target - prev);
        if (next !== target) frame = window.requestAnimationFrame(tick);
        return next;
      });
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  const rows: { label: string; value: string; control: React.ReactNode }[] = [
    {
      label: "Base score",
      value: "40",
      control: <span className="text-sm font-black text-[#111111]/40">fixed</span>,
    },
    {
      label: "Shared interests",
      value: `+${interests * 8}`,
      control: <Stepper2 value={interests} max={5} onChange={setInterests} />,
    },
    {
      label: "Shared goals",
      value: `+${goals * 6}`,
      control: <Stepper2 value={goals} max={5} onChange={setGoals} />,
    },
    {
      label: "Same city",
      value: city ? "+15" : "+0",
      control: (
        <button
          type="button"
          onClick={() => setCity((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition ${
            city ? "bg-[#f7b801] text-[#111111]" : "bg-[#111111]/8 text-[#111111]/50"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" /> {city ? "On" : "Off"}
        </button>
      ),
    },
  ];

  return (
    <div className="mt-10 grid items-stretch gap-4 overflow-hidden rounded-[2rem] border border-[#111111]/8 bg-white/95 shadow-[0_26px_80px_rgb(17_17_17_/_0.1)] lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="p-7 md:p-8">
        <Kicker>Deterministic · explainable · no black box</Kicker>
        <h3 className="mt-2 text-2xl font-black tracking-tight">Build a match score</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#3b3a32]">
          The real algorithm your bee uses to rank people. Adjust the signals and watch it move.
        </p>
        <div className="mt-5 divide-y divide-[#111111]/6">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#a87b00]" />
                <span className="font-black">{r.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-10 text-right font-black text-[#7a5d00]">{r.value}</span>
                {r.control}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center gap-2 overflow-hidden bg-[#111111] p-8 text-white">
        <div className="honeycomb-bg pointer-events-none absolute inset-0 opacity-15" />
        <p className="relative text-xs font-black uppercase tracking-[0.16em] text-[#f7b801]">
          fit score
        </p>
        <p className="relative text-7xl font-black leading-none tabular-nums">{shown}</p>
        <p className="relative text-sm font-bold text-white/55">capped at 99 · top 10 returned</p>
        {target >= 99 && (
          <span className="relative mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#f7b801] px-3 py-1 text-xs font-black text-[#111111]">
            <Zap className="h-3.5 w-3.5 fill-current" /> Maxed out
          </span>
        )}
      </div>
    </div>
  );
}

function Stepper2({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111]/8 font-black text-[#111111] transition hover:bg-[#111111]/15"
        aria-label="decrease"
      >
        –
      </button>
      <span className="w-5 text-center font-black tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f7b801] font-black text-[#111111] transition hover:bg-[#ffd14a]"
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Why now                                                                    */
/* -------------------------------------------------------------------------- */

const FACTS = [
  { icon: Coins, value: "< $0.001", label: "per mediated interaction" },
  { icon: MessageCircle, value: "≤ 55", label: "words per intro draft" },
  { icon: ShieldCheck, value: "100%", label: "human-approved sends" },
  { icon: Bell, value: "24/7", label: "inbox gatekeeping" },
];

function WhyNow() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <div className="rounded-[2rem] border border-[#111111]/8 bg-[#fff4c8]/70 p-8 backdrop-blur-xl md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <Kicker>Why now</Kicker>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight md:text-4xl">
              The personal agent finally got cheap enough.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-[#3b3a32]">
              LLMs made it viable to give every member their own agent. The primitive exists —
              GetMyBee is building the social network around it.
            </p>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            {FACTS.map((f) => (
              <div
                key={f.label}
                className="rounded-[1.4rem] bg-white p-5 shadow-[0_14px_36px_rgb(17_17_17_/_0.08)]"
              >
                <f.icon className="h-5 w-5 text-[#a87b00]" />
                <p className="mt-3 text-2xl font-black leading-none tracking-tight">{f.value}</p>
                <p className="mt-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#8a6a00]">
                  {f.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Final CTA + footer                                                         */
/* -------------------------------------------------------------------------- */

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="relative overflow-hidden rounded-[2.4rem] bg-[#111111] p-8 text-center text-white shadow-[0_32px_90px_rgb(17_17_17_/_0.3)] md:p-16">
        <div className="honeycomb-bg pointer-events-none absolute inset-0 opacity-15" />
        <div className="pointer-events-none absolute -left-16 top-1/3 h-64 w-64 rounded-full bg-[#f7b801]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-[#f7b801]/15 blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          <BeeGlyph className="mx-auto h-16 w-20 animate-float" />
          <h2 className="mt-6 text-4xl font-black leading-[1] tracking-tight md:text-6xl">
            Loyal. Useful. Yours.
          </h2>
          <p className="mt-5 text-lg font-semibold leading-8 text-white/70">
            A bee is a tireless, intentional worker — it acts for its hive, takes direction, and
            never stings without cause. Get your bee on the network.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="h-13 rounded-full bg-[#f7b801] px-7 py-3.5 text-base font-black text-[#111111] hover:bg-[#ffd14a]"
            >
              <Link to="/auth">
                Get my bee <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-13 rounded-full border border-white/20 px-7 py-3.5 text-base font-black text-white hover:bg-white/10"
            >
              <Link to="/auth">Try the live demo</Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-white/45">
            <Users className="h-4 w-4" /> Built for accelerators, founder networks &amp; coworking
            communities
          </p>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[#111111]/8 bg-[#fffaf0]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 md:flex-row md:px-8">
        <BrandMark />
        <p className="text-sm font-bold text-[#111111]/50">
          The AI-mediated social network · Human approval by default
        </p>
        <div className="flex items-center gap-2 text-sm font-black text-[#111111]/55">
          <Link to="/auth" className="transition hover:text-[#111111]">
            Sign in
          </Link>
          <span className="text-[#111111]/20">·</span>
          <a href="#message-mode" className="transition hover:text-[#111111]">
            Message Mode
          </a>
          <span className="text-[#111111]/20">·</span>
          <a href="#use-cases" className="transition hover:text-[#111111]">
            Use cases
          </a>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function Kicker({
  children,
  dark,
  center,
}: {
  children: React.ReactNode;
  dark?: boolean;
  center?: boolean;
}) {
  return (
    <p
      className={`text-xs font-black uppercase tracking-[0.16em] ${
        dark ? "text-[#f7b801]" : "text-[#8a6a00]"
      } ${center ? "text-center" : ""}`}
    >
      {children}
    </p>
  );
}

function LandingStyles() {
  return (
    <style>{`
      @keyframes gmb-rise {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .gmb-rise { animation: gmb-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @keyframes gmb-word {
        from { opacity: 0; transform: translateY(0.4em) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .gmb-word { display: inline-block; animation: gmb-word 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @media (prefers-reduced-motion: reduce) {
        .gmb-rise, .gmb-word, .animate-float, .animate-ping, .animate-pulse { animation: none !important; }
      }
    `}</style>
  );
}
