
import { ActionItem } from "@/types/action";
import { mockActions } from "@/data/mockActions";
import { toast } from "@/components/ui/use-toast";

// Use a shared in-memory store to maintain actions state across components
let actionStore = [...mockActions];

export async function fetchActions() {
  return actionStore;
}

export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const newAction: ActionItem = {
    id: Date.now().toString(),
    createdAt: now,
    updatedAt: now,
    ...action
  };
  
  // Add the new action to our store
  actionStore = [newAction, ...actionStore];
  
  console.log("Created new action:", newAction);
  return newAction;
}

export async function updateAction(action: ActionItem) {
  const updatedAction = {
    ...action,
    updatedAt: new Date().toISOString()
  };
  
  // Update the action in our store
  actionStore = actionStore.map(a => 
    a.id === action.id ? updatedAction : a
  );
  
  console.log("Updated action:", updatedAction);
  return updatedAction;
}

export async function deleteAction(id: string) {
  // Remove the action from our store
  actionStore = actionStore.filter(a => a.id !== id);
  console.log("Deleted action:", id);
}

export function subscribeToActions(callback: (action: ActionItem) => void) {
  // Mock subscription just returns cleanup function
  return {
    unsubscribe: () => {}
  };
}
