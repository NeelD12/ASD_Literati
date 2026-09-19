import { supabaseConfigured } from "@/lib/supabase";

export function SupabaseSetupBanner() {
  if (supabaseConfigured) return null;
  return (
    <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
      Supabase isn't connected. Add{" "}
      <code className="rounded bg-amber-200/70 px-1 py-0.5 text-xs dark:bg-amber-900/70">
        VITE_SUPABASE_URL
      </code>{" "}
      and{" "}
      <code className="rounded bg-amber-200/70 px-1 py-0.5 text-xs dark:bg-amber-900/70">
        VITE_SUPABASE_ANON_KEY
      </code>{" "}
      env vars, and run{" "}
      <code className="rounded bg-amber-200/70 px-1 py-0.5 text-xs dark:bg-amber-900/70">
        supabase/schema.sql
      </code>{" "}
      in your project.
    </div>
  );
}
