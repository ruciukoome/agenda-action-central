
import { ActionItem } from "@/types/action";
import { mockActions } from "@/data/mockActions";
import { toast } from "@/components/ui/use-toast";

export async function fetchActions() {
  return mockActions;
}

export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const newAction: ActionItem = {
    id: Date.now().toString(),
    createdAt: now,
    updatedAt: now,
    ...action
  };
  
  console.log("Created new action:", newAction);
  return newAction;
}

export async function updateAction(action: ActionItem) {
  const updatedAction = {
    ...action,
    updatedAt: new Date().toISOString()
  };
  
  console.log("Updated action:", updatedAction);
  return updatedAction;
}

export async function deleteAction(id: string) {
  console.log("Deleted action:", id);
}

export function subscribeToActions(callback: (action: ActionItem) => void) {
  // Mock subscription just returns cleanup function
  return {
    unsubscribe: () => {}
  };
}
