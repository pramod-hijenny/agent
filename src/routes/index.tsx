import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  Users,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Eye,
  Lock,
  MessageCircle,
  Handshake,
  Lightbulb,
  Target,
} from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--gradient-agent)" }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">AgentCircle</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="rounded-xl">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link to="/auth">Create Your Agent</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-agent" />
            AI-mediated introductions for startup communities
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
            Find three useful{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-agent)" }}
            >
              people to meet
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Tell your AI who you need to meet. AgentCircle finds relevant members in your trusted
            startup community, explains the fit, and drafts an intro both sides approve.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/auth">
                Start Matching <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link to="/auth">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
          How AgentCircle works
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            {
              n: 1,
              title: "Build your profile",
              desc: "Join a trusted startup network and share what you're building.",
            },
            {
              n: 2,
              title: "Set your ask",
              desc: "Tell your agent who you need and what you can help with.",
            },
            {
              n: 3,
              title: "Review 3 matches",
              desc: "See role fit, skills, goals, and why each intro is useful.",
            },
            {
              n: 4,
              title: "Approve the intro",
              desc: "Edit the draft and keep contact sharing consent-first.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-card p-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
          Built for high-intent startup networking
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-5">
          {[
            { icon: Briefcase, label: "Founder peers" },
            { icon: Users, label: "Cofounders" },
            { icon: Lightbulb, label: "Mentors" },
            { icon: Target, label: "Design partners" },
            { icon: Handshake, label: "Advisors" },
          ].map((u) => (
            <div
              key={u.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-agent-soft text-agent">
                <u.icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium">{u.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div
          className="rounded-3xl border border-border bg-card p-8 md:p-12"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-safety-soft text-safety-foreground">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Built with you in control
              </h2>
              <p className="mt-2 text-muted-foreground">
                Your agent never pretends to be you. Every action is approved by you.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { icon: CheckCircle2, label: "Human approval required" },
              { icon: Eye, label: "Clear AI labeling" },
              { icon: Lock, label: "Permission controls" },
              { icon: MessageCircle, label: "No contact sharing without consent" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4"
              >
                <s.icon className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20 pt-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Meet the right people, on your terms.
        </h2>
        <p className="mt-3 text-muted-foreground">Set up your agent in under three minutes.</p>
        <Button asChild size="lg" className="mt-6 rounded-xl">
          <Link to="/auth">
            Start Matching <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 AgentCircle. AI-mediated introductions for startup communities.
      </footer>
    </div>
  );
}
