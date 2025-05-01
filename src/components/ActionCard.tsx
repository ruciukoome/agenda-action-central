
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
          <div className="space-y-1 max-w-[80%]">
            <CardTitle className="line-clamp-2 text-base">{action.description}</CardTitle>
            <CardDescription className="flex items-center text-xs truncate">
              <Mail className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{action.ownerEmail}</span>
            </CardDescription>
          </div>
          <ActionStatusBadge type="priority" value={action.priority} />
        </div>
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center text-xs text-muted-foreground overflow-hidden">
            <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">Meeting: {formatDate(action.meetingDate)}</span>
          </div>
          {action.dueDate && (
            <div className="flex items-center text-xs overflow-hidden">
              <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className={`truncate ${
                dueStatus === "overdue" 
                  ? "text-red-500 font-medium" 
                  : dueStatus === "upcoming" 
                    ? "text-amber-500 font-medium" 
                    : "text-muted-foreground"
              }`}>
                Due: {formatDate(action.dueDate)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 items-center overflow-hidden">
          <span className="text-xs font-medium flex-shrink-0">Department:</span>
          <span className="text-xs truncate">{action.department}</span>
        </div>
        
        {action.notes && (
          <div className="flex items-start gap-1">
            <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span className="text-xs line-clamp-2">{action.notes}</span>
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
