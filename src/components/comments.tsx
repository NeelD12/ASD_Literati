import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Pencil, Reply, Send, Timer, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { formatCooldown, type Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Props {
  postId: string;
  postAuthorId: string;
  canComment: boolean;
  cooldownSeconds?: number;
  /** True if the current viewer needs a teacher-shared code to comment (students only —
   *  the post author, admins, and verified teachers never need one). */
  needsCode: boolean;
}

interface CommentNode extends Comment {
  children: CommentNode[];
}

function nest(list: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  list.forEach((c) => map.set(c.id, { ...c, children: [] }));
  map.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) map.get(c.parent_id)!.children.push(c);
    else roots.push(c);
  });
  return roots;
}

function countdownLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    return `${h}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

export function Comments({ postId, postAuthorId, canComment, cooldownSeconds = 0, needsCode }: Props) {
  const { userId } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [wait, setWait] = useState(0);

  const refreshWait = useCallback(async () => {
    if (!userId || cooldownSeconds <= 0) {
      setWait(0);
      return;
    }
    const { data } = await supabase.rpc("comment_wait_seconds", { _post: postId });
    setWait(typeof data === "number" ? data : 0);
  }, [userId, cooldownSeconds, postId]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(id,full_name)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (!error) setComments((data as unknown as Comment[]) ?? []);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    load();
    refreshWait();
    const channel = supabase
      .channel(`comments-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, load, refreshWait]);

  // Tick the countdown down locally
  useEffect(() => {
    if (wait <= 0) return;
    const t = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, [wait]);

  const blocked = wait > 0;

  async function submit(parentId: string | null, content: string) {
    if (!content.trim() || !userId) return;
    if (needsCode && !code.trim()) {
      toast.error("Enter the code your teacher shared to comment");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: userId,
      parent_id: parentId,
      content: content.trim(),
      ...(needsCode ? { entry_code: code.trim() } : {}),
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      refreshWait();
    } else {
      setText("");
      toast.success("Comment posted");
      load();
      if (cooldownSeconds > 0) setWait(cooldownSeconds);
    }
  }

  const tree = nest(comments);

  return (
    <section className="mt-10">
      <h3 className="font-serif text-2xl font-semibold">
        Comments <span className="text-muted-foreground">({comments.length})</span>
      </h3>

      {cooldownSeconds > 0 ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Timer className="h-3 w-3" />
          There is a {formatCooldown(cooldownSeconds)} gap between comments on this post.
        </p>
      ) : null}

      {canComment ? (
        <div className="mt-4 space-y-2">
          {needsCode ? (
            <div>
              <label htmlFor="comment-code" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <KeyRound className="h-3 w-3" /> Comment code (from your teacher)
              </label>
              <Input
                id="comment-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                inputMode="numeric"
                className="max-w-[10rem] font-mono tracking-widest"
              />
            </div>
          ) : null}
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={blocked ? "Waiting before your next comment…" : "Share your thoughts…"}
            rows={3}
            disabled={blocked}
          />
          <div className="flex items-center justify-between gap-3">
            {blocked ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" /> You can comment again in {countdownLabel(wait)}
              </span>
            ) : (
              <span />
            )}
            <Button disabled={submitting || blocked || !text.trim()} onClick={() => submit(null, text)}>
              <Send className="mr-1.5 h-4 w-4" /> Post comment
            </Button>
          </div>
        </div>
      ) : userId ? (
        <p className="mt-4 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
          Commenting on this post isn't open to your grade level.
        </p>
      ) : (
        <p className="mt-4 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
          Sign in to join the conversation.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tree.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          tree.map((c) => (
            <CommentItem
              key={c.id}
              node={c}
              postAuthorId={postAuthorId}
              postId={postId}
              canComment={canComment && !blocked}
              needsCode={needsCode}
              onChange={load}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CommentItem({
  node,
  postAuthorId,
  postId,
  canComment,
  needsCode,
  onChange,
  depth = 0,
}: {
  node: CommentNode;
  postAuthorId: string;
  postId: string;
  canComment: boolean;
  needsCode: boolean;
  onChange: () => void;
  depth?: number;
}) {
  const { userId } = useAuth();
  const [editing, setEditing] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState(node.content);
  const [reply, setReply] = useState("");
  const [replyCode, setReplyCode] = useState("");
  const canDelete = userId === node.author_id || userId === postAuthorId;
  const canEdit = userId === node.author_id;

  async function save() {
    const { error } = await supabase
      .from("comments")
      .update({ content: draft.trim(), updated_at: new Date().toISOString() })
      .eq("id", node.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated");
      setEditing(false);
      onChange();
    }
  }

  async function remove() {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", node.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      onChange();
    }
  }

  async function postReply() {
    if (!reply.trim() || !userId) return;
    if (needsCode && !replyCode.trim()) {
      toast.error("Enter the code your teacher shared to comment");
      return;
    }
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: userId,
      parent_id: node.id,
      content: reply.trim(),
      ...(needsCode ? { entry_code: replyCode.trim() } : {}),
    });
    if (error) toast.error(error.message);
    else {
      setReply("");
      setReplyCode("");
      setReplyOpen(false);
      onChange();
    }
  }

  return (
    <div className={depth > 0 ? "ml-6 border-l pl-4" : ""}>
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{node.author?.full_name ?? "Anonymous"}</span>
          <span>{formatDistanceToNow(new Date(node.created_at), { addSuffix: true })}</span>
        </div>
        {editing ? (
          <div className="space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={save}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraft(node.content); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{node.content}</p>
        )}
        {!editing ? (
          <div className="mt-2 flex gap-2">
            {canComment && userId ? (
              <Button size="sm" variant="ghost" onClick={() => setReplyOpen((v) => !v)}>
                <Reply className="mr-1 h-3 w-3" /> Reply
              </Button>
            ) : null}
            {canEdit ? (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil className="mr-1 h-3 w-3" /> Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={remove}>
                <Trash2 className="mr-1 h-3 w-3" /> Delete
              </Button>
            ) : null}
          </div>
        ) : null}
        {replyOpen ? (
          <div className="mt-3 space-y-2">
            {needsCode ? (
              <Input
                value={replyCode}
                onChange={(e) => setReplyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                inputMode="numeric"
                className="max-w-[10rem] font-mono tracking-widest"
              />
            ) : null}
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Write a reply…" />
            <div className="flex gap-2">
              <Button size="sm" onClick={postReply}>Reply</Button>
              <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>Cancel</Button>
            </div>
          </div>
        ) : null}
      </div>
      {node.children.length > 0 ? (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              postAuthorId={postAuthorId}
              postId={postId}
              canComment={canComment}
              needsCode={needsCode}
              onChange={onChange}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
