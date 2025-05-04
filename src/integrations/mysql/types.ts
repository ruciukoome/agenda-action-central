
/**
 * MySQL DATABASE TYPES
 * -------------------
 * Defines types for MySQL database tables and operations
 */

export type Priority = "high" | "medium" | "low";
export type ProgressStatus = "Not Started" | "25%" | "50%" | "75%" | "100%";
export type Department = 
  | "NTSA/KRA" 
  | "Biashara" 
  | "Agribusiness" 
  | "Business Development & Strategy" 
  | "Finance" 
  | "ICT" 
  | "Credit" 
  | "Collections & Settlements" 
  | "Operations" 
  | "Sales Support & Data" 
  | "Call Centre" 
  | "Delinquency" 
  | "Legal" 
  | "RISK & COMPLIANCE" 
  | "HR & Admin" 
  | "Customer Experience & Marketing" 
  | "Asset Finance" 
  | "Checkoff & Personal Loans";

export interface DbAction {
  id: string;
  description: string;
  department: Department;
  meeting_date: string;
  priority: Priority;
  owner_email: string;
  completed: boolean;
  progress_status: ProgressStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  user_id: string;
}

export interface DbProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Mapping functions (similar to what you have in Supabase)
export function mapDbActionToActionItem(action: DbAction): any {
  return {
    id: action.id,
    description: action.description,
    department: action.department,
    meetingDate: action.meeting_date,
    priority: action.priority,
    ownerEmail: action.owner_email,
    completed: action.completed,
    progressStatus: action.progress_status,
    notes: action.notes || "",
    createdAt: action.created_at,
    updatedAt: action.updated_at,
    dueDate: action.due_date
  };
}

export function mapActionItemToDbAction(action: any, userId: string): Omit<DbAction, "id" | "created_at" | "updated_at"> {
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
    user_id: userId
  };
}
