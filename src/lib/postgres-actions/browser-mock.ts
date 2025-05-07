
import { ActionItem } from "@/types/action";
import { toast } from "@/components/ui/use-toast";

/**
 * This file provides browser-compatible mock implementations of the PostgreSQL actions.
 * In a browser environment, we can't connect directly to PostgreSQL,
 * so we provide alternative implementations (e.g., using localStorage, mock data, or API calls).
 */

export async function mockFetchActions(userId?: string): Promise<ActionItem[]> {
  console.log("Using browser mock for fetchActions", { userId });
  toast({
    title: "Database Operation",
    description: "PostgreSQL operations are not available in browser. Please set up the server environment.",
    variant: "destructive",
  });
  return [];
}

export async function mockCreateAction(
  action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<ActionItem> {
  console.log("Using browser mock for createAction", { action, userId });
  toast({
    title: "Database Operation",
    description: "PostgreSQL operations are not available in browser. Please set up the server environment.",
    variant: "destructive",
  });
  
  // Return a dummy action
  return {
    id: "mock-" + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...action
  };
}

export async function mockUpdateAction(
  actionId: string,
  actionData: Partial<ActionItem>,
  userId: string
): Promise<ActionItem> {
  console.log("Using browser mock for updateAction", { actionId, actionData, userId });
  toast({
    title: "Database Operation",
    description: "PostgreSQL operations are not available in browser. Please set up the server environment.",
    variant: "destructive",
  });
  
  // Return a dummy updated action
  return {
    id: actionId,
    description: actionData.description || "Mock Description",
    department: actionData.department || "Finance",
    meetingDate: actionData.meetingDate || new Date().toISOString(),
    priority: actionData.priority || "medium",
    ownerEmail: actionData.ownerEmail || "user@example.com",
    completed: actionData.completed ?? false,
    progressStatus: actionData.progressStatus || "Not Started",
    notes: actionData.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: actionData.dueDate
  };
}

export async function mockDeleteAction(
  actionId: string,
  userId: string
): Promise<void> {
  console.log("Using browser mock for deleteAction", { actionId, userId });
  toast({
    title: "Database Operation",
    description: "PostgreSQL operations are not available in browser. Please set up the server environment.",
    variant: "destructive",
  });
}
