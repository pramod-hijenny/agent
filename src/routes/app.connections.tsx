import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIntros, useUser } from "@/lib/store";
import { SEED_PROFILES, getSeedProfile } from "@/lib/mock-data";
import { GradientAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import {
  BadgeCheck,
  Bookmark,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

export function Connections() {
  const user = useUser();
  const intros = useIntros();
  if (!user) return null;

  const pending = intros.filter((i) => i.status === "pending");
  const accepted = intros.filter((i) => i.status === "accepted");
  const rejected = intros.filter((i) => i.status === "rejected");
  const withdrawn = intros.filter((i) => i.status === "withdrawn");

  return (
    <div className="w-full space-y-4">
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
  return <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">{children}</div>;
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
  const cover = getConnectionCover(p.id);
  const score = getConnectionScore(p.id);
  const shared = p.interests.slice(0, 2);

  return (
    <article className="group flex min-h-[142px] overflow-hidden rounded-[1.1rem] border border-white/80 bg-white shadow-[0_10px_28px_rgb(35_58_104_/_0.1)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgb(35_58_104_/_0.16)]">
      <div className="relative w-[112px] shrink-0 overflow-hidden bg-slate-900 sm:w-[128px]">
        <img
          src={cover}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${p.avatar_color} opacity-35`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-white/5" />
        <div className="absolute left-2 top-2">
          <span className="rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
            {score}% match
          </span>
        </div>
        <button className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/18 text-white backdrop-blur-md transition hover:bg-white hover:text-black">
          <Bookmark className="h-3.5 w-3.5" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white p-1 shadow-[0_10px_20px_rgb(15_23_42_/_0.2)]">
          <GradientAvatar
            name={p.full_name}
            colorClass={p.avatar_color}
            size="lg"
            className="h-12 w-12 text-sm"
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-bold tracking-tight text-slate-950">
                {p.full_name}
              </h3>
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#4aa3ff]" />
            </div>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {p.role} · {p.company}
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="h-8 rounded-full bg-black px-4 text-xs font-semibold"
          >
            <Link to="/app/profile/$id" params={{ id: p.id }}>
              View
            </Link>
          </Button>
        </div>

        <p className="mt-2 line-clamp-1 text-xs font-medium leading-5 text-slate-600">
          {p.current_ask}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
            {p.stage}
          </span>
          {shared.map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-[11px] font-semibold text-slate-500">
              <MapPin className="h-3 w-3" /> {p.city}
            </p>
            <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-semibold text-[#8a650f]">
              {agent ? <Sparkles className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
              {note}
            </p>
          </div>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="h-8 rounded-full bg-slate-100 px-3 text-xs font-semibold"
          >
            <Link to="/app/discover">
              <MessageCircle className="h-3.5 w-3.5" /> Intro
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

const CONNECTION_COVERS = [
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=85",
];

function getConnectionCover(id: string) {
  const index = Math.abs([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return CONNECTION_COVERS[index % CONNECTION_COVERS.length];
}

function getConnectionScore(id: string) {
  const index = Math.abs([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return 86 + (index % 13);
}
