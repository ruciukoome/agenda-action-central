
import { ActionItem, Department, Priority, ProgressStatus } from "@/types/action";

export const mockActions: ActionItem[] = [
  {
    id: "1",
    description: "Update security protocols for cloud infrastructure",
    department: "Engineering",
    meetingDate: "2025-04-15T10:00:00Z",
    priority: "high",
    ownerEmail: "james.wilson@example.com",
    completed: false,
    progressStatus: "25%",
    notes: "Coordinate with security team for recommendations",
    createdAt: "2025-04-15T11:30:00Z",
    updatedAt: "2025-04-16T09:15:00Z",
    dueDate: "2025-04-30T17:00:00Z"
  },
  {
    id: "2",
    description: "Prepare Q2 marketing campaign proposal",
    department: "Marketing",
    meetingDate: "2025-04-10T14:00:00Z",
    priority: "medium",
    ownerEmail: "sarah.johnson@example.com",
    completed: false,
    progressStatus: "50%",
    notes: "Include budget estimates and timeline",
    createdAt: "2025-04-10T16:00:00Z",
    updatedAt: "2025-04-17T11:20:00Z",
    dueDate: "2025-04-25T17:00:00Z"
  },
  {
    id: "3",
    description: "Conduct quarterly financial review",
    department: "Finance",
    meetingDate: "2025-04-05T09:30:00Z",
    priority: "high",
    ownerEmail: "michael.brown@example.com",
    completed: true,
    progressStatus: "100%",
    notes: "Present findings at next leadership meeting",
    createdAt: "2025-04-05T11:45:00Z",
    updatedAt: "2025-04-18T14:30:00Z",
    dueDate: "2025-04-20T17:00:00Z"
  },
  {
    id: "4",
    description: "Update employee onboarding materials",
    department: "HR",
    meetingDate: "2025-04-12T13:00:00Z",
    priority: "low",
    ownerEmail: "jennifer.davis@example.com",
    completed: false,
    progressStatus: "75%",
    notes: "Include new benefit information and training modules",
    createdAt: "2025-04-12T15:30:00Z",
    updatedAt: "2025-04-19T10:15:00Z",
    dueDate: "2025-05-05T17:00:00Z"
  },
  {
    id: "5",
    description: "Develop prototype for new mobile app feature",
    department: "Product",
    meetingDate: "2025-04-18T11:00:00Z",
    priority: "high",
    ownerEmail: "david.miller@example.com",
    completed: false,
    progressStatus: "Not Started",
    notes: "Focus on user experience and accessibility",
    createdAt: "2025-04-18T13:00:00Z",
    updatedAt: "2025-04-18T13:00:00Z",
    dueDate: "2025-05-10T17:00:00Z"
  },
  {
    id: "6",
    description: "Finalize vendor contracts for Q3",
    department: "Operations",
    meetingDate: "2025-04-14T10:30:00Z",
    priority: "medium",
    ownerEmail: "robert.taylor@example.com",
    completed: false,
    progressStatus: "25%",
    notes: "Negotiate better payment terms if possible",
    createdAt: "2025-04-14T12:45:00Z",
    updatedAt: "2025-04-16T16:20:00Z",
    dueDate: "2025-05-15T17:00:00Z"
  },
  {
    id: "7",
    description: "Redesign customer feedback form",
    department: "Design",
    meetingDate: "2025-04-16T15:00:00Z",
    priority: "low",
    ownerEmail: "amanda.white@example.com",
    completed: false,
    progressStatus: "50%",
    notes: "Make sure it's mobile-friendly",
    createdAt: "2025-04-16T17:15:00Z",
    updatedAt: "2025-04-20T09:30:00Z",
    dueDate: "2025-05-01T17:00:00Z"
  }
];

export const getDepartments = (): Department[] => [
  "Engineering", 
  "Marketing", 
  "Sales", 
  "Finance", 
  "HR", 
  "Operations",
  "Product",
  "Design",
  "Customer Success",
  "Other"
];

export const getPriorities = (): Priority[] => ["high", "medium", "low"];

export const getProgressStatuses = (): ProgressStatus[] => [
  "Not Started", "25%", "50%", "75%", "100%"
];
