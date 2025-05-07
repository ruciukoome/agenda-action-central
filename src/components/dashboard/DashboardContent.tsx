
import { useEffect, useState } from "react";
import { NotesStatistics } from "./NotesStatistics";
import { ActionCharts } from "./ActionCharts";
import { UpcomingDeadlines } from "./UpcomingDeadlines";
import { ActionItem } from "@/types/action";
import { fetchActions } from "@/lib/postgres-actions";

export function DashboardContent() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActions = async () => {
      setIsLoading(true);
      try {
        const data = await fetchActions();
        setActions(data);
      } catch (error) {
        console.error("Failed to fetch actions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActions();
    
    // Set up polling for data refresh every 30 seconds
    const intervalId = setInterval(() => {
      loadActions();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="space-y-8">
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
