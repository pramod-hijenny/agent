import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIntros, useUser } from "@/lib/store";
import { SEED_PROFILES, getSeedProfile } from "@/lib/mock-data";
import { GradientAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import { AiBadge } from "@/components/AiBadge";
import { BadgeCheck, HeartHandshake, Users, Zap } from "lucide-react";

export function Connections() {
  const user = useUser();
  const intros = useIntros();
  if (!user) return null;

  const pending = intros.filter((i) => i.status === "pending");
  const accepted = intros.filter((i) => i.status === "accepted");
  const rejected = intros.filter((i) => i.status === "rejected");
  const withdrawn = intros.filter((i) => i.status === "withdrawn");

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="relative overflow-hidden rounded-[1.35rem] bg-black p-4 text-white shadow-[0_16px_44px_rgb(15_23_42_/_0.18)] md:p-5">
        <img
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/35" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Users className="h-4 w-4" /> Network graph
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Connections</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
              Track accepted, pending, saved, and agent-recommended relationships in one social
              workspace.
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-white/15 p-4 backdrop-blur-xl">
            <p className="text-xl font-bold">{SEED_PROFILES.length}</p>
            <p className="text-sm font-medium text-white/65">community profiles</p>
          </div>
        </div>
      </section>

      <Tabs defaultValue="recommended">
        <TabsList className="h-auto flex-wrap rounded-full bg-white/80 p-1 shadow-[0_16px_40px_rgb(41_55_92_/_0.1)]">
          <TabsTrigger value="human" className="rounded-full font-semibold">
            Accepted
          </TabsTrigger>
          <TabsTrigger value="recommended" className="rounded-full font-semibold">
            Agent-recommended
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-full font-semibold">
            Pending intros
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-full font-semibold">
            Rejected
          </TabsTrigger>
          <TabsTrigger value="saved" className="rounded-full font-semibold">
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="human" className="mt-4">
          {accepted.length === 0 ? (
            <Empty label="No human connections yet. Approve an intro to get started." />
          ) : (
            <Grid>
              {accepted.map((i) => (
                <ConnRow key={i.id} otherId={i.to_user_id} note="Accepted intro" />
              ))}
            </Grid>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="mt-4">
          <Grid>
            {SEED_PROFILES.map((p) => (
              <ConnRow key={p.id} otherId={p.id} note="Recommended by your agent" agent />
            ))}
          </Grid>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <Empty label="No pending intros." />
          ) : (
            <Grid>
              {pending.map((i) => (
                <ConnRow key={i.id} otherId={i.to_user_id} note="Waiting for the other side" />
              ))}
            </Grid>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejected.length + withdrawn.length === 0 ? (
            <Empty label="No rejected matches." />
          ) : (
            <Grid>
              {[...rejected, ...withdrawn].map((i) => (
                <ConnRow key={i.id} otherId={i.to_user_id} note="Rejected" />
              ))}
            </Grid>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <Empty label="Save community members from Discover to find them later." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-[0_14px_36px_rgb(41_55_92_/_0.1)] backdrop-blur-xl">
      <HeartHandshake className="mx-auto h-10 w-10 text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function ConnRow({ otherId, note, agent }: { otherId: string; note: string; agent?: boolean }) {
  const p = getSeedProfile(otherId);
  if (!p) return null;
  return (
    <div className="group overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_36px_rgb(30_41_59_/_0.08)] transition hover:-translate-y-0.5">
      <div className={`h-2.5 bg-gradient-to-r ${p.avatar_color}`} />
      <div className="flex items-center gap-3 p-4">
        <GradientAvatar name={p.full_name} colorClass={p.avatar_color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-black">{p.full_name}</p>
            <BadgeCheck className="h-4 w-4 text-[#4aa3ff]" />
          </div>
          <p className="truncate text-xs font-medium text-slate-400">
            {p.role} · {p.company}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
            {agent && <AiBadge label="Agent note" />}
            <span className="inline-flex items-center gap-1">
              {agent && <Zap className="h-3.5 w-3.5 fill-[#ffb020] text-[#ffb020]" />}
              {note}
            </span>
          </div>
        </div>
        <Button asChild size="sm" className="rounded-full bg-black font-semibold">
          <Link to="/app/profile/$id" params={{ id: p.id }}>
            View
          </Link>
        </Button>
      </div>
    </div>
  );
}
