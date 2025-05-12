
import { ActionItem } from "@/types/action";

interface ActionDetailsProps {
  action: ActionItem;
}

export function ActionDetails({ action }: ActionDetailsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">Department:</span>
        <span>{action.department}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium">Priority:</span>
        <span className={`
          ${action.priority === 'high' ? 'text-red-500' : ''} 
          ${action.priority === 'medium' ? 'text-amber-500' : ''} 
          ${action.priority === 'low' ? 'text-green-500' : ''}
        `}>
          {action.priority}
        </span>
      </div>
      {action.dueDate && (
        <div className="flex items-center justify-between">
          <span className="font-medium">Due Date:</span>
          <span>{new Date(action.dueDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}
