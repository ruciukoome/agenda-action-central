
export type Priority = "high" | "medium" | "low";

export type ProgressStatus = "Not Started" | "25%" | "50%" | "75%" | "100%";

export type Department = 
  | "Engineering" 
  | "Marketing" 
  | "Sales" 
  | "Finance" 
  | "HR" 
  | "Operations"
  | "Product"
  | "Design"
  | "Customer Success"
  | "Other";

export interface ActionItem {
  id: string;
  description: string;
  department: Department;
  meetingDate: string; // ISO format date string
  priority: Priority;
  ownerEmail: string;
  completed: boolean;
  progressStatus: ProgressStatus;
  notes: string;
  createdAt: string; // ISO format date string
  updatedAt: string; // ISO format date string
  dueDate?: string; // ISO format date string (optional)
}
