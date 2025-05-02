
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActionItem } from "@/types/action";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowUp } from "lucide-react";
import { ActionStatusBadge } from "@/components/ActionStatusBadge";
import { formatDate } from "@/utils/emailUtils";

interface UpcomingDeadlinesProps {
  actions: ActionItem[];
  isLoading: boolean;
}

export function UpcomingDeadlines({ actions, isLoading }: UpcomingDeadlinesProps) {
  const navigate = useNavigate();
  const [limit, setLimit] = useState(5);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const upcomingDeadlines = useMemo(() => {
    return actions
      .filter(action => {
        // Only include actions with due dates that aren't completed
        if (!action.dueDate || action.completed) return false;
        
        const dueDate = new Date(action.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        // Due today or in the future and within the next 7 days
        return dueDate >= today && dueDate <= sevenDaysFromNow;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dueDate || 0);
        const dateB = new Date(b.dueDate || 0);
        return dateA.getTime() - dateB.getTime();
      });
  }, [actions]);
  
  const dueTodayCount = useMemo(() => {
    return actions.filter(action => {
      if (!action.dueDate || action.completed) return false;
      
      const dueDate = new Date(action.dueDate);
      const todayDate = new Date();
      
      return dueDate.getDate() === todayDate.getDate() &&
             dueDate.getMonth() === todayDate.getMonth() &&
             dueDate.getFullYear() === todayDate.getFullYear();
    }).length;
  }, [actions]);
  
  const dueThisWeekCount = useMemo(() => {
    return upcomingDeadlines.length;
  }, [upcomingDeadlines]);

  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center space-x-4 py-3">
          <div className="flex-1">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </>
  );
  
  const displayedDeadlines = upcomingDeadlines.slice(0, limit);
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Upcoming Deadlines</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/manage-actions')}
        >
          See All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-600 font-medium">Due Today</p>
              <p className="text-2xl font-bold">{dueTodayCount}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="text-sm text-amber-600 font-medium">Due This Week</p>
              <p className="text-2xl font-bold">{dueThisWeekCount}</p>
            </div>
            <div className="bg-amber-100 p-2 rounded-full">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="divide-y">
          {isLoading ? (
            renderSkeletons()
          ) : displayedDeadlines.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No upcoming deadlines within the next 7 days</p>
            </div>
          ) : (
            <>
              {displayedDeadlines.map((action) => {
                const dueDate = new Date(action.dueDate || "");
                const isToday = 
                  dueDate.getDate() === today.getDate() &&
                  dueDate.getMonth() === today.getMonth() &&
                  dueDate.getFullYear() === today.getFullYear();
                
                return (
                  <div key={action.id} className="py-3">
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-1">{action.description}</h4>
                        <ActionStatusBadge type="priority" value={action.priority} />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{action.department}</span>
                          <ActionStatusBadge type="progress" value={action.progressStatus} />
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className={`h-3 w-3 mr-1 ${isToday ? 'text-red-500' : 'text-amber-500'}`} />
                          <span className={`text-xs font-medium ${isToday ? 'text-red-500' : 'text-amber-500'}`}>
                            {formatDate(action.dueDate || "")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {upcomingDeadlines.length > limit && (
                <div className="pt-3 flex justify-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLimit(prev => prev + 5)}
                    className="flex items-center text-xs"
                  >
                    Show More <ArrowUp className="ml-1 h-3 w-3 rotate-180" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
