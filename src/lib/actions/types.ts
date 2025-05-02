
import { ActionItem } from "@/types/action";

/**
 * Database action representation
 * Used for mapping between database and frontend models
 */
export interface DbAction {
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
  user_id: string;
}

/**
 * Maps database action to frontend ActionItem
 */
export function mapDbActionToActionItem(action: DbAction): ActionItem {
  return {
    id: action.id,
    description: action.description,
    department: action.department as any,
    meetingDate: action.meeting_date,
    priority: action.priority as any,
    ownerEmail: action.owner_email,
    completed: action.completed,
    progressStatus: action.progress_status as any,
    notes: action.notes || "",
    createdAt: action.created_at,
    updatedAt: action.updated_at,
    dueDate: action.due_date
  };
}

/**
 * Maps frontend ActionItem to database format
 */
export function mapActionItemToDbAction(action: ActionItem, userId?: string): Partial<DbAction> {
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
    ...(userId ? { user_id: userId } : {})
  };
}
