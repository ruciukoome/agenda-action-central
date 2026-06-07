import { useEffect, useState, useCallback } from "react";
import { Meeting } from "@/types/action";
import { listOrgMeetings } from "@/lib/meetings";
import { useOrganization } from "@/contexts/OrganizationContext";

export function useMeetings() {
  const { organization } = useOrganization();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!organization) {
      setMeetings([]);
      return;
    }
    setLoading(true);
    try {
      const m = await listOrgMeetings(organization.id);
      setMeetings(m);
    } catch (e) {
      console.error("Failed to load meetings", e);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { refresh(); }, [refresh]);

  return { meetings, loading, refresh, organizationId: organization?.id };
}
