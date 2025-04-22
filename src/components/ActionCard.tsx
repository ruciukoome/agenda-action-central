
import { ActionItem } from "@/types/action";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionStatusBadge } from "@/components/ActionStatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate, getDueStatus } from "@/utils/emailUtils";
import { Calendar, Clock, Mail, FileText } from "lucide-react";

interface ActionCardProps {
  action: ActionItem;
  onEdit: (action: ActionItem) => void;
}

export function ActionCard({ action, onEdit }: ActionCardProps) {
  const dueStatus = action.dueDate ? getDueStatus(action.dueDate) : "none";
  
  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2">{action.description}</CardTitle>
            <CardDescription className="flex items-center">
              <Mail className="h-3.5 w-3.5 mr-1" />
              {action.ownerEmail}
            </CardDescription>
          </div>
          <ActionStatusBadge type="priority" value={action.priority} />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Meeting: {formatDate(action.meetingDate)}
          </div>
          {action.dueDate && (
            <div className="flex items-center text-sm">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span className={
                dueStatus === "overdue" 
                  ? "text-red-500 font-medium" 
                  : dueStatus === "upcoming" 
                    ? "text-amber-500 font-medium" 
                    : "text-muted-foreground"
              }>
                Due: {formatDate(action.dueDate)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 items-center mb-2">
          <span className="text-sm font-medium">Department:</span>
          <span className="text-sm">{action.department}</span>
        </div>
        
        {action.notes && (
          <div className="flex items-start mt-2 gap-1">
            <FileText className="h-3.5 w-3.5 mt-0.5" />
            <span className="text-sm line-clamp-2">{action.notes}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex space-x-2">
          <ActionStatusBadge type="progress" value={action.progressStatus} />
          <ActionStatusBadge type="completion" value={action.completed.toString()} />
        </div>
        <Button size="sm" variant="outline" onClick={() => onEdit(action)}>
          Update
        </Button>
      </CardFooter>
    </Card>
  );
}
