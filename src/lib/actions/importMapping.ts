import { departmentOptions } from "@/lib/constants";
import type { Department, Priority, ProgressStatus } from "@/types/action";

export type ImportField =
  | "description"
  | "ownerEmail"
  | "department"
  | "priority"
  | "dueDate"
  | "meetingDate"
  | "meetingTitle"
  | "progressStatus"
  | "notes";

export const IMPORT_FIELDS: { key: ImportField; label: string; required?: boolean; hints: string[] }[] = [
  { key: "description", label: "Action description", required: true, hints: ["description", "action", "task", "activity", "item", "action point"] },
  { key: "ownerEmail", label: "Owner email", required: true, hints: ["email", "owner", "assigned", "assignee", "responsible"] },
  { key: "department", label: "Department", hints: ["department", "dept", "unit", "team"] },
  { key: "priority", label: "Priority", hints: ["priority", "urgency"] },
  { key: "dueDate", label: "Due date", hints: ["due", "deadline", "target"] },
  { key: "meetingDate", label: "Meeting date", hints: ["meeting date", "date"] },
  { key: "meetingTitle", label: "Meeting title", hints: ["meeting", "title", "forum"] },
  { key: "progressStatus", label: "Progress", hints: ["progress", "status", "percent"] },
  { key: "notes", label: "Notes", hints: ["notes", "comment", "remarks"] },
];

export type ColumnMapping = Partial<Record<ImportField, string>>;

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  for (const field of IMPORT_FIELDS) {
    for (const hint of field.hints) {
      const match = headers.find((h) => !used.has(h) && h.toLowerCase().trim().includes(hint));
      if (match) {
        mapping[field.key] = match;
        used.add(match);
        break;
      }
    }
  }
  return mapping;
}

export interface ImportDefaults {
  department: Department;
  priority: Priority;
  meetingDate: string; // yyyy-mm-dd
}

export interface MappedRow {
  rowNumber: number;
  description: string;
  ownerEmail: string;
  department: Department;
  priority: Priority;
  progressStatus: ProgressStatus;
  dueDate?: string;
  meetingDate: string;
  meetingTitle?: string;
  notes: string;
  errors: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseDate(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === "number") {
    // Excel serial date
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(value).trim();
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const d = new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function parsePriority(value: unknown): Priority | null {
  const s = String(value ?? "").toLowerCase().trim();
  if (!s) return null;
  if (s.startsWith("h") || s === "urgent" || s === "critical") return "high";
  if (s.startsWith("m") || s === "normal") return "medium";
  if (s.startsWith("l")) return "low";
  return null;
}

export function parseProgress(value: unknown): ProgressStatus {
  if (value === undefined || value === null || value === "") return "Not Started";
  const s = String(value).toLowerCase().trim();
  if (["done", "complete", "completed", "closed", "100", "100%", "1"].includes(s)) return "100%";
  const n = parseFloat(s.replace("%", ""));
  if (!isNaN(n)) {
    const pct = n <= 1 && s.indexOf("%") === -1 && s.includes(".") ? n * 100 : n;
    if (pct >= 100) return "100%";
    if (pct >= 75) return "75%";
    if (pct >= 50) return "50%";
    if (pct >= 25) return "25%";
    return "Not Started";
  }
  if (s.includes("progress") || s.includes("ongoing")) return "50%";
  return "Not Started";
}

export function parseDepartment(value: unknown): Department | null {
  const s = String(value ?? "").toLowerCase().trim();
  if (!s) return null;
  const opts = departmentOptions.map((o: { value: string }) => o.value as Department);
  return opts.find((o) => o.toLowerCase() === s) ?? opts.find((o) => o.toLowerCase().includes(s) || s.includes(o.toLowerCase())) ?? null;
}

export function mapRows(rows: Record<string, unknown>[], mapping: ColumnMapping, defaults: ImportDefaults): MappedRow[] {
  const get = (row: Record<string, unknown>, f: ImportField) => (mapping[f] ? row[mapping[f]!] : undefined);
  return rows.map((row, i) => {
    const errors: string[] = [];
    const description = String(get(row, "description") ?? "").trim();
    const ownerEmail = String(get(row, "ownerEmail") ?? "").trim().toLowerCase();
    if (!description) errors.push("Missing description");
    if (!EMAIL_RE.test(ownerEmail)) errors.push("Invalid owner email");

    const rawDept = get(row, "department");
    const department = parseDepartment(rawDept) ?? defaults.department;
    const priority = parsePriority(get(row, "priority")) ?? defaults.priority;

    const due = parseDate(get(row, "dueDate"));
    if (due === null) errors.push("Unreadable due date");
    const meeting = parseDate(get(row, "meetingDate"));
    if (meeting === null) errors.push("Unreadable meeting date");

    return {
      rowNumber: i + 2,
      description,
      ownerEmail,
      department,
      priority,
      progressStatus: parseProgress(get(row, "progressStatus")),
      dueDate: due ?? undefined,
      meetingDate: meeting ?? new Date(defaults.meetingDate).toISOString(),
      meetingTitle: String(get(row, "meetingTitle") ?? "").trim() || undefined,
      notes: String(get(row, "notes") ?? "").trim(),
      errors,
    };
  });
}
