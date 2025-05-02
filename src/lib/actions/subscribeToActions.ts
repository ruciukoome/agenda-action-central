
import { ActionItem } from "@/types/action";
import { supabase } from "@/integrations/supabase/client";
import { fetchActions } from "./fetchActions";

/**
 * Sets up real-time subscription to action changes in the database
 * Uses Supabase's real-time capabilities
 */
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
