import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, Mail, CalendarClock, AlertTriangle, Newspaper, BarChart3 } from "lucide-react";
import { toast } from "@/lib/toast-wrapper";
import { EmailPrefKey, useEmailSettings } from "@/hooks/useEmailSettings";

type RowMeta = {
  key: EmailPrefKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  adminOnly?: boolean;
};

const ROWS: RowMeta[] = [
  {
    key: "assignment_notifications",
    title: "Assignment Notifications",
    description: "Email the owner when a new action is assigned",
    icon: Mail,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    key: "due_date_reminders",
    title: "Due Date Reminders",
    description: "Reminder email one day before an action is due",
    icon: Clock,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    key: "completion_updates",
    title: "Completion Updates",
    description: "Notify the assigner when their action is marked complete",
    icon: CheckCircle,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    key: "weekly_digest",
    title: "Weekly Digest",
    description: "Sunday summary of your open and overdue actions",
    icon: Newspaper,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    key: "monthly_compliance_report",
    title: "Monthly Compliance Report (admins)",
    description: "Monthly email listing compliant and non-compliant users in your organization, based on due-date adherence",
    icon: BarChart3,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    adminOnly: true,
  },
];

function OverrideSelect({
  value,
  onChange,
  disabled,
}: {
  value: boolean | null | undefined;
  onChange: (v: boolean | null) => void;
  disabled?: boolean;
}) {
  const stringValue = value === null || value === undefined ? "inherit" : value ? "on" : "off";
  return (
    <Select
      value={stringValue}
      disabled={disabled}
      onValueChange={(v) =>
        onChange(v === "inherit" ? null : v === "on" ? true : false)
      }
    >
      <SelectTrigger className="w-[160px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="inherit">Use org default</SelectItem>
        <SelectItem value="on">Always on</SelectItem>
        <SelectItem value="off">Always off</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function EmailIntegrationCard() {
  const {
    loading,
    orgDefaults,
    userOverrides,
    effective,
    complianceRule,
    isOrgAdmin,
    hasOrg,
    setUserOverride,
    setOrgDefault,
    setComplianceRule,
  } = useEmailSettings();

  const handleComplianceRuleChange = async (rule: "on_time" | "any_completion") => {
    try {
      await setComplianceRule(rule);
      toast.success("Compliance rule updated");
    } catch (e: any) {
      toast.error("Failed to update rule", { description: e?.message });
    }
  };

  const handleUserChange = async (key: EmailPrefKey, value: boolean | null) => {
    try {
      await setUserOverride(key, value);
      toast.success("Preference saved");
    } catch (e: any) {
      toast.error("Failed to save", { description: e?.message });
    }
  };

  const handleOrgChange = async (key: EmailPrefKey, value: boolean) => {
    try {
      await setOrgDefault(key, value);
      toast.success("Organization default updated");
    } catch (e: any) {
      toast.error("Failed to update org default", { description: e?.message });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Choose which emails you receive. Org admins can set defaults for everyone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* SETTINGS */}
          <TabsContent value="settings" className="pt-4 space-y-5">
            {loading && (
              <p className="text-sm text-muted-foreground">Loading preferences…</p>
            )}
            {!loading &&
              ROWS.filter((r) => !r.adminOnly || isOrgAdmin).map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.key} className="border rounded-md p-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${row.iconBg} p-2 rounded-full`}>
                        <Icon className={`h-4 w-4 ${row.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">{row.title}</h3>
                          <Badge variant={effective[row.key] ? "default" : "secondary"} className="text-[10px]">
                            {effective[row.key] ? "Active for you" : "Off for you"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{row.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-11">
                      <span className="text-xs text-muted-foreground">My preference</span>
                      <OverrideSelect
                        value={userOverrides[row.key]}
                        onChange={(v) => handleUserChange(row.key, v)}
                      />
                    </div>

                    {hasOrg && (
                      <div className="flex items-center justify-between pl-11">
                        <span className="text-xs text-muted-foreground">
                          Org default {isOrgAdmin ? "" : "(admin only)"}
                        </span>
                        <Switch
                          checked={orgDefaults[row.key]}
                          disabled={!isOrgAdmin}
                          onCheckedChange={(c) => handleOrgChange(row.key, c)}
                        />
                      </div>
                    )}

                    {row.key === "monthly_compliance_report" && hasOrg && (
                      <div className="flex items-center justify-between pl-11">
                        <span className="text-xs text-muted-foreground">
                          Compliance rule {isOrgAdmin ? "" : "(admin only)"}
                        </span>
                        <Select
                          value={complianceRule}
                          disabled={!isOrgAdmin}
                          onValueChange={(v) => handleComplianceRuleChange(v as "on_time" | "any_completion")}
                        >
                          <SelectTrigger className="w-[220px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on_time">Completed by due date</SelectItem>
                            <SelectItem value="any_completion">Any completion (even late)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Overdue alerts placeholder */}
            <div className="border rounded-md p-3 opacity-60">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Overdue Alerts</h3>
                    <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alert when an action passes its due date without completion
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4 pt-4">
            {ROWS.filter((r) => !r.adminOnly || isOrgAdmin).map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.key} className="flex items-start space-x-4">
                  <div className={`mt-0.5 ${row.iconBg} p-2 rounded-full`}>
                    <Icon className={`h-5 w-5 ${row.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{row.title}</h3>
                    <p className="text-sm text-muted-foreground">{row.description}</p>
                  </div>
                </div>
              );
            })}
            <div className="flex items-start space-x-4 opacity-60">
              <div className="mt-0.5 bg-red-100 p-2 rounded-full">
                <CalendarClock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Overdue Alerts (coming soon)</h3>
                <p className="text-sm text-muted-foreground">
                  Email when an action becomes overdue
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Personal preferences override organization defaults. Changes apply to future emails.
        </p>
      </CardFooter>
    </Card>
  );
}
