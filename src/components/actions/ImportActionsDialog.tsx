import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast-wrapper";
import { sendActionNotification } from "@/lib/notifications";
import { departmentOptions, priorityOptions } from "@/lib/constants";
import { mapDbActionToActionItem, DbAction } from "@/lib/actions/types";
import {
  IMPORT_FIELDS, autoDetectMapping, mapRows, ColumnMapping, ImportDefaults,
} from "@/lib/actions/importMapping";
import type { Department, Priority } from "@/types/action";

const NONE = "__none__";
type Step = "upload" | "map" | "review" | "done";

export function ImportActionsDialog({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [defaults, setDefaults] = useState<ImportDefaults>({
    department: "Operations",
    priority: "medium",
    meetingDate: new Date().toISOString().slice(0, 10),
  });
  const [notify, setNotify] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);

  const reset = () => {
    setStep("upload"); setWorkbook(null); setFileName(""); setSheet("");
    setHeaders([]); setRows([]); setMapping({}); setImported(0); setNotify(false);
  };

  const loadSheet = (wb: XLSX.WorkBook, name: string) => {
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name], { defval: "", raw: true });
    const hdrs = (XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1 })[0] ?? [])
      .map((h) => String(h ?? "").trim()).filter(Boolean);
    setSheet(name); setRows(data); setHeaders(hdrs); setMapping(autoDetectMapping(hdrs));
  };

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      if (!wb.SheetNames.length) throw new Error("No sheets found");
      setWorkbook(wb); setFileName(file.name);
      loadSheet(wb, wb.SheetNames[0]);
    } catch (e) {
      console.error(e);
      toast.error("Could not read file", { description: "Please upload a valid .xlsx, .xls or .csv file." });
    }
  };

  const mapped = useMemo(() => mapRows(rows, mapping, defaults), [rows, mapping, defaults]);
  const valid = mapped.filter((r) => r.errors.length === 0);
  const invalid = mapped.length - valid.length;
  const requiredMapped = IMPORT_FIELDS.filter((f) => f.required).every((f) => mapping[f.key]);

  const runImport = async () => {
    setImporting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { data: member } = await supabase.from("organization_members")
        .select("organization_id").eq("user_id", userData.user.id).limit(1).maybeSingle();

      const payload = valid.map((r) => ({
        description: r.description,
        owner_email: r.ownerEmail,
        department: r.department,
        priority: r.priority,
        progress_status: r.progressStatus as never,
        completed: r.progressStatus === "100%",
        due_date: r.dueDate ?? null,
        meeting_date: r.meetingDate,
        meeting_title: r.meetingTitle ?? null,
        notes: r.notes,
        user_id: userData.user!.id,
        organization_id: member?.organization_id ?? null,
      }));

      let count = 0;
      for (let i = 0; i < payload.length; i += 100) {
        const { data, error } = await supabase.from("actions").insert(payload.slice(i, i + 100)).select();
        if (error) throw error;
        count += data?.length ?? 0;
        if (notify && data) {
          for (const row of data) {
            await sendActionNotification(mapDbActionToActionItem(row as DbAction), "assigned").catch(() => undefined);
          }
        }
      }
      setImported(count);
      setStep("done");
      onImported();
      toast.success("Import complete", { description: `${count} action${count === 1 ? "" : "s"} imported.` });
    } catch (e) {
      console.error(e);
      toast.error("Import failed", { description: e instanceof Error ? e.message : "Please try again." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import actions from a spreadsheet</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Step 1 of 3 — upload an Excel (.xlsx, .xls) or CSV file."}
            {step === "map" && "Step 2 of 3 — match your columns to action fields."}
            {step === "review" && "Step 3 of 3 — review and import."}
            {step === "done" && "All done."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <label
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-10 text-center cursor-pointer hover:bg-accent/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          >
            <FileSpreadsheet className="h-10 w-10 text-primary" />
            <div>
              <p className="font-medium">{fileName || "Drop your spreadsheet here or click to browse"}</p>
              <p className="text-sm text-muted-foreground">The first row should contain column headers.</p>
            </div>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {workbook && (
              <Badge variant="success-soft">{rows.length} rows found in “{sheet}”</Badge>
            )}
          </label>
        )}

        {step === "upload" && workbook && workbook.SheetNames.length > 1 && (
          <div className="space-y-2">
            <Label>Sheet</Label>
            <Select value={sheet} onValueChange={(v) => loadSheet(workbook, v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {workbook.SheetNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {IMPORT_FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label>
                    {f.label} {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={mapping[f.key] ?? NONE}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === NONE ? undefined : v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Not in my file —</SelectItem>
                      {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-4">
              <p className="text-sm font-medium">Defaults when a value is missing or not recognised</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={defaults.department} onValueChange={(v) => setDefaults((d) => ({ ...d, department: v as Department }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={defaults.priority} onValueChange={(v) => setDefaults((d) => ({ ...d, priority: v as Priority }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Meeting date</Label>
                  <Input type="date" value={defaults.meetingDate}
                    onChange={(e) => setDefaults((d) => ({ ...d, meetingDate: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success-soft">{valid.length} ready to import</Badge>
              {invalid > 0 && <Badge variant="destructive-soft">{invalid} will be skipped</Badge>}
            </div>
            <div className="rounded-lg border border-border max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapped.map((r) => (
                    <TableRow key={r.rowNumber}>
                      <TableCell className="text-muted-foreground">{r.rowNumber}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{r.description || "—"}</TableCell>
                      <TableCell>{r.ownerEmail || "—"}</TableCell>
                      <TableCell className="capitalize">{r.priority}</TableCell>
                      <TableCell>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        {r.errors.length === 0
                          ? <CheckCircle2 className="h-4 w-4 text-success" />
                          : <span className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-4 w-4" />{r.errors.join(", ")}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="notify" checked={notify} onCheckedChange={setNotify} />
              <Label htmlFor="notify">Email each owner about their new action</Label>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="text-lg font-medium">{imported} action{imported === 1 ? "" : "s"} imported</p>
            {invalid > 0 && <p className="text-sm text-muted-foreground">{invalid} row(s) were skipped due to errors.</p>}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "map" && <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>}
          {step === "review" && <Button variant="outline" onClick={() => setStep("map")} disabled={importing}>Back</Button>}
          {step === "upload" && <Button disabled={!workbook || rows.length === 0} onClick={() => setStep("map")}>Next</Button>}
          {step === "map" && <Button disabled={!requiredMapped} onClick={() => setStep("review")}>Review</Button>}
          {step === "review" && (
            <Button disabled={valid.length === 0 || importing} onClick={runImport}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {valid.length} action{valid.length === 1 ? "" : "s"}
            </Button>
          )}
          {step === "done" && <Button onClick={() => setOpen(false)}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
