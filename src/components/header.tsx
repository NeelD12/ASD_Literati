import { useEffect, useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Bell, Moon, PenLine, Sun, User2, LogOut, LayoutDashboard, Settings, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import asdLogo from "@/assets/asd-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  created_at: string;
  read: boolean;
}

function NotificationBell() {
  const { userId } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const navigate = useNavigate();
  const router = useRouter();

  async function load() {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,link,created_at,read")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as AppNotification[]) ?? []);
  }

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    load();
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unread = items.filter((n) => !n.read).length;

  async function open(n: AppNotification) {
    if (!n.read) await supabase.rpc("mark_notification_read", { _id: n.id });
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.link) router.history.push(n.link);
  }

  async function markAll() {
    await supabase.rpc("mark_all_notifications_read");
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 ? (
            <button
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
              onClick={markAll}
            >
              <CheckCheck className="mr-1 inline h-3 w-3" />
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`block w-full rounded-sm px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                  n.read ? "" : "bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                  <div className="min-w-0">
                    <div className={`truncate text-sm ${n.read ? "text-muted-foreground" : "font-medium"}`}>
                      {n.title}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { profile, userId, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
          <img src={asdLogo} alt="ASD school logo" className="h-9 w-9 shrink-0 rounded-full object-contain sm:h-11 sm:w-11" />
          <span className="truncate font-serif text-xl font-semibold sm:text-3xl">
            ASD <span className="italic">Literati</span>{" "}
            <span className="font-sans text-xs font-bold tracking-[0.2em] text-primary align-middle sm:text-sm">BLOG</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {profile?.role === "poster" || profile?.role === "admin" ? (
            <Button asChild size="sm" className="gap-1.5 shadow-sm">
              <Link to="/create">
                <PenLine className="h-4 w-4" />
                <span className="hidden sm:inline">New post</span>
              </Link>
            </Button>
          ) : null}


          {profile?.is_teacher ? <NotificationBell /> : null}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>

          {userId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User2 className="h-4 w-4" />
                  <span className="hidden max-w-[120px] truncate sm:inline">
                    {profile?.full_name ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">{profile?.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {profile?.role}
                    {profile?.is_teacher
                      ? " · Teacher"
                      : ` · Grade ${profile?.grade} · Section ${profile?.section}`}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="px-5">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
