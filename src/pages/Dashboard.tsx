
import { Header } from "@/components/Header";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button 
            onClick={() => navigate('/manage-actions')} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Manage Actions
          </Button>
        </div>
        <DashboardContent />
      </main>
    </div>
  );
}
