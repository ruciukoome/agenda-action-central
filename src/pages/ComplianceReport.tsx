import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OwnerStat {
  email: string;
  total: number;
  completedOnTime: number;
  overdue: number;
  incomplete: number;
  compliant: boolean;
}

function monthOptions(count = 12): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    out.push({ value, label });
  }
  return out;
}

function parseMonth(value: string): { start: Date; end: Date; label: string } {
  const [y, m] = value.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const label = start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { start, end, label };
}

export default function ComplianceReport() {
  const { organization, isOrgAdmin, isSuperAdmin, isLoading } = useOrganization();
  const options = useMemo(() => monthOptions(12), []);
  const [month, setMonth] = useState<string>(options[0]?.value ?? "");
  const [owners, setOwners] = useState<OwnerStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rule, setRule] = useState<"on_time" | "any_completion">("on_time");

  const allowed = isOrgAdmin || isSuperAdmin;

  useEffect(() => {
    if (!organization || !allowed || !month) return;
    const { start, end } = parseMonth(month);
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data: settings } = await supabase
        .from("organization_email_settings" as any)
        .select("compliance_rule")
        .eq("organization_id", organization.id)
        .maybeSingle();
      const orgRule: "on_time" | "any_completion" =
        ((settings as any)?.compliance_rule as any) === "any_completion" ? "any_completion" : "on_time";
      if (!cancelled) setRule(orgRule);

      const { data, error } = await supabase
        .from("actions")
        .select("owner_email, due_date, completed, updated_at")
        .eq("organization_id", organization.id)
        .gte("due_date", start.toISOString())
        .lt("due_date", end.toISOString());

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setOwners([]);
        setLoading(false);
        return;
      }

      const now = new Date();
      const byOwner = new Map<string, OwnerStat>();
      for (const a of data || []) {
        const email = ((a as any).owner_email || "").toLowerCase().trim();
        if (!email) continue;
        const due = (a as any).due_date ? new Date((a as any).due_date) : null;
        if (!due) continue;
        let s = byOwner.get(email);
        if (!s) {
          s = { email, total: 0, completedOnTime: 0, overdue: 0, incomplete: 0, compliant: true };
          byOwner.set(email, s);
        }
        s.total += 1;
        if ((a as any).completed) {
          const completedAt = (a as any).updated_at ? new Date((a as any).updated_at) : null;
          if (orgRule === "any_completion") {
            s.completedOnTime += 1;
          } else if (completedAt && completedAt <= due) {
            s.completedOnTime += 1;
          } else {
            s.overdue += 1;
          }
        } else {
          if (due < now) s.overdue += 1;
          else s.incomplete += 1;
        }
      }
      const arr = Array.from(byOwner.values()).map((s) => ({
        ...s,
        compliant: s.overdue === 0 && s.incomplete === 0,
      }));
      arr.sort((a, b) => Number(a.compliant) - Number(b.compliant) || a.email.localeCompare(b.email));
      setOwners(arr);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [organization, allowed, month]);

  if (isLoading) {
    return (
      <AppLayout title="Compliance Report">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }
  if (!allowed) return <Navigate to="/dashboard" replace />;

  const compliantCount = owners.filter((o) => o.compliant).length;
  const nonCompliantCount = owners.length - compliantCount;
  const totalActions = owners.reduce((sum, o) => sum + o.total, 0);
  const rate = owners.length > 0 ? Math.round((compliantCount / owners.length) * 100) : 0;
  const monthLabel = month ? parseMonth(month).label : "";

  return (
    <AppLayout title="Compliance Report">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Monthly Compliance Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Tracks users by whether their actions due in the month were completed on time.
            </p>
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Actions due</CardDescription>
              <CardTitle className="text-3xl">{totalActions}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-success/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-success">Compliant users</CardDescription>
              <CardTitle className="text-3xl text-success">{compliantCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-destructive/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-destructive">Non-compliant users</CardDescription>
              <CardTitle className="text-3xl text-destructive">{nonCompliantCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-info/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-info">Compliance rate</CardDescription>
              <CardTitle className="text-3xl text-info">{rate}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Per-user breakdown — {monthLabel}</CardTitle>
            <CardDescription>
              Rule: <strong>{rule === "any_completion"
                ? "any completion counts (even after due date)"
                : "must be completed on or before due date"}</strong>.
              {" "}Org admins can change this in Settings → Email Notifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : owners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No actions were due in {monthLabel}.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                    <TableHead className="text-center">{rule === "any_completion" ? "Completed" : "On time"}</TableHead>
                    <TableHead className="text-center">Overdue / late</TableHead>
                    <TableHead className="text-center">Still open</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.map((o) => (
                    <TableRow key={o.email}>
                      <TableCell className="font-medium">{o.email}</TableCell>
                      <TableCell className="text-center">{o.total}</TableCell>
                      <TableCell className="text-center text-success">{o.completedOnTime}</TableCell>
                      <TableCell className="text-center text-destructive">{o.overdue}</TableCell>
                      <TableCell className="text-center text-warning">{o.incomplete}</TableCell>
                      <TableCell className="text-center">
                        {o.compliant ? (
                          <Badge variant="success-soft">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Compliant
                          </Badge>
                        ) : (
                          <Badge variant="destructive-soft">
                            <AlertCircle className="h-3 w-3 mr-1" />Non-compliant
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
