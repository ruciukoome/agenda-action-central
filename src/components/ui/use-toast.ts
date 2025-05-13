
import { toast as sonnerToast } from "sonner";
import { useToast } from "@/hooks/use-toast";

// Re-export the toast functions with consistent API
export const toast = {
  // Basic toast methods
  ...sonnerToast,
  
  // Additional methods that match the shadcn toast API
  error: (title: string, { description }: { description?: string } = {}) => 
    sonnerToast.error(title, { description }),
  success: (title: string, { description }: { description?: string } = {}) => 
    sonnerToast.success(title, { description }),
  info: (title: string, { description }: { description?: string } = {}) => 
    sonnerToast(title, { description }),
  warning: (title: string, { description }: { description?: string } = {}) => 
    sonnerToast.warning(title, { description }),
  
  // For shadcn compatibility
  dismiss: (toastId?: string) => {
    if (toastId) sonnerToast.dismiss(toastId);
    else sonnerToast.dismiss();
  }
};

export { useToast };
