import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PenLine, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ASD Literati | Student Literary Review" },
      { name: "description", content: "Read essays, stories, and ideas from ASD Literati's student writers." },
      { property: "og:title", content: "ASD Literati | Student Literary Review" },
      { property: "og:description", content: "Read essays, stories, and ideas from ASD Literati's student writers." },
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

  useEffect(() => {
    if (loading) return;
    if (!userId) return;
    setFetching(true);
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select(
          `*, author:profiles!posts_author_id_fkey(id,username),
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
    })();
  }, [userId, loading]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (author && !p.author?.username?.toLowerCase().includes(author.toLowerCase())) return false;
      return true;
    });
  }, [posts, query, author]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="mb-14 rounded-2xl border bg-background/70 px-5 py-12 text-center shadow-sm backdrop-blur-sm sm:px-10 sm:py-16">
        <p className="eyebrow">Volume I · A Student Literary Review</p>
        <h1 className="mx-auto mt-4 max-w-4xl font-serif text-5xl font-semibold leading-[1.08] sm:text-7xl">
          Stories, essays, and ideas <span className="italic">from your classmates.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          A quiet, focused place for grades 1–12 to write and read. Pieces are scoped by grade,
          so you only see what's meant for you.
        </p>
        {!userId && !loading ? (
          <Button asChild size="lg" className="mt-8 h-16 rounded-full px-12 text-lg shadow-lg sm:px-14">
            <Link to="/auth">Sign in to start reading</Link>
          </Button>
        ) : null}
      </section>

      {userId ? (
        <>
          {canPost ? (
            <div className="mb-12 flex flex-col gap-5 border-y bg-card/60 px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">For contributors</p>
                <h2 className="mt-1.5 font-serif text-2xl font-semibold">Ready to publish?</h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Rich text editor, PDF attachments, per-grade read and comment access, and a
                  comment time gap — all in one place.
                </p>
              </div>
              <Button asChild size="lg" className="h-12 shrink-0 gap-2 rounded-full px-7 text-base shadow-md transition-transform hover:scale-[1.02]">
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
      ) : null}
    </main>
  );
}
