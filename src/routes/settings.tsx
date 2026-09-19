import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Key } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { GRADES, SECTIONS, type Grade, type Section } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Settings | ASD Literati" },
    { name: "description", content: "Manage your ASD Literati profile and access." },
    { property: "og:title", content: "Settings | ASD Literati" },
    { property: "og:description", content: "Manage your ASD Literati profile and access." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Settings,
});

function Settings() {
  const { userId, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [grade, setGrade] = useState<Grade>("9");
  const [section, setSection] = useState<Section>("A");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!userId) navigate({ to: "/auth" });
    if (profile) {
      setUsername(profile.username);
      setGrade(profile.grade);
      setSection(profile.section);
    }
  }, [userId, profile, loading, navigate]);

  async function saveProfile() {
    if (!userId) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim(), grade, section })
      .eq("id", userId);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile saved");
      refreshProfile();
    }
  }

  async function redeem() {
    if (!key.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_unlock_key", { _key: key.trim() });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as unknown as { ok: boolean; message?: string };
    if (result.ok) {
      toast.success(result.message ?? "Account updated");
      setKey("");
      refreshProfile();
    } else {
      toast.error(result.message ?? "Invalid key");
    }
  }

  if (!profile) return <main className="mx-auto max-w-2xl px-4 py-12 text-muted-foreground">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="font-medium">{profile.email}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Role</div>
              <Badge variant="secondary">{profile.role}</Badge>
            </div>
            <div>
              <div className="text-muted-foreground">Joined</div>
              <div className="font-medium">{format(new Date(profile.created_at), "MMM d, yyyy")}</div>
            </div>
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label>Section</Label>
            <Select value={section} onValueChange={(v) => setSection(v as Section)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Grade level</Label>
            <Select value={grade} onValueChange={(v) => setGrade(v as Grade)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={busy}>Save profile</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-4 w-4" /> Unlock key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter an unlock key to upgrade to a Poster account, or to downgrade back to a Default account.
          </p>
          <div className="flex gap-2">
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Enter unlock key" />
            <Button onClick={redeem} disabled={busy || !key.trim()}>Redeem</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
