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

export function Settings() {
  const user = useUser();
  const [discoverable, setDiscoverable] = useState("everyone");
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Panel title="Privacy">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Who can discover me?</label>
            <Select value={discoverable} onValueChange={setDiscoverable}>
              <SelectTrigger className="mt-1 rounded-xl">
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

      <Panel title="Agent permissions">
        <div className="space-y-2">
          <PermissionToggle
            label="Recommend people"
            checked={user.permissions.can_recommend_people}
            onCheckedChange={(v) => updatePermissions((p) => ({ ...p, can_recommend_people: v }))}
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
            onCheckedChange={(v) => updatePermissions((p) => ({ ...p, can_schedule_meetings: v }))}
          />
          <PermissionToggle
            locked
            label="Discuss private address"
            description="Always off."
            checked={false}
          />
        </div>
      </Panel>

      <Panel title="Account">
        <p className="text-sm text-muted-foreground">
          Demo account — backend persistence is not connected.
        </p>
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </div>
  );
}
