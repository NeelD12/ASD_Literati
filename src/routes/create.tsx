import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { GRADES, SECTIONS, COOLDOWN_OPTIONS, type Attachment, type Grade, type Section } from "@/lib/types";
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

export const Route = createFileRoute("/create")({
  ssr: false,
  head: () => ({ meta: [
    { title: "New Post | ASD Literati" },
    { name: "description", content: "Create and publish a new piece for ASD Literati." },
    { property: "og:title", content: "New Post | ASD Literati" },
    { property: "og:description", content: "Create and publish a new piece for ASD Literati." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CreatePage,
});

function CreatePage() {
  const { profile, userId, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  const [tags, setTags] = useState("");
  const [viewGrades, setViewGrades] = useState<Grade[]>([...GRADES]);
  const [commentGrades, setCommentGrades] = useState<Grade[]>([...GRADES]);
  const [viewSections, setViewSections] = useState<Section[]>([...SECTIONS]);
  const [commentSections, setCommentSections] = useState<Section[]>([...SECTIONS]);
  const [cooldown, setCooldown] = useState(0);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!userId) navigate({ to: "/auth" });
    else if (profile && profile.role !== "poster" && profile.role !== "admin") {
      toast.error("You need a Poster account to write posts.");
      navigate({ to: "/settings" });
    }
  }, [userId, profile, loading, navigate]);

  async function publish() {
    if (!title.trim() || !userId) {
      toast.error("Add a title first.");
      return;
    }
    if (!content.trim() && files.length === 0) {
      toast.error("Add some content or attach at least one PDF.");
      return;
    }
    if (viewGrades.length === 0) {
      toast.error("Choose at least one grade that can view this post.");
      return;
    }
    if (viewSections.length === 0) {
      toast.error("Choose at least one section that can view this post.");
      return;
    }
    setBusy(true);
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: userId,
        title: title.trim(),
        content,
        cover_image: cover.trim() || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        attachments: files,
        comment_cooldown_seconds: cooldown,
      })
      .select()
      .single();

    if (error || !post) {
      setBusy(false);
      toast.error(error?.message ?? "Failed to publish");
      return;
    }

    await Promise.all([
      viewGrades.length
        ? supabase
            .from("post_view_permissions")
             .insert(viewGrades.flatMap((grade) => viewSections.map((section) => ({ post_id: post.id, grade, section }))))
        : Promise.resolve(),
      commentGrades.length
        ? supabase
            .from("post_comment_permissions")
             .insert(commentGrades.flatMap((grade) => commentSections.map((section) => ({ post_id: post.id, grade, section }))))
        : Promise.resolve(),
    ]);

    toast.success("Published");
    setBusy(false);
    navigate({ to: "/posts/$id", params: { id: post.id } });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">New post</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Attach PDFs, choose who can read and who can comment. You can edit all of this later.
      </p>

      <div className="mt-8 space-y-8">
        <section className="space-y-5">
          <h2 className="font-serif text-xl font-semibold">1. The post</h2>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="An essay about…"
              className="text-lg"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cover">Cover image URL (optional)</Label>
              <Input id="cover" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="essay, history" />
            </div>
          </div>
          <div>
            <Label>Content</Label>
            <RichEditor value={content} onChange={setContent} placeholder="Tell your story…" />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">2. Upload PDFs</h2>
          <p className="text-sm text-muted-foreground">
            Readers can preview each PDF right on the page, or download it.
          </p>
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
          <Button variant="ghost" onClick={() => navigate({ to: "/" })}>Cancel</Button>
          <Button onClick={publish} disabled={busy}>{busy ? "Publishing…" : "Publish"}</Button>
        </div>
      </div>
    </main>
  );
}
