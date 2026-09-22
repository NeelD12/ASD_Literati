import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Eye, MessageSquare, Timer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { formatCooldown, type Attachment, type Post, type Grade, type Section } from "@/lib/types";
import { GradeBadges, SectionBadges } from "@/components/grade-picker";
import { PdfList } from "@/components/pdf-list";
import { Comments } from "@/components/comments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/posts/$id")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Read Post | ASD Literati" },
    { name: "description", content: "Read a student publication on ASD Literati." },
    { property: "og:title", content: "Read Post | ASD Literati" },
    { property: "og:description", content: "Read a student publication on ASD Literati." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const { userId, profile } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [viewGrades, setViewGrades] = useState<Grade[]>([]);
  const [commentGrades, setCommentGrades] = useState<Grade[]>([]);
  const [viewSections, setViewSections] = useState<Section[]>([]);
  const [commentSections, setCommentSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`*, author:profiles!posts_author_id_fkey(id,username)`)
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setDenied(true);
        setLoading(false);
        return;
      }
      setPost(data as unknown as Post);
      supabase.rpc("increment_post_views", { _post: id }).then(() => {});

      const [{ data: v }, { data: c }] = await Promise.all([
        supabase.from("post_view_permissions").select("grade,section").eq("post_id", id),
        supabase.from("post_comment_permissions").select("grade,section").eq("post_id", id),
      ]);
      setViewGrades([...new Set((v ?? []).map((x) => x.grade as Grade))]);
      setCommentGrades([...new Set((c ?? []).map((x) => x.grade as Grade))]);
      setViewSections([...new Set((v ?? []).map((x) => x.section as Section))]);
      setCommentSections([...new Set((c ?? []).map((x) => x.section as Section))]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <main className="mx-auto max-w-3xl animate-pulse px-4 py-16 sm:px-6">
        <div className="h-3 w-24 bg-muted" />
        <div className="mt-6 h-10 w-3/4 bg-muted" />
        <div className="mt-3 h-10 w-1/2 bg-muted" />
        <div className="mt-10 space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-3 w-full bg-muted" />)}
        </div>
      </main>;
  }
  if (denied || !post) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif text-4xl">Post unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          This post may not exist, or it isn't shared with your grade level.
        </p>
        <Button asChild className="mt-6"><Link to="/">Back to feed</Link></Button>
      </main>
    );
  }

  const isAuthor = userId === post.author_id;
  const canComment =
  isAuthor || profile?.role === "admin" || profile?.is_teacher || (!!profile && commentGrades.includes(profile.grade) && commentSections.includes(profile.section));
  const attachments: Attachment[] = Array.isArray(post.attachments) ? post.attachments : [];
  const cooldown = post.comment_cooldown_seconds ?? 0;

  async function remove() {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post!.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Post deleted");
      navigate({ to: "/" });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <article>
        {post.cover_image ? (
          <img src={post.cover_image} alt="" className="mb-10 aspect-[16/8] w-full object-cover" />
        ) : null}

        <header className="mb-10 border-b pb-8 text-center sm:text-left">
          <p className="eyebrow">Essay</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-[1.1] sm:text-6xl">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-between">
            <div>
              By <span className="font-medium text-foreground">{post.author?.username}</span>{" "}
              · {format(new Date(post.created_at), "MMMM d, yyyy")}
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {post.view_count ?? 0}</span>
              {isAuthor ? (
                <>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/edit/$id" params={{ id: post.id }}>
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={remove}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </>
              ) : null}
            </div>
          </div>
          {post.tags?.length ? (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {post.tags.map((t) => <Badge key={t} variant="outline" className="rounded-full font-normal">{t}</Badge>)}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground sm:justify-start">
            <div className="flex flex-wrap items-center gap-1.5">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Readable by:</span>
              <GradeBadges grades={viewGrades} />
              <SectionBadges sections={viewSections} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <MessageSquare className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Comments open to:</span>
              {commentGrades.length ? (
                <>
                  <GradeBadges grades={commentGrades} />
                  <SectionBadges sections={commentSections} />
                </>
              ) : (
                <Badge variant="outline">Comments closed</Badge>
              )}
            </div>
            {cooldown > 0 ? (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Timer className="h-3 w-3" />
                <span>{formatCooldown(cooldown)} between comments</span>
              </div>
            ) : null}
          </div>
        </header>

        {post.content ? (
          <div className="prose-article" dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : null}
      </article>

      <PdfList files={attachments} />

      <Comments
        postId={post.id}
        postAuthorId={post.author_id}
        canComment={canComment}
        cooldownSeconds={cooldown}
      />
    </main>
  );
}
