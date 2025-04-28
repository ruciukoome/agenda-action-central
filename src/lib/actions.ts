import { ActionItem } from "@/types/action";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { sendActionNotification } from "@/lib/notifications";

export async function fetchActions() {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching actions:', error);
    throw error;
  }

  return data.map(action => ({
    ...action,
    id: action.id,
    meetingDate: action.meeting_date,
    ownerEmail: action.owner_email,
    progressStatus: action.progress_status,
    createdAt: action.created_at,
    updatedAt: action.updated_at,
    dueDate: action.due_date
  })) as ActionItem[];
}

export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

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
      user_id: userData.user.id
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating action:', error);
    throw error;
  }

  const createdAction = {
    ...data,
    id: data.id,
    meetingDate: data.meeting_date,
    ownerEmail: data.owner_email,
    progressStatus: data.progress_status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    dueDate: data.due_date
  } as ActionItem;

  try {
    await sendActionNotification(createdAction, "assigned");
  } catch (emailError) {
    console.error('Error sending notification:', emailError);
    toast({
      title: "Action created",
      description: "Action was created but email notification failed to send.",
      variant: "default",
    });
    return createdAction;
  }

  return createdAction;
}

export async function updateAction(action: ActionItem) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

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

  if (error) {
    console.error('Error updating action:', error);
    throw error;
  }

  return {
    ...data,
    id: data.id,
    meetingDate: data.meeting_date,
    ownerEmail: data.owner_email,
    progressStatus: data.progress_status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    dueDate: data.due_date
  } as ActionItem;
}

export async function deleteAction(id: string) {
  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting action:', error);
    throw error;
  }
}

export function subscribeToActions(callback: (action: ActionItem) => void) {
  const channel = supabase
    .channel('actions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'actions'
      },
      (payload) => {
        console.log('Realtime update:', payload);
        fetchActions().then(actions => {
          actions.forEach(callback);
        });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}
