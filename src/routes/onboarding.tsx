import { useNavigate } from "@/lib/navigation";
import { useState } from "react";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import { InterestChips } from "@/components/InterestChips";
import { PermissionToggle } from "@/components/PermissionToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ALL_INTERESTS, ALL_SKILLS, DEFAULT_PERMISSIONS, GOAL_LABELS } from "@/lib/types";
import type { AgentTone, Goal, Profile } from "@/lib/types";
import { getAuth, setUser } from "@/lib/store";
import { DEMO_COMMUNITY } from "@/lib/mock-data";
import { hasApi, submitOnboarding } from "@/lib/api";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

const TONES: AgentTone[] = ["Friendly", "Professional", "Direct", "Warm", "Curious"];
const GOAL_KEYS = Object.keys(GOAL_LABELS) as Goal[];
const PALETTES = [
  "from-primary to-agent",
  "from-sky-400 to-indigo-400",
  "from-emerald-400 to-teal-400",
  "from-rose-400 to-pink-400",
  "from-amber-400 to-orange-400",
];

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [full_name, setName] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<Profile["role"]>("Founder");
  const [stage, setStage] = useState("Pre-seed");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [currentAsk, setCurrentAsk] = useState("");
  const [offering, setOffering] = useState("");
  const [availability, setAvailability] = useState("");
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [topics_enjoy, setEnjoy] = useState("");
  const [topics_avoid, setAvoid] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [agent_name, setAgentName] = useState("");
  const [tone, setTone] = useState<AgentTone>("Friendly");
  const [perms, setPerms] = useState(DEFAULT_PERMISSIONS);

  const toggleInterest = (i: string) =>
    setInterests((arr) => (arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]));
  const toggleGoal = (g: Goal) =>
    setGoals((arr) => (arr.includes(g) ? arr.filter((x) => x !== g) : [...arr, g]));
  const toggleSkill = (skill: string) =>
    setSkills((arr) => (arr.includes(skill) ? arr.filter((x) => x !== skill) : [...arr, skill]));

  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  async function finish() {
    const profile: Profile = {
      id: "me",
      community_id: DEMO_COMMUNITY.id,
      full_name: full_name || "You",
      city: city || "San Francisco",
      profession: profession || "Founder",
      company,
      role,
      stage,
      bio: bio || "Building inside SF Builders Circle.",
      avatar_color: PALETTES[Math.floor(Math.random() * PALETTES.length)],
      interests: interests.length ? interests : ["AI", "Startups", "Product strategy"],
      skills: skills.length ? skills : ["Product", "Customer discovery"],
      goals: goals.length ? goals : ["feedback", "customers"],
      current_ask:
        currentAsk || "Find three useful people who can give feedback on my current startup idea.",
      offering: offering || "Can share product feedback and early-stage founder notes.",
      availability: availability || "Two short calls per week",
      likes,
      dislikes,
      topics_enjoy,
      topics_avoid,
      agent: {
        agent_name: agent_name || `${(full_name || "Your").split(" ")[0]} Agent`,
        tone,
        agent_intro: agentPreview(full_name, tone, interests),
        current_mission: "Find three useful people inside SF Builders Circle",
        status: "active",
        memory: buildMemory(likes, interests, goals),
      },
      permissions: perms,
    };
    const auth = getAuth();
    if (hasApi() && auth?.token) {
      try {
        const saved = await submitOnboarding(auth.token, profile);
        setUser(saved);
        navigate({ to: "/app/home" });
        return;
      } catch {
        // Keep local demo mode usable even if the API is not running.
      }
    }
    setUser(profile);
    navigate({ to: "/app/home" });
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-hero)" }}>
      <div
        className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 md:p-8"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-agent" /> Step {step + 1} of 6
        </div>
        <div className="mt-3">
          <OnboardingStepper step={step} total={6} />
        </div>

        <div className="mt-6 min-h-[340px]">
          {step === 0 && (
            <Step
              title="Join the demo community"
              subtitle="The MVP starts inside one trusted startup network."
            >
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-semibold text-foreground">{DEMO_COMMUNITY.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{DEMO_COMMUNITY.description}</p>
              </div>
              <Field label="Full name">
                <Input
                  value={full_name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                  placeholder="Alex Carter"
                />
              </Field>
              <Field label="Profile photo">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground">
                    Photo
                  </div>
                  <Button variant="outline" type="button" className="rounded-xl">
                    Upload (placeholder)
                  </Button>
                </div>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="City">
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-xl"
                    placeholder="San Francisco"
                  />
                </Field>
                <Field label="Profession / title">
                  <Input
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="rounded-xl"
                    placeholder="Product Designer"
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Startup role">
                  <Select value={role} onValueChange={(v) => setRole(v as Profile["role"])}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Founder", "Builder", "Operator", "Investor", "Mentor", "Advisor"].map(
                        (value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Stage">
                  <Input
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="rounded-xl"
                    placeholder="Pre-seed"
                  />
                </Field>
              </div>
              <Field label="Company or school">
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="rounded-xl"
                />
              </Field>
              <Field label="Short bio">
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="rounded-xl"
                  rows={3}
                  placeholder="What you're building, exploring, or helping with right now."
                />
              </Field>
            </Step>
          )}

          {step === 1 && (
            <Step
              title="Skills and context"
              subtitle="Help the community understand what you know and what you care about."
            >
              <p className="text-sm font-medium text-foreground">Skills</p>
              <InterestChips items={ALL_SKILLS} selected={skills} onToggle={toggleSkill} />
              <p className="pt-2 text-sm font-medium text-foreground">Interests</p>
              <InterestChips items={ALL_INTERESTS} selected={interests} onToggle={toggleInterest} />
              <div className="flex gap-2">
                <Input
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  className="rounded-xl"
                  placeholder="Add custom interest"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    if (customInterest.trim()) {
                      setInterests((a) => [...a, customInterest.trim()]);
                      setCustomInterest("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="Your networking ask" subtitle="Make matching specific and useful.">
              <Field label="Current ask">
                <Textarea
                  value={currentAsk}
                  onChange={(e) => setCurrentAsk(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                  placeholder="Find AI founders who can give feedback on my onboarding flow."
                />
              </Field>
              <Field label="What I can help with">
                <Textarea
                  value={offering}
                  onChange={(e) => setOffering(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                  placeholder="I can help with product strategy, AI UX, and customer discovery."
                />
              </Field>
              <Field label="Availability">
                <Input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="rounded-xl"
                  placeholder="Two 30-minute calls per week"
                />
              </Field>
              <Field label="Signals I like in an intro">
                <Textarea
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                />
              </Field>
              <Field label="Signals I want to avoid">
                <Textarea
                  value={dislikes}
                  onChange={(e) => setDislikes(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                />
              </Field>
              <Field label="Topics I enjoy">
                <Textarea
                  value={topics_enjoy}
                  onChange={(e) => setEnjoy(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                />
              </Field>
              <Field label="Topics I avoid">
                <Textarea
                  value={topics_avoid}
                  onChange={(e) => setAvoid(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                />
              </Field>
            </Step>
          )}

          {step === 3 && (
            <Step
              title="What are you looking for?"
              subtitle="Pick the outcomes your agent should optimize for."
            >
              <div className="grid gap-2 md:grid-cols-2">
                {GOAL_KEYS.map((g) => (
                  <label
                    key={g}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm"
                  >
                    <Checkbox checked={goals.includes(g)} onCheckedChange={() => toggleGoal(g)} />
                    {GOAL_LABELS[g]}
                  </label>
                ))}
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step
              title="Design your agent"
              subtitle="This is who represents you in intro workflows."
            >
              <Field label="Agent name">
                <Input
                  value={agent_name}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="rounded-xl"
                  placeholder={`${(full_name || "Your").split(" ")[0]} Agent`}
                />
              </Field>
              <Field label="Tone">
                <Select value={tone} onValueChange={(v) => setTone(v as AgentTone)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="rounded-2xl border border-agent/20 bg-agent-soft/40 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-agent">
                  Agent intro preview
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {agentPreview(full_name, tone, interests)}
                </p>
              </div>
              <Button type="button" variant="outline" className="rounded-xl">
                <Sparkles className="h-4 w-4" /> Generate My Agent
              </Button>
            </Step>
          )}

          {step === 5 && (
            <Step
              title="Boundaries & permissions"
              subtitle="You're always in control. Sensitive actions are off by default."
            >
              <div className="space-y-2">
                <PermissionToggle
                  label="Agent can talk to other agents"
                  checked={perms.can_talk_to_agents}
                  onCheckedChange={(v) => setPerms((p) => ({ ...p, can_talk_to_agents: v }))}
                />
                <PermissionToggle
                  label="Agent can recommend people"
                  checked={perms.can_recommend_people}
                  onCheckedChange={(v) => setPerms((p) => ({ ...p, can_recommend_people: v }))}
                />
                <PermissionToggle
                  label="Agent can draft intro messages"
                  checked={perms.can_draft_messages}
                  onCheckedChange={(v) => setPerms((p) => ({ ...p, can_draft_messages: v }))}
                />
                <PermissionToggle
                  sensitive
                  label="Agent can send messages without approval"
                  description="Default off — we strongly recommend keeping this off."
                  checked={perms.can_send_without_approval}
                  onCheckedChange={(v) => setPerms((p) => ({ ...p, can_send_without_approval: v }))}
                />
                <PermissionToggle
                  sensitive
                  label="Agent can share my phone number"
                  checked={perms.can_share_phone}
                  onCheckedChange={(v) => setPerms((p) => ({ ...p, can_share_phone: v }))}
                />
                <PermissionToggle
                  sensitive
                  label="Agent can share my email"
                  checked={perms.can_share_email}
                  onCheckedChange={(v) => setPerms((p) => ({ ...p, can_share_email: v }))}
                />
                <PermissionToggle
                  sensitive
                  label="Agent can schedule meetings"
                  checked={perms.can_schedule_meetings}
                  onCheckedChange={(v) => setPerms((p) => ({ ...p, can_schedule_meetings: v }))}
                />
                <PermissionToggle
                  sensitive
                  label="Agent can discuss salary or finances"
                  checked={perms.can_discuss_finances}
                  onCheckedChange={(v) => setPerms((p) => ({ ...p, can_discuss_finances: v }))}
                />
                <PermissionToggle
                  locked
                  label="Agent can discuss private address"
                  description="Always off. We never let your agent share this."
                  checked={false}
                />
              </div>
              <SafetyNotice>
                Your agent will always be labeled as AI and will never pretend to be you.
              </SafetyNotice>
            </Step>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 5 ? (
            <Button onClick={next} className="rounded-xl">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} className="rounded-xl">
              Enter AgentCircle <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function agentPreview(name: string, tone: AgentTone, interests: string[]) {
  const n = (name || "this person").split(" ")[0];
  const i = interests.slice(0, 3).join(", ").toLowerCase() || "startup conversations";
  return `Hi, I'm an AI networking agent representing ${n}. I'm ${tone.toLowerCase()} and can compare fit around ${i}. I'll only share what ${n} approves.`;
}

function buildMemory(likes: string, interests: string[], goals: Goal[]): string[] {
  const arr: string[] = [];
  if (likes) arr.push(likes);
  if (interests.length) arr.push(`Enjoys ${interests.slice(0, 4).join(", ").toLowerCase()}.`);
  if (goals.length)
    arr.push(`Open to ${goals.map((g) => GOAL_LABELS[g].toLowerCase()).join(", ")}.`);
  arr.push("Prefers warm introductions.");
  return arr;
}
