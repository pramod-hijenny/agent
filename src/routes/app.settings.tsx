import { useUser, updatePermissions } from "@/lib/store";
import { PermissionToggle } from "@/components/PermissionToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Lock, Settings as SettingsIcon, ShieldCheck, Sparkles } from "lucide-react";

export function Settings() {
  const user = useUser();
  const [discoverable, setDiscoverable] = useState("everyone");
  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="relative overflow-hidden rounded-[1.35rem] bg-black p-4 text-white shadow-[0_16px_44px_rgb(15_23_42_/_0.18)] md:p-5">
        <img
          src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <SettingsIcon className="h-4 w-4" /> Control center
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
            Tune privacy, agent autonomy, and account boundaries without losing the social feel.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Panel title="Privacy" icon={ShieldCheck}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-black">Who can discover me?</label>
                <Select value={discoverable} onValueChange={setDiscoverable}>
                  <SelectTrigger className="mt-2 rounded-2xl border-0 bg-slate-100 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Members of my community</SelectItem>
                    <SelectItem value="city">Community members in my city</SelectItem>
                    <SelectItem value="verified">Verified community members only</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <PermissionToggle
                label="Allow agents to contact my agent"
                checked={user.permissions.can_talk_to_agents}
                onCheckedChange={(v) => updatePermissions((p) => ({ ...p, can_talk_to_agents: v }))}
              />
              <PermissionToggle
                label="Require approval before agent conversations"
                checked={!user.permissions.can_send_without_approval}
                onCheckedChange={(v) =>
                  updatePermissions((p) => ({ ...p, can_send_without_approval: !v }))
                }
              />
            </div>
          </Panel>

          <Panel title="Agent permissions" icon={Sparkles}>
            <div className="space-y-2">
              <PermissionToggle
                label="Recommend people"
                checked={user.permissions.can_recommend_people}
                onCheckedChange={(v) =>
                  updatePermissions((p) => ({ ...p, can_recommend_people: v }))
                }
              />
              <PermissionToggle
                label="Draft intro messages"
                checked={user.permissions.can_draft_messages}
                onCheckedChange={(v) => updatePermissions((p) => ({ ...p, can_draft_messages: v }))}
              />
              <PermissionToggle
                sensitive
                label="Share my phone number"
                checked={user.permissions.can_share_phone}
                onCheckedChange={(v) => updatePermissions((p) => ({ ...p, can_share_phone: v }))}
              />
              <PermissionToggle
                sensitive
                label="Share my email"
                checked={user.permissions.can_share_email}
                onCheckedChange={(v) => updatePermissions((p) => ({ ...p, can_share_email: v }))}
              />
              <PermissionToggle
                sensitive
                label="Schedule meetings"
                checked={user.permissions.can_schedule_meetings}
                onCheckedChange={(v) =>
                  updatePermissions((p) => ({ ...p, can_schedule_meetings: v }))
                }
              />
              <PermissionToggle
                locked
                label="Discuss private address"
                description="Always off."
                checked={false}
              />
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.25rem] bg-black p-4 text-white shadow-[0_16px_38px_rgb(0_0_0_/_0.16)]">
            <Lock className="h-6 w-6" />
            <h2 className="mt-3 text-xl font-bold">Consent-first</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/65">
              Sensitive actions stay off unless you explicitly allow them.
            </p>
          </div>
          <Panel title="Account" icon={SettingsIcon}>
            <p className="text-sm font-semibold leading-6 text-slate-500">
              Demo account. Backend persistence is optional in this local build.
            </p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] bg-white/90 p-4 shadow-[0_14px_36px_rgb(30_41_59_/_0.08)] backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-bold text-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}
