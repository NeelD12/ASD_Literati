import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { GRADES, SECTIONS, type Grade, type Section } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const GRADE_SET = new Set<string>(GRADES);

export function parseGradeInput(input: string): { grades: Grade[]; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { grades: [], error: null };
  const set = new Set<Grade>();
  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1], 10);
      const b = parseInt(rangeMatch[2], 10);
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      for (let n = lo; n <= hi; n++) {
        const s = String(n);
        if (!GRADE_SET.has(s)) return { grades: [], error: `Grade ${s} is not valid (1-12)` };
        set.add(s as Grade);
      }
      continue;
    }
    if (/^\d{1,2}$/.test(part)) {
      if (!GRADE_SET.has(part)) return { grades: [], error: `Grade ${part} is not valid (1-12)` };
      set.add(part as Grade);
      continue;
    }
    return { grades: [], error: `Couldn't parse "${part}". Use formats like 9, 9,10, or 9-12.` };
  }
  const grades = GRADES.filter((g) => set.has(g));
  return { grades, error: null };
}

export function formatGrades(grades: Grade[]): string {
  if (!grades.length) return "";
  const nums = [...grades].map((g) => parseInt(g, 10)).sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = nums[0];
  let prev = nums[0];
  for (let i = 1; i <= nums.length; i++) {
    const n = nums[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    ranges.push(start === prev ? String(start) : `${start}-${prev}`);
    start = n;
    prev = n;
  }
  return ranges.join(",");
}

export function GradeAccessInput({
  grades,
  onChange,
  label = "Grades with access",
  hint,
}: {
  grades: Grade[];
  onChange: (grades: Grade[]) => void;
  label?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = new Set(grades);
  const allSelected = grades.length === GRADES.length;

  function toggle(g: Grade) {
    const next = new Set(selected);
    if (next.has(g)) next.delete(g);
    else next.add(g);
    onChange(GRADES.filter((x) => next.has(x)));
  }

  const summary = allSelected
    ? "All grades (1-12)"
    : grades.length
      ? `Grade ${formatGrades(grades)}`
      : "Select grades…";

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <p className="text-xs text-muted-foreground">
        Pick one or more grades from the list.{hint ? ` ${hint}` : ""}
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full max-w-sm justify-between font-normal"
          >
            <span className={grades.length ? "" : "text-muted-foreground"}>{summary}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="flex items-center justify-between px-1 pb-2">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-1 py-1"
              onClick={() => onChange([...GRADES])}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-1 py-1 text-muted-foreground"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          </div>
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {GRADES.map((g) => (
              <label
                key={g}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox checked={selected.has(g)} onCheckedChange={() => toggle(g)} />
                Grade {g}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <GradeBadges grades={grades} />
    </div>
  );
}

export function GradeBadges({ grades }: { grades: Grade[] }) {
  if (!grades?.length) return <span className="text-xs text-muted-foreground">No grades selected</span>;
  if (grades.length === GRADES.length) return <Badge variant="secondary">All grades</Badge>;
  return (
    <div className="flex flex-wrap gap-1">
      {grades.map((g) => (
        <Badge key={g} variant="secondary">
          Grade {g}
        </Badge>
      ))}
    </div>
  );
}

export function SectionAccessInput({
  sections,
  onChange,
  label = "Sections with access",
  hint,
}: {
  sections: Section[];
  onChange: (sections: Section[]) => void;
  label?: string;
  hint?: string;
}) {
  const selected = new Set(sections);
  const allSelected = sections.length === SECTIONS.length;

  function toggle(s: Section) {
    const next = new Set(selected);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange(SECTIONS.filter((x) => next.has(x)));
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <p className="text-xs text-muted-foreground">
        A reader must match both a selected grade and a selected section.{hint ? ` ${hint}` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <label
            key={s}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              selected.has(s) ? "border-primary bg-primary/5 font-medium" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Checkbox checked={selected.has(s)} onCheckedChange={() => toggle(s)} />
            Section {s}
          </label>
        ))}
        <Button
          type="button"
          variant="link"
          size="sm"
          className="px-2"
          onClick={() => onChange(allSelected ? [] : [...SECTIONS])}
        >
          {allSelected ? "Clear" : "Select all"}
        </Button>
      </div>
    </div>
  );
}

export function SectionBadges({ sections }: { sections: Section[] }) {
  if (!sections?.length) return <span className="text-xs text-muted-foreground">No sections selected</span>;
  if (sections.length === SECTIONS.length) return <Badge variant="secondary">All sections</Badge>;
  return (
    <div className="flex flex-wrap gap-1">
      {sections.map((s) => (
        <Badge key={s} variant="secondary">
          Section {s}
        </Badge>
      ))}
    </div>
  );
}
