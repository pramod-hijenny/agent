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
    <div className="w-full space-y-5">
      <section className="app-hero relative overflow-hidden rounded-[1.45rem] p-5 text-white shadow-[0_24px_70px_oklch(0.18_0.035_80_/_0.28)] md:p-6">
        <img
          src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 grayscale"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="honeycomb-bg absolute inset-0 opacity-10 mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgb(0_0_0_/_0.92),rgb(0_0_0_/_0.72)_56%,rgb(247_184_1_/_0.32))]" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f7b801]/35 bg-[#f7b801]/15 px-3 py-1.5 text-xs font-black text-[#ffd766] backdrop-blur">
            <SettingsIcon className="h-4 w-4" /> Control center
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Settings</h1>
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
                <label className="text-sm font-black text-black">Who can discover me?</label>
                <Select value={discoverable} onValueChange={setDiscoverable}>
                  <SelectTrigger className="app-field mt-2 rounded-[1rem] border-0 font-bold shadow-none">
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
          <div className="app-hero rounded-[1.25rem] p-4 text-white shadow-[0_16px_38px_rgb(0_0_0_/_0.16)]">
            <Lock className="h-6 w-6 text-[#f7b801]" />
            <h2 className="mt-3 text-xl font-black">Consent-first</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/65">
              Sensitive actions stay off unless you explicitly allow them.
            </p>
          </div>
          <Panel title="Account" icon={SettingsIcon}>
            <p className="text-sm font-semibold leading-6 text-[var(--app-muted)]">
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
    <div className="app-card rounded-[1.25rem] p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-black text-[#f7b801]">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-black text-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}
