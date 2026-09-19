import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Eye, EyeOff, GraduationCap, School } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { GRADES, SECTIONS, type Grade, type Section } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Sign In | ASD Literati" },
    { name: "description", content: "Sign in or create an ASD Literati student or teacher account." },
    { property: "og:title", content: "Sign In | ASD Literati" },
    { property: "og:description", content: "Sign in or create an ASD Literati student or teacher account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

// Username-only auth uses a synthetic, non-deliverable email under .local
// so Supabase Auth (which requires an email) still works.
export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@scholarly.local`;
}

type AccountType = "student" | "teacher";

/** Access code required to create a teacher/admin account. */
const TEACHER_ACCESS_ID = "asdxbTeacher@2026!";

function AuthPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  useEffect(() => {
    if (userId) navigate({ to: "/" });
  }, [userId, navigate]);

  if (!accountType) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col px-4 py-16">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Welcome to ASD Literati</h1>
        <p className="mt-2 text-muted-foreground">Who are you signing in as?</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {([
            {
              type: "student" as AccountType,
              icon: GraduationCap,
              title: "Student",
              desc: "Read posts shared with your grade and join the discussion.",
            },
            {
              type: "teacher" as AccountType,
              icon: School,
              title: "Teacher",
              desc: "Publish posts, attach PDFs, and control who can read and comment.",
            },
          ]).map(({ type, icon: Icon, title, desc }) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className="group flex flex-col items-start rounded-xl border bg-card p-6 text-left transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="h-8 w-8 text-primary" />
              <span className="mt-4 font-serif text-xl font-semibold">{title}</span>
              <span className="mt-1 text-sm text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 self-start"
        onClick={() => setAccountType(null)}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            {accountType === "teacher" ? "Teacher access" : "Student access"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignIn /></TabsContent>
            <TabsContent value="signup"><SignUp accountType={accountType} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

/** Password field with a show/hide toggle. */
function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}


function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setBusy(false);
    if (error) toast.error("Invalid username or password");
    else toast.success("Signed in");
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
        <p className="mt-1 text-xs text-muted-foreground">Passwords are case-sensitive.</p>
      </div>


      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function SignUp({ accountType }: { accountType: AccountType }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<Grade>(accountType === "teacher" ? "12" : "9");
  const [section, setSection] = useState<Section>("A");
  const [teacherId, setTeacherId] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) return toast.error("Username must be 3+ characters");
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) return toast.error("Letters, numbers, and underscores only");
    if (password.length < 6) return toast.error("Password must be 6+ characters");
    if (accountType === "teacher" && teacherId !== TEACHER_ACCESS_ID)
      return toast.error("Incorrect teacher ID");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(cleanUsername),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username: cleanUsername, grade, section },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created — you're signed in.");
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <Label htmlFor="su-username">Username</Label>
        <Input id="su-username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <p className="mt-1 text-xs text-muted-foreground">3+ characters, letters/numbers/underscore.</p>
      </div>
      <div>
        <Label htmlFor="su-password">Password</Label>
        <PasswordInput
          id="su-password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={setPassword}
        />

        <p className="mt-1 text-xs text-muted-foreground">
          6+ characters. Any characters allowed — passwords are case-sensitive.
        </p>
      </div>

      {accountType === "student" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Grade level</Label>
            <Select value={grade} onValueChange={(v) => setGrade(v as Grade)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
              </SelectContent>
            </Select>
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
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor="su-teacher-id">Teacher ID</Label>
            <PasswordInput
              id="su-teacher-id"
              autoComplete="off"
              value={teacherId}
              onChange={setTeacherId}
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Required to create a teacher account.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Teachers get posting access by redeeming an unlock key in Settings after signing up.
          </p>
        </>
      )}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
