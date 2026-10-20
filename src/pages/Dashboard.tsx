import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/primitives";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { KanbanSquare, ListChecks } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <AppLayout
      title="Dashboard"
      actions={
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/app')}
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2"
          >
            <KanbanSquare className="h-4 w-4" />
            Action Items
          </Button>
          <Button
            onClick={() => navigate('/managed-actions')}
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2"
          >
            <ListChecks className="h-4 w-4" />
            Manage
          </Button>
        </div>
      }
    >
      <PageContainer>
        <DashboardContent />
      </PageContainer>
    </AppLayout>
  );
}
