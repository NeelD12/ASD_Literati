import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, PenLine, School, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import asdLogo from "@/assets/asd-logo.png";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ASD Literati BLOG | School Literary Blog" },
      {
        name: "description",
        content: "Read essays, stories, and ideas from ASD Literati's student writers.",
      },
      { property: "og:title", content: "ASD Literati BLOG | School Literary Blog" },
      {
        property: "og:description",
        content: "Read essays, stories, and ideas from ASD Literati's student writers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const { userId, loading, profile } = useAuth();
  const canPost = profile?.role === "poster" || profile?.role === "admin";
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState("");
  const [author, setAuthor] = useState("");
  const [fetching, setFetching] = useState(false);

  const loadPosts = useCallback(async () => {
    setFetching(true);
    const { data } = await supabase
      .from("posts")
      .select(
        `*, author:profiles!posts_author_id_fkey(id,full_name),
         view_perms:post_view_permissions(grade,section),
         comment_count:comments(count)`,
      )
      .order("created_at", { ascending: false })
      .limit(50);
    const list = (data ?? []).map((p: any) => ({
      ...p,
      view_grades: [...new Set((p.view_perms ?? []).map((v: any) => v.grade))],
      view_sections: [...new Set((p.view_perms ?? []).map((v: any) => v.section))],
      comment_count: p.comment_count?.[0]?.count ?? 0,
    })) as Post[];
    setPosts(list);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!userId) return;
    loadPosts();
    const channel = supabase
      .channel("posts-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadPosts())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loading, loadPosts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (author && !p.author?.full_name?.toLowerCase().includes(author.toLowerCase()))
        return false;
      return true;
    });
  }, [posts, query, author]);

  // Logged-out visitors get a distinct landing page — not the signed-in
  // feed. Loading is treated the same as logged-out here to avoid a flash
  // of the feed shell before auth resolves.
  if (!userId) {
    if (loading) return null;
    return (
      <main className="relative">
        {/* Layered glow backdrop: sky-blue base with soft gold and green
            accent blobs, echoing the school's own palette — not a flat tint. */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
          <div className="absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-primary/15 blur-[110px] dark:bg-primary/10" />
          <div className="absolute -top-24 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-highlight/60 blur-[110px] dark:bg-highlight/20" />
          <div className="absolute bottom-[-14rem] left-1/4 h-[32rem] w-[32rem] rounded-full bg-accent/50 blur-[120px] dark:bg-accent/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background/80 dark:via-background/30 dark:to-background/70" />
        </div>
        <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <img src={asdLogo} alt="Ambassador School Dubai" className="h-24 w-24 drop-shadow-md" />
          <p className="eyebrow mt-6">Volume I</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            ASD Literati
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Empowering student voices to write, share, and be heard — grades 1–12.
          </p>

          <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
            {[
              {
                role: "student" as const,
                icon: GraduationCap,
                title: "Student",
                desc: "Read posts shared with your grade and join the discussion.",
              },
              {
                role: "teacher" as const,
                icon: School,
                title: "Teacher",
                desc: "Publish posts and control who can read and comment.",
              },
            ].map(({ role, icon: Icon, title, desc }) => (
              <Link
                key={role}
                to="/auth"
                search={{ role }}
                className="group flex flex-col items-start rounded-xl border bg-card/95 p-6 text-left shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <span className="mt-4 font-serif text-xl font-semibold">{title}</span>
                <span className="mt-1 text-sm text-muted-foreground">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <p className="eyebrow">Volume I</p>
        <h1 className="mt-1.5 font-serif text-2xl font-semibold sm:text-3xl">
          Latest from your classmates
        </h1>
      </div>

      <>
        {canPost ? (
          <div className="mb-12 flex flex-col gap-5 border-y bg-card/60 px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">For contributors</p>
              <h2 className="mt-1.5 font-serif text-2xl font-semibold">Ready to publish?</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Rich text editor, file attachments, per-grade read and comment access, and a comment
                time gap — all in one place.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 shrink-0 gap-2 rounded-full px-7 text-base shadow-md transition-transform hover:scale-[1.02]"
            >
              <Link to="/create">
                <PenLine className="h-4 w-4" />
                New post
              </Link>
            </Button>
          </div>
        ) : null}

        <div className="mb-10 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pieces by title…"
              className="h-12 rounded-full bg-card pl-10 text-base shadow-sm"
            />
          </div>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Filter by author"
            className="h-12 rounded-full bg-card text-base shadow-sm sm:max-w-xs"
          />
        </div>

        {fetching ? (
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-4 bg-background p-6">
                <div className="h-3 w-32 bg-muted" />
                <div className="h-6 w-3/4 bg-muted" />
                <div className="h-3 w-full bg-muted" />
                <div className="h-3 w-2/3 bg-muted" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border p-16 text-center">
            <p className="font-serif text-2xl">No pieces to show yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              When writers in your grade publish, you'll see them here.
            </p>
          </div>
        ) : (
          <div className="grid gap-px border bg-border sm:grid-cols-2">
            {filtered.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </>
    </main>
  );
}
