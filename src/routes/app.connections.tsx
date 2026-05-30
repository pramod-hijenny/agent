import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIntros, useUser } from "@/lib/store";
import { SEED_PROFILES, getSeedProfile } from "@/lib/mock-data";
import { GradientAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import { AiBadge } from "@/components/AiBadge";

export function Connections() {
  const user = useUser();
  const intros = useIntros();
  if (!user) return null;

  const pending = intros.filter((i) => i.status === "pending");
  const accepted = intros.filter((i) => i.status === "accepted");
  const rejected = intros.filter((i) => i.status === "rejected");
  const withdrawn = intros.filter((i) => i.status === "withdrawn");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>

      <Tabs defaultValue="recommended">
        <TabsList className="rounded-xl">
          <TabsTrigger value="human">Accepted</TabsTrigger>
          <TabsTrigger value="recommended">Agent-recommended</TabsTrigger>
          <TabsTrigger value="pending">Pending intros</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="human" className="mt-4">
          {accepted.length === 0 ? (
            <Empty label="No human connections yet — approve an intro to get started." />
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
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}
function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
function ConnRow({ otherId, note, agent }: { otherId: string; note: string; agent?: boolean }) {
  const p = getSeedProfile(otherId);
  if (!p) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <GradientAvatar name={p.full_name} colorClass={p.avatar_color} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{p.full_name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {p.role} · {p.company}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {agent && <AiBadge label="Agent note" />}
          <span>{note}</span>
        </div>
      </div>
      <Button asChild size="sm" variant="outline" className="rounded-xl">
        <Link to="/app/profile/$id" params={{ id: p.id }}>
          View
        </Link>
      </Button>
    </div>
  );
}
