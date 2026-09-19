import { useRef, useState } from "react";
import { FileText, UploadCloud, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Attachment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 25 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  userId: string | null;
  files: Attachment[];
  onChange: (files: Attachment[]) => void;
}

export function PdfUpload({ userId, files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);

  async function handleFiles(list: FileList | null) {
    if (!list || !userId) return;
    const incoming = Array.from(list);
    const accepted = incoming.filter((f) => {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        toast.error(`${f.name} isn't a PDF.`);
        return false;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is larger than 25 MB.`);
        return false;
      }
      return true;
    });
    if (!accepted.length) return;

    setUploading((u) => [...u, ...accepted.map((f) => f.name)]);
    const uploaded: Attachment[] = [];
    for (const file of accepted) {
      const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error } = await supabase.storage
        .from("post-files")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (error) toast.error(`${file.name}: ${error.message}`);
      else uploaded.push({ name: file.name, path, size: file.size });
    }
    setUploading((u) => u.filter((n) => !accepted.some((f) => f.name === n)));
    if (uploaded.length) {
      onChange([...files, ...uploaded]);
      toast.success(`${uploaded.length} PDF${uploaded.length > 1 ? "s" : ""} attached`);
    }
  }

  async function remove(file: Attachment) {
    onChange(files.filter((f) => f.path !== file.path));
    await supabase.storage.from("post-files").remove([file.path]);
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60",
        )}
      >
        <UploadCloud className={cn("h-8 w-8", dragging ? "text-primary" : "text-muted-foreground")} />
        <p className="text-sm font-medium">
          Drag your PDFs here, or <span className="text-primary underline">browse</span>
        </p>
        <p className="text-xs text-muted-foreground">PDF only · up to 25 MB each · multiple files allowed</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploading.length > 0 ? (
        <ul className="space-y-2">
          {uploading.map((name) => (
            <li
              key={name}
              className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="truncate">Uploading {name}…</span>
            </li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.path} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => remove(f)}
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
