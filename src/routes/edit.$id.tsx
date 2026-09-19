import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { COOLDOWN_OPTIONS, type Attachment, type Grade, type Section } from "@/lib/types";
import { RichEditor } from "@/components/editor";
import { GradeAccessInput, SectionAccessInput } from "@/components/grade-picker";
import { PdfUpload } from "@/components/pdf-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/edit/$id")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Edit Post | ASD Literati" },
    { name: "description", content: "Edit an ASD Literati post and its reader access." },
    { property: "og:title", content: "Edit Post | ASD Literati" },
    { property: "og:description", content: "Edit an ASD Literati post and its reader access." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const { userId, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  const [tags, setTags] = useState("");
  const [viewGrades, setViewGrades] = useState<Grade[]>([]);
  const [commentGrades, setCommentGrades] = useState<Grade[]>([]);
  const [viewSections, setViewSections] = useState<Section[]>([]);
  const [commentSections, setCommentSections] = useState<Section[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!userId) { navigate({ to: "/auth" }); return; }
    (async () => {
      const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (!post || post.author_id !== userId) {
        toast.error("You can't edit this post.");
        navigate({ to: "/" });
        return;
      }
      setTitle(post.title);
      setContent(post.content ?? "");
      setCover(post.cover_image ?? "");
      setTags((post.tags ?? []).join(", "));
      setCooldown(post.comment_cooldown_seconds ?? 0);
      setFiles(Array.isArray(post.attachments) ? (post.attachments as unknown as Attachment[]) : []);
      const [{ data: v }, { data: c }] = await Promise.all([
        supabase.from("post_view_permissions").select("grade,section").eq("post_id", id),
        supabase.from("post_comment_permissions").select("grade,section").eq("post_id", id),
      ]);
      setViewGrades([...new Set((v ?? []).map((x) => x.grade as Grade))]);
      setCommentGrades([...new Set((c ?? []).map((x) => x.grade as Grade))]);
      setViewSections([...new Set((v ?? []).map((x) => x.section as Section))]);
      setCommentSections([...new Set((c ?? []).map((x) => x.section as Section))]);
      setReady(true);
    })();
  }, [id, userId, loading, navigate]);

  async function save() {
    if (!title.trim() || viewGrades.length === 0 || viewSections.length === 0) {
      toast.error("Need a title and at least one grade and section that can read the post.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("posts").update({
      title: title.trim(),
      content,
      cover_image: cover.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      attachments: files,
      comment_cooldown_seconds: cooldown,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    await Promise.all([
      supabase.from("post_view_permissions").delete().eq("post_id", id),
      supabase.from("post_comment_permissions").delete().eq("post_id", id),
    ]);
    await Promise.all([
      viewGrades.length
        ? supabase.from("post_view_permissions").insert(viewGrades.flatMap((grade) => viewSections.map((section) => ({ post_id: id, grade, section }))))
        : Promise.resolve(),
      commentGrades.length
        ? supabase.from("post_comment_permissions").insert(commentGrades.flatMap((grade) => commentSections.map((section) => ({ post_id: id, grade, section }))))
        : Promise.resolve(),
    ]);
    setBusy(false);
    toast.success("Saved");
    navigate({ to: "/posts/$id", params: { id } });
  }

  if (!ready) return <main className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Edit post</h1>
      <div className="mt-8 space-y-8">
        <section className="space-y-5">
          <h2 className="font-serif text-xl font-semibold">1. The post</h2>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Cover image URL</Label>
              <Input value={cover} onChange={(e) => setCover(e.target.value)} />
            </div>
            <div>
              <Label>Tags</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Content</Label>
            <RichEditor value={content} onChange={setContent} />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">2. PDFs</h2>
          <PdfUpload userId={userId} files={files} onChange={setFiles} />
        </section>

        <section className="space-y-5 rounded-xl border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">3. Who gets access</h2>
          <GradeAccessInput
            grades={viewGrades}
            onChange={setViewGrades}
            label="Grades that can read this post"
          />
          <SectionAccessInput
            sections={viewSections}
            onChange={setViewSections}
            label="Sections that can read this post"
          />
          <div className="border-t pt-5">
            <GradeAccessInput
              grades={commentGrades}
              onChange={setCommentGrades}
              label="Grades that can comment"
              hint="Leave empty to turn comments off. These can be different from the reading grades."
            />
            <div className="mt-5">
              <SectionAccessInput
                sections={commentSections}
                onChange={setCommentSections}
                label="Sections that can comment"
              />
            </div>
          </div>
          <div className="border-t pt-5">
            <Label>Time gap between comments</Label>
            <p className="mb-2 text-xs text-muted-foreground">
              How long a reader must wait before they can comment on this post again.
            </p>
            <Select value={String(cooldown)} onValueChange={(v) => setCooldown(Number(v))}>
              <SelectTrigger className="max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COOLDOWN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate({ to: "/posts/$id", params: { id } })}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
    </main>
  );
}
