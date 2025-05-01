
import { Header } from "@/components/Header";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-10">
        <DashboardContent />
      </main>
    </div>
  );
}
