
import { ActionItem } from "@/types/action";
import { Database } from "@/integrations/supabase/types";

/**
 * Database action representation
 * Used for mapping between database and frontend models
 */
export interface DbAction {
  id: string;
  description: string;
  department: Database["public"]["Enums"]["action_department"];
  meeting_date: string;
  priority: Database["public"]["Enums"]["action_priority"];
  owner_email: string;
  completed: boolean;
  progress_status: Database["public"]["Enums"]["action_progress"] | "Continuous";
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
    priority: action.priority,
    ownerEmail: action.owner_email,
    completed: action.completed,
    progressStatus: action.progress_status as any, // Type assertion to handle the Continuous case
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
    priority: action.priority,
    owner_email: action.ownerEmail,
    completed: action.completed,
    progress_status: action.progressStatus as any, // Type assertion to handle the Continuous case
    notes: action.notes,
    due_date: action.dueDate,
    user_id: userId || '' // Ensuring user_id is always provided, using empty string as fallback
  };
}
