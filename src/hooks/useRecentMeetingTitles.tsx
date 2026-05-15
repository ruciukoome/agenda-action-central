import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRecentMeetingTitles(): string[] {
  const [titles, setTitles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("actions")
        .select("meeting_title")
        .not("meeting_title", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled || !data) return;
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const row of data) {
        const t = (row as any).meeting_title?.trim();
        if (t && !seen.has(t)) {
          seen.add(t);
          unique.push(t);
        }
      }
      setTitles(unique.slice(0, 20));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return titles;
}
