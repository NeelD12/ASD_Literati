import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Eye, MessageSquare, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Post, Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Dashboard | ASD Literati" },
    { name: "description", content: "Manage your ASD Literati posts and comments." },
    { property: "og:title", content: "Dashboard | ASD Literati" },
    { property: "og:description", content: "Manage your ASD Literati posts and comments." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const { userId, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!userId) { navigate({ to: "/auth" }); return; }
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("posts").select("*, comment_count:comments(count)").eq("author_id", userId).order("created_at", { ascending: false }),
        supabase.from("comments").select("*, post:posts(id,title)").eq("author_id", userId).order("created_at", { ascending: false }).limit(50),
      ]);
      setPosts((p ?? []).map((x: any) => ({ ...x, comment_count: x.comment_count?.[0]?.count ?? 0 })) as Post[]);
      setComments((c ?? []) as Comment[]);
    })();
  }, [userId, loading, navigate]);

  const isPoster = profile?.role === "poster" || profile?.role === "admin";

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Deleted");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {profile?.username}. Role:{" "}
            <Badge variant="secondary">{profile?.role}</Badge>
          </p>
        </div>
        {isPoster ? (
          <Button asChild size="lg"><Link to="/create"><PenLine className="mr-1.5 h-4 w-4" /> New post</Link></Button>
        ) : null}
      </div>

      <Tabs defaultValue={isPoster ? "posts" : "comments"}>
        <TabsList>
          {isPoster ? <TabsTrigger value="posts">My posts</TabsTrigger> : null}
          <TabsTrigger value="comments">My comments</TabsTrigger>
        </TabsList>

        {isPoster ? (
          <TabsContent value="posts" className="mt-4">
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't published anything yet.</p>
            ) : (
              <div className="space-y-3">
                {posts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4">
                    <div className="min-w-0">
                      <Link to="/posts/$id" params={{ id: p.id }} className="font-serif text-lg font-semibold hover:text-primary">
                        {p.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{format(new Date(p.created_at), "MMM d, yyyy")}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.view_count ?? 0} views</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {p.comment_count ?? 0} comments</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/edit/$id" params={{ id: p.id }}><PenLine className="h-3 w-3" /></Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePost(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ) : null}

        <TabsContent value="comments" className="mt-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c: any) => (
                <div key={c.id} className="rounded-lg border bg-card p-4">
                  <div className="mb-1 text-xs text-muted-foreground">
                    On{" "}
                    {c.post ? (
                      <Link to="/posts/$id" params={{ id: c.post.id }} className="font-medium text-foreground hover:text-primary">
                        {c.post.title}
                      </Link>
                    ) : "a post"}{" "}
                    · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </div>
                  <p className="text-sm">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
