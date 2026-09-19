export type UserRole = "default" | "poster" | "admin";
export type Grade = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12";
export type Section = "A" | "B" | "C" | "D";

export const GRADES: Grade[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
export const SECTIONS: Section[] = ["A", "B", "C", "D"];

export interface Attachment {
  name: string;
  path: string;
  size: number;
  [key: string]: string | number;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  grade: Grade;
  section: Section;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  cover_image: string | null;
  tags: string[];
  attachments: Attachment[];
  comment_cooldown_seconds: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "id" | "username">;
  view_grades?: Grade[];
  comment_grades?: Grade[];
  view_sections?: Section[];
  comment_sections?: Section[];
  comment_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "id" | "username">;
}

/** Options for the "time gap between comments" control. */
export const COOLDOWN_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "No waiting — comment freely" },
  { value: 30, label: "30 seconds between comments" },
  { value: 60, label: "1 minute between comments" },
  { value: 300, label: "5 minutes between comments" },
  { value: 900, label: "15 minutes between comments" },
  { value: 3600, label: "1 hour between comments" },
  { value: 86400, label: "1 day between comments" },
];

export function formatCooldown(seconds: number): string {
  if (!seconds || seconds <= 0) return "no waiting time";
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hour${seconds >= 7200 ? "s" : ""}`;
  return `${Math.round(seconds / 86400)} day${seconds >= 172800 ? "s" : ""}`;
}
