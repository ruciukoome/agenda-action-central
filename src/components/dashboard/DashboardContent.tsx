
import { useEffect, useState } from "react";
import { NotesStatistics } from "./NotesStatistics";
import { ActionCharts } from "./ActionCharts";
import { UpcomingDeadlines } from "./UpcomingDeadlines";
import { ActionItem } from "@/types/action";
import { fetchActions } from "@/lib/postgres-actions";
import { useAuth } from "@/lib/auth";
import { DatabaseEnvironmentWarning } from "@/components/DatabaseEnvironmentWarning";

export function DashboardContent() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const loadActions = async () => {
      setIsLoading(true);
      try {
        const data = await fetchActions(session?.user?.id);
        setActions(data);
      } catch (error) {
        console.error("Failed to fetch actions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      loadActions();
    }
    
    // Set up polling for data refresh every 30 seconds
    const intervalId = setInterval(() => {
      if (session?.user) {
        loadActions();
      }
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [session]);

  return (
    <div className="space-y-8">
      {/* Show warning when in browser environment */}
      {typeof window !== 'undefined' && <DatabaseEnvironmentWarning />}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-1">
          <NotesStatistics actions={actions} isLoading={isLoading} />
        </div>

        <div className="md:col-span-2">
          <UpcomingDeadlines actions={actions} isLoading={isLoading} />
        </div>
      </div>

      <div>
        <ActionCharts actions={actions} isLoading={isLoading} />
      </div>
    </div>
  );
}
