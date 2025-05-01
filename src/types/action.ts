
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
