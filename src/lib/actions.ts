
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";

export async function fetchActions() {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('actions')
    .insert([{
      description: action.description,
      department: action.department,
      meeting_date: action.meetingDate,
      priority: action.priority,
      owner_email: action.ownerEmail,
      completed: action.completed,
      progress_status: action.progressStatus,
      notes: action.notes,
      due_date: action.dueDate,
      created_by: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateAction(action: ActionItem) {
  const { data, error } = await supabase
    .from('actions')
    .update({
      description: action.description,
      department: action.department,
      meeting_date: action.meetingDate,
      priority: action.priority,
      owner_email: action.ownerEmail,
      completed: action.completed,
      progress_status: action.progressStatus,
      notes: action.notes,
      due_date: action.dueDate
    })
    .eq('id', action.id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteAction(id: string) {
  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export function subscribeToActions(callback: (action: ActionItem) => void) {
  return supabase
    .channel('actions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'actions'
      },
      (payload) => callback(payload.new as ActionItem)
    )
    .subscribe();
}
