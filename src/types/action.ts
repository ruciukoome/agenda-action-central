
export type Priority = "high" | "medium" | "low";

export type ProgressStatus = "Not Started" | "25%" | "50%" | "75%" | "100%" | "Continuous";

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
  meetingTitle?: string;
  priority: Priority;
  ownerEmail: string;
  completed: boolean;
  progressStatus: ProgressStatus;
  notes: string;
  createdAt: string; // ISO format date string
  updatedAt: string; // ISO format date string
  dueDate?: string; // ISO format date string (optional)
  ccEmails?: string[]; // CC recipients (optional)
  bccEmails?: string[]; // BCC recipients (optional)
  meetingId?: string | null; // Optional link to a shared meeting (for ICS calendar invites)
}

export interface Meeting {
  id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string; // ISO
  endAt: string;   // ISO
  timezone: string;
  icsUid: string;
  createdAt: string;
  updatedAt: string;
}

// Utility functions for email parsing
export function parseEmailList(emailString: string): string[] {
  if (!emailString?.trim()) return [];
  return emailString
    .split(/[,;]/)
    .map(email => email.trim())
    .filter(email => email && validateEmail(email));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatEmailList(emails: string[]): string {
  return emails.join(', ');
}
