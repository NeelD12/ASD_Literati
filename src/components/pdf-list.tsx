import { useEffect, useState } from "react";
import { FileText, Download, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Attachment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/components/pdf-upload";

export function PdfList({ files }: { files: Attachment[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!files?.length) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage
        .from("post-files")
        .createSignedUrls(files.map((f) => f.path), 60 * 60);
      if (cancelled || !data) return;
      const map: Record<string, string> = {};
      data.forEach((d) => {
        if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
      });
      setUrls(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  if (!files?.length) return null;

  return (
    <section className="mt-10 rounded-xl border bg-card p-5">
      <h3 className="font-serif text-xl font-semibold">
        Attached PDFs <span className="text-muted-foreground">({files.length})</span>
      </h3>
      <ul className="mt-4 space-y-3">
        {files.map((f) => {
          const url = urls[f.path];
          const isOpen = open === f.path;
          return (
            <li key={f.path} className="rounded-lg border bg-background">
              <div className="flex items-center gap-3 p-3">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!url}
                  onClick={() => setOpen(isOpen ? null : f.path)}
                >
                  {isOpen ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                  {isOpen ? "Hide" : "Preview"}
                </Button>
                <Button asChild size="sm" variant="ghost" disabled={!url}>
                  <a href={url ?? "#"} target="_blank" rel="noopener noreferrer" download={f.name}>
                    <Download className="mr-1 h-3 w-3" /> Download
                  </a>
                </Button>
              </div>
              {isOpen && url ? (
                <div className="border-t p-3">
                  <iframe
                    src={url}
                    title={f.name}
                    className="h-[70vh] w-full rounded-md border bg-muted"
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
