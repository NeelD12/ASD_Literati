import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { MessageSquare, Eye, FileText } from "lucide-react";
import type { Post } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { GradeBadges } from "@/components/grade-picker";

function excerpt(html: string, max = 180) {
  const text = (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to="/posts/$id"
      params={{ id: post.id }}
      className="group flex flex-col overflow-hidden rounded-xl bg-background/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {post.cover_image ? (
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={post.cover_image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
        <p className="eyebrow">
          {post.author?.full_name ?? "Anonymous"} · {format(new Date(post.created_at), "MMM d, yyyy")}
        </p>
        <h2 className="font-serif text-2xl font-semibold leading-[1.2] text-foreground underline-offset-4 transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{excerpt(post.content)}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Eye className="h-3 w-3" /> {post.view_count ?? 0}</span>
          <span className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> {post.comment_count ?? 0}</span>
          {post.view_grades?.length ? <GradeBadges grades={post.view_grades} /> : null}
          {post.attachments?.length ? (
            <Badge variant="outline" className="gap-1 rounded-full font-normal">
              <FileText className="h-3 w-3" />
              {post.attachments.length} PDF{post.attachments.length > 1 ? "s" : ""}
            </Badge>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
