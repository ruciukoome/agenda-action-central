
import { ActionItem, Department, Priority, ProgressStatus } from "@/types/action";

/**
 * Database action representation
 * Used for mapping between database and frontend models
 */
export interface DbAction {
  id: string;
  description: string;
  department: Department;
  meeting_date: string;
  meeting_title?: string | null;
  priority: Priority;
  owner_email: string;
  completed: boolean;
  progress_status: ProgressStatus;
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
    department: action.department,
    meetingDate: action.meeting_date,
    meetingTitle: action.meeting_title || undefined,
    priority: action.priority,
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
export function mapActionItemToDbAction(action: ActionItem, userId?: string): Omit<DbAction, "id" | "created_at" | "updated_at"> {
  return {
    description: action.description,
    department: action.department,
    meeting_date: action.meetingDate,
    meeting_title: action.meetingTitle || null,
    priority: action.priority,
    owner_email: action.ownerEmail,
    completed: action.completed,
    progress_status: action.progressStatus as any,
    notes: action.notes,
    due_date: action.dueDate,
    user_id: userId || ''
  };
}
