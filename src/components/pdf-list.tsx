import { useEffect, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FileText, Download, Eye, MessageSquare, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Attachment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/components/pdf-upload";

/** Types the browser can render directly in an iframe/img — everything else just gets a Download link. */
function isPreviewable(file: Attachment): boolean {
  const type = file.type ?? "";
  if (type === "application/pdf" || type.startsWith("image/") || type === "text/plain") return true;
  if (!type) return /\.(pdf|png|jpe?g|gif|webp|svg|txt)$/i.test(file.name);
  return false;
}

export function PdfList({ files, children }: { files: Attachment[]; children?: ReactNode }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!files?.length) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage.from("post-files").createSignedUrls(
        files.map((f) => f.path),
        60 * 60,
      );
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

  const activeFile = files?.find((f) => f.path === open);
  const activeUrl = activeFile ? urls[activeFile.path] : undefined;

  return (
    <>
    {files?.length ? <section className="mt-10 rounded-xl border bg-card p-5">
      <h3 className="font-serif text-xl font-semibold">
        Attached Files <span className="text-muted-foreground">({files.length})</span>
      </h3>
      <ul className="mt-4 space-y-3">
        {files.map((f) => {
          const url = urls[f.path];
          const previewable = isPreviewable(f);
          return (
            <li key={f.path} className="rounded-lg border bg-background">
              <div className="flex items-center gap-3 p-3">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                </div>
                {previewable ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!url}
                    onClick={() => { setShowComments(false); setOpen(f.path); }}
                  >
                    <Eye className="mr-1 h-3 w-3" /> Preview
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="ghost" disabled={!url}>
                  <a href={url ?? "#"} target="_blank" rel="noopener noreferrer" download={f.name}>
                    <Download className="mr-1 h-3 w-3" /> Download
                  </a>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section> : null}
    <DialogPrimitive.Root open={!!activeFile && !!activeUrl} onOpenChange={(value) => { if (!value) { setOpen(null); setShowComments(false); } }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content aria-describedby={undefined} className="pdf-viewer fixed inset-2 z-50 flex flex-col overflow-hidden border border-border bg-card text-card-foreground shadow-2xl outline-none sm:inset-4 lg:inset-6">
          <header className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-3 py-2 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <DialogPrimitive.Title className="truncate font-serif text-base font-semibold sm:text-lg">{activeFile?.name}</DialogPrimitive.Title>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {children ? <Button size="sm" variant={showComments ? "secondary" : "ghost"} aria-label={showComments ? "Close comments" : "Open comments"} aria-pressed={showComments} title={showComments ? "Close comments" : "Comments"} onClick={() => setShowComments((value) => !value)}>
                <MessageSquare className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Comments</span>
              </Button> : null}
              {activeUrl && activeFile ? <Button asChild size="sm" variant="ghost" title="Download file"><a href={activeUrl} target="_blank" rel="noopener noreferrer" download={activeFile.name}><Download className="h-4 w-4" /><span className="sr-only">Download</span></a></Button> : null}
              <DialogPrimitive.Close asChild><Button size="sm" variant="outline" title="Close preview"><X className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Close</span><span className="sr-only sm:hidden">Close preview</span></Button></DialogPrimitive.Close>
            </div>
          </header>
          <div className="relative flex min-h-0 flex-1 bg-muted/50">
            <div className="min-h-0 min-w-0 flex-1 p-2 sm:p-3 lg:p-4">
              {activeUrl && activeFile && (activeFile.type?.startsWith("image/") || (!activeFile.type && /\.(png|jpe?g|gif|webp|svg)$/i.test(activeFile.name))) ?
                <div className="flex h-full items-center justify-center overflow-auto"><img src={activeUrl} alt={activeFile.name} className="max-h-full max-w-full object-contain" /></div> :
                activeUrl ? <iframe src={activeUrl} title={activeFile?.name ?? "File preview"} className="h-full w-full border border-border bg-card" /> : null}
            </div>
            {children ? <aside aria-label="Comments" aria-hidden={!showComments} inert={!showComments} className={`pdf-comments-panel absolute inset-y-0 right-0 z-10 flex w-[min(100%,25rem)] flex-col border-l border-border bg-card shadow-xl transition-transform duration-200 lg:static lg:w-[min(35%,25rem)] lg:shrink-0 lg:transition-[width] ${showComments ? "translate-x-0" : "translate-x-full lg:w-0 lg:translate-x-0 lg:border-l-0 lg:shadow-none"}`}>
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                <h2 className="font-serif text-lg font-semibold">Conversation</h2>
                <Button size="icon" variant="ghost" aria-label="Close comments" title="Close comments" onClick={() => setShowComments(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 sm:px-5">{open ? children : null}</div>
            </aside> : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
    {!open ? children : null}
    </>
  );
}
