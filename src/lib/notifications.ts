
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";

export async function sendActionNotification(action: ActionItem, type: "assigned" | "updated") {
  const response = await fetch(
    "https://mdwrmfqjxakhpwmfyvft.functions.supabase.co/send-action-notification",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({ action, type })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send notification");
  }

  return response.json();
}
