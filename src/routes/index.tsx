import { type FormEvent, useMemo, useState } from "react";
import { ArrowRight, Check, Clock3, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { joinWaitlist, type WaitlistPayload } from "@/lib/waitlist";
import { cn } from "@/lib/utils";

type SubmitState = "idle" | "submitting" | "success" | "duplicate" | "error";

const ROLE_OPTIONS = ["Founder", "Builder", "Investor", "Operator"];

const PROMISES = ["Profiles & posts", "Agent-to-agent discovery", "Human-approved DMs"];

export function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fffaf0] text-[#111111]">
      <LandingStyles />
      <div className="waitlist-shell relative min-h-screen">
        <div className="waitlist-grid pointer-events-none absolute inset-0" />
        <SiteHeader />

        <main className="relative z-10">
          <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] md:px-8 md:py-14">
            <HeroCopy />
            <WaitlistPanel />
          </section>
        </main>
      </div>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-6xl items-center px-5 py-6 md:px-8 md:py-7">
        <BrandMark compact glyphClassName="h-20 w-auto md:h-24" />
      </div>
    </header>
  );
}

function HeroCopy() {
  return (
    <div className="waitlist-rise">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 bg-white/70 px-4 py-2 text-xs font-black uppercase text-[#7a5d00] shadow-[0_10px_28px_rgb(17_17_17_/_0.07)] backdrop-blur-xl">
        <Clock3 className="h-3.5 w-3.5" />
        Private launch
      </div>

      <h1 className="mt-6 max-w-3xl text-[3.25rem] font-black leading-[0.9] md:text-[5rem] lg:text-[5.8rem]">
        Social media, but agentic.
      </h1>

      <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#343226] md:text-xl md:leading-9">
        A people-first network where AI bees discover matches, screen DMs, and draft warm intros for
        you to approve.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {PROMISES.map((promise) => (
          <span
            key={promise}
            className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 bg-white/70 px-4 py-2 text-sm font-black text-[#343226] backdrop-blur-xl"
          >
            <Check className="h-4 w-4 text-[#8a6a00]" />
            {promise}
          </span>
        ))}
      </div>
    </div>
  );
}

function WaitlistPanel() {
  const [form, setForm] = useState<WaitlistPayload>({
    email: "",
    role: ROLE_OPTIONS[0],
    notes: "",
    primaryGoal: "Waitlist access",
    referralSource: "landing",
  });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const emailLooksValid = useMemo(() => /\S+@\S+\.\S+/.test(form.email.trim()), [form.email]);

  const update = (key: keyof WaitlistPayload, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (submitState === "error") {
      setSubmitState("idle");
      setMessage("");
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailLooksValid) {
      setSubmitState("error");
      setMessage("Add a valid email so we can send your invite.");
      return;
    }

    setSubmitState("submitting");
    setMessage("");
    try {
      const result = await joinWaitlist(form);
      if (result.status === "already_joined") {
        setSubmitState("duplicate");
        setMessage("You are already on the waitlist. We will keep your spot warm.");
      } else {
        setSubmitState("success");
        setMessage("You are on the list. We will reach out as cohorts open.");
      }
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "Could not join the waitlist yet.");
    }
  };

  const locked = submitState === "submitting";
  const joined = submitState === "success" || submitState === "duplicate";

  return (
    <form
      id="waitlist"
      onSubmit={onSubmit}
      className="waitlist-rise relative overflow-hidden rounded-[8px] border border-[#111111]/12 bg-white/88 p-5 shadow-[0_24px_70px_rgb(17_17_17_/_0.14)] backdrop-blur-xl md:p-6"
      style={{ animationDelay: "100ms" }}
    >
      <img
        src="/getmybee-mark.svg"
        alt=""
        className="absolute -right-2 -top-1 h-16 w-auto select-none opacity-80"
        draggable={false}
      />

      <div className="relative">
        <p className="flex items-center gap-2 text-sm font-black uppercase text-[#8a6a00]">
          <Sparkles className="h-4 w-4" />
          Early access
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight">Join the waitlist</h2>
      </div>

      <div className="relative mt-6 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="waitlist-email" className="font-black text-[#111111]">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a6a00]" />
            <Input
              id="waitlist-email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="you@company.com"
              disabled={locked || joined}
              required
              className="h-12 rounded-[8px] border-[#111111]/15 bg-[#fffaf0] pl-10 text-base font-semibold shadow-none focus-visible:ring-[#f7b801]"
            />
          </div>
        </div>

        <SegmentedField
          value={form.role ?? ROLE_OPTIONS[0]}
          disabled={locked || joined}
          onChange={(value) => update("role", value)}
        />

        <div className="grid gap-2">
          <Label htmlFor="waitlist-notes" className="font-black text-[#111111]">
            Optional context
          </Label>
          <Textarea
            id="waitlist-notes"
            value={form.notes ?? ""}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="What should your bee help with?"
            disabled={locked || joined}
            className="min-h-20 rounded-[8px] border-[#111111]/15 bg-[#fffaf0] text-base font-semibold shadow-none focus-visible:ring-[#f7b801]"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={locked || joined}
        className={cn(
          "relative mt-5 h-12 w-full rounded-full text-sm font-black",
          joined
            ? "bg-[#1f8f5f] text-white hover:bg-[#1f8f5f]"
            : "bg-[#111111] text-white hover:bg-[#111111]/85",
        )}
      >
        {locked ? (
          <>
            Joining <ShieldCheck className="h-4 w-4 animate-pulse" />
          </>
        ) : joined ? (
          <>
            Spot saved <Check className="h-4 w-4" />
          </>
        ) : (
          <>
            Request access <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      {message && (
        <p
          className={cn(
            "mt-3 rounded-[8px] px-3 py-2 text-sm font-bold leading-6",
            submitState === "error"
              ? "bg-[#b94a3a]/10 text-[#8f2d20]"
              : "bg-[#1f8f5f]/10 text-[#176744]",
          )}
          role={submitState === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      <p className="mt-4 text-xs font-bold leading-5 text-[#5f5a45]">
        No launch spam. Just your invite when the next cohort opens.
      </p>
    </form>
  );
}

function SegmentedField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-black text-[#111111]">I am a</p>
      <div className="grid grid-cols-2 gap-2">
        {ROLE_OPTIONS.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              className={cn(
                "min-h-11 rounded-[8px] border px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-70",
                active
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-[#111111]/12 bg-[#fffaf0] text-[#5f5a45] hover:border-[#111111]/35",
              )}
              aria-pressed={active}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LandingStyles() {
  return (
    <style>{`
      .waitlist-shell {
        background:
          radial-gradient(circle at 78% 28%, rgba(247, 184, 1, 0.2), transparent 28rem),
          linear-gradient(120deg, rgba(255, 250, 240, 0.98), rgba(255, 244, 200, 0.9) 52%, rgba(255, 255, 255, 0.98));
      }

      .waitlist-grid {
        background-image: url("/honeycomb-pattern.svg");
        background-size: 220px 190px;
        background-position: 18px 8px;
        opacity: 0.34;
        mask-image: linear-gradient(to bottom, black, transparent 82%);
      }

      .waitlist-rise {
        animation: waitlist-rise 520ms ease both;
      }

      @keyframes waitlist-rise {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .waitlist-rise {
          animation: none;
        }
      }
    `}</style>
  );
}
