
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionItem } from "@/types/action";
import { FileText, CheckCircle, BarChart } from "lucide-react";

interface NotesStatisticsProps {
  actions: ActionItem[];
  isLoading: boolean;
}

export function NotesStatistics({ actions, isLoading }: NotesStatisticsProps) {
  // Calculate statistics
  const totalMeetings = actions.length;
  const completedNotes = actions.filter(action => action.completed).length;
  const completionPercentage = totalMeetings > 0 
    ? Math.round((completedNotes / totalMeetings) * 100) 
    : 0;

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Notes Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-lg font-medium">Notes Management</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Meetings</p>
              <h3 className="text-2xl font-bold">{totalMeetings}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Notes</p>
              <h3 className="text-2xl font-bold">{completedNotes}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <BarChart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              <h3 className="text-2xl font-bold">{completionPercentage}%</h3>
            </div>
          </div>

          <div className="h-2 bg-gray-200 rounded-full mt-4">
            <div 
              className="h-2 bg-blue-600 rounded-full" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
