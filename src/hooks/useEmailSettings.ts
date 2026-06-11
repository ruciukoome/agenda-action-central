import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/contexts/OrganizationContext";

export type EmailPrefKey =
  | "assignment_notifications"
  | "completion_updates"
  | "due_date_reminders"
  | "weekly_digest"
  | "monthly_compliance_report";

export type ComplianceRule = "on_time" | "any_completion";

export type EmailPrefValues = Record<EmailPrefKey, boolean>;
export type UserPrefValues = Record<EmailPrefKey, boolean | null>;

const DEFAULTS: EmailPrefValues = {
  assignment_notifications: true,
  completion_updates: true,
  due_date_reminders: true,
  weekly_digest: false,
  monthly_compliance_report: false,
};

const KEYS: EmailPrefKey[] = [
  "assignment_notifications",
  "completion_updates",
  "due_date_reminders",
  "weekly_digest",
  "monthly_compliance_report",
];

export function useEmailSettings() {
  const { user } = useAuth();
  const { organization, isOrgAdmin } = useOrganization();
  const [orgDefaults, setOrgDefaults] = useState<EmailPrefValues>(DEFAULTS);
  const [complianceRule, setComplianceRuleState] = useState<ComplianceRule>("on_time");
  const [userOverrides, setUserOverrides] = useState<UserPrefValues>({
    assignment_notifications: null,
    completion_updates: null,
    due_date_reminders: null,
    weekly_digest: null,
    monthly_compliance_report: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (organization) {
        const { data: org } = await supabase
          .from("organization_email_settings" as any)
          .select("*")
          .eq("organization_id", organization.id)
          .maybeSingle();
        if (org) {
          setOrgDefaults({
            assignment_notifications: (org as any).assignment_notifications ?? DEFAULTS.assignment_notifications,
            completion_updates: (org as any).completion_updates ?? DEFAULTS.completion_updates,
            due_date_reminders: (org as any).due_date_reminders ?? DEFAULTS.due_date_reminders,
            weekly_digest: (org as any).weekly_digest ?? DEFAULTS.weekly_digest,
            monthly_compliance_report: (org as any).monthly_compliance_report ?? DEFAULTS.monthly_compliance_report,
          });
          setComplianceRuleState(((org as any).compliance_rule as ComplianceRule) ?? "on_time");
        } else {
          setOrgDefaults(DEFAULTS);
          setComplianceRuleState("on_time");
        }
      }
      const { data: u } = await supabase
        .from("user_email_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (u) {
        setUserOverrides({
          assignment_notifications: (u as any).assignment_notifications,
          completion_updates: (u as any).completion_updates,
          due_date_reminders: (u as any).due_date_reminders,
          weekly_digest: (u as any).weekly_digest,
          monthly_compliance_report: (u as any).monthly_compliance_report ?? null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, organization]);

  useEffect(() => {
    load();
  }, [load]);

  const effective: EmailPrefValues = KEYS.reduce((acc, k) => {
    acc[k] =
      userOverrides[k] !== null && userOverrides[k] !== undefined
        ? (userOverrides[k] as boolean)
        : orgDefaults[k];
    return acc;
  }, {} as EmailPrefValues);

  const setUserOverride = async (key: EmailPrefKey, value: boolean | null) => {
    if (!user) return;
    const next = { ...userOverrides, [key]: value };
    setUserOverrides(next);
    await supabase
      .from("user_email_settings" as any)
      .upsert(
        {
          user_id: user.id,
          organization_id: organization?.id ?? null,
          ...next,
        },
        { onConflict: "user_id" }
      );
  };

  const setOrgDefault = async (key: EmailPrefKey, value: boolean) => {
    if (!organization || !isOrgAdmin || !user) return;
    const next = { ...orgDefaults, [key]: value };
    setOrgDefaults(next);
    await supabase
      .from("organization_email_settings" as any)
      .upsert(
        {
          organization_id: organization.id,
          ...next,
          updated_by: user.id,
        },
        { onConflict: "organization_id" }
      );
  };

  const setComplianceRule = async (rule: ComplianceRule) => {
    if (!organization || !isOrgAdmin || !user) return;
    setComplianceRuleState(rule);
    await supabase
      .from("organization_email_settings" as any)
      .upsert(
        {
          organization_id: organization.id,
          ...orgDefaults,
          compliance_rule: rule,
          updated_by: user.id,
        },
        { onConflict: "organization_id" }
      );
  };

  return {
    loading,
    orgDefaults,
    userOverrides,
    effective,
    complianceRule,
    isOrgAdmin,
    hasOrg: !!organization,
    setUserOverride,
    setOrgDefault,
    setComplianceRule,
    reload: load,
  };
}
