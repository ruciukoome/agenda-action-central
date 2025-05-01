
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionItem } from "@/types/action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isThisWeek, isToday, parseISO, startOfToday } from "date-fns";
import { CalendarClock, CalendarDays, Clock } from "lucide-react";
import { ActionStatusBadge } from "@/components/ActionStatusBadge";

interface UpcomingDeadlinesProps {
  actions: ActionItem[];
  isLoading: boolean;
}

export function UpcomingDeadlines({ actions, isLoading }: UpcomingDeadlinesProps) {
  // Filter for actions due today
  const todayActions = actions.filter(action => {
    if (!action.dueDate || action.completed) return false;
    return isToday(parseISO(action.dueDate));
  });
  
  // Filter for actions due this week (excluding today)
  const thisWeekActions = actions.filter(action => {
    if (!action.dueDate || action.completed) return false;
    const dueDate = parseISO(action.dueDate);
    return isThisWeek(dueDate) && !isToday(dueDate);
  });
  
  // Get most urgent upcoming deadlines
  const upcomingDeadlines = actions
    .filter(action => action.dueDate && !action.completed)
    .sort((a, b) => {
      const dateA = new Date(a.dueDate || "");
      const dateB = new Date(b.dueDate || "");
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
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
        <CardTitle className="text-lg font-medium">Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Due Today</p>
              <h3 className="text-2xl font-bold">{todayActions.length}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Due This Week</p>
              <h3 className="text-2xl font-bold">{thisWeekActions.length}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CalendarClock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
              <h3 className="text-2xl font-bold">{actions.filter(a => !a.completed).length}</h3>
            </div>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingDeadlines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No upcoming deadlines
                  </TableCell>
                </TableRow>
              ) : (
                upcomingDeadlines.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {action.description}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {action.department}
                    </TableCell>
                    <TableCell>
                      {action.dueDate ? format(parseISO(action.dueDate), 'MMM d, yyyy') : 'No date'}
                    </TableCell>
                    <TableCell>
                      <ActionStatusBadge status={action.progressStatus} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
