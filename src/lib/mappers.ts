
import { ActionItem } from "@/types/action";

type DatabaseAction = {
  id: string;
  description: string;
  department: string;
  meeting_date: string;
  priority: string;
  owner_email: string;
  completed: boolean;
  progress_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  created_by: string;
};

export function mapDatabaseActionToActionItem(dbAction: DatabaseAction): ActionItem {
  return {
    id: dbAction.id,
    description: dbAction.description,
    department: dbAction.department as any,
    meetingDate: dbAction.meeting_date,
    priority: dbAction.priority as any,
    ownerEmail: dbAction.owner_email,
    completed: dbAction.completed,
    progressStatus: dbAction.progress_status as any,
    notes: dbAction.notes || "",
    createdAt: dbAction.created_at,
    updatedAt: dbAction.updated_at,
    dueDate: dbAction.due_date
  };
}

export function mapActionItemToDatabaseAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Omit<DatabaseAction, 'id' | 'created_at' | 'updated_at'> {
  return {
    description: action.description,
    department: action.department,
    meeting_date: action.meetingDate,
    priority: action.priority,
    owner_email: action.ownerEmail,
    completed: action.completed,
    progress_status: action.progressStatus,
    notes: action.notes,
    due_date: action.dueDate,
    created_by: "" // This will be set by the server
  };
}
