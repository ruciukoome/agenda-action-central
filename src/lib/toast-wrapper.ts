
import { toast as sonnerToast } from "sonner";
import { toast as shadcnToast } from "@/hooks/use-toast";

// Get toast settings from localStorage directly to avoid context dependency
function getToastSettings() {
  const saved = localStorage.getItem('toastsEnabled');
  return saved !== null ? JSON.parse(saved) : true;
}

// Custom toast wrapper that respects the toggle setting
export const toast = {
  // Basic toast methods
  success: (title: string, options?: { description?: string; duration?: number }) => {
    if (!getToastSettings()) return;
    sonnerToast.success(title, options);
  },
  
  error: (title: string, options?: { description?: string; duration?: number }) => {
    if (!getToastSettings()) return;
    sonnerToast.error(title, options);
  },
  
  info: (title: string, options?: { description?: string; duration?: number }) => {
    if (!getToastSettings()) return;
    sonnerToast(title, options);
  },
  
  warning: (title: string, options?: { description?: string; duration?: number }) => {
    if (!getToastSettings()) return;
    sonnerToast.warning(title, options);
  },
  
  loading: (title: string, options?: { id?: string; duration?: number }) => {
    if (!getToastSettings()) return;
    sonnerToast.loading(title, options);
  },
  
  // Default toast
  default: (title: string, options?: { description?: string; duration?: number }) => {
    if (!getToastSettings()) return;
    sonnerToast(title, options);
  },
  
  // Dismiss method
  dismiss: (toastId?: string) => {
    if (toastId) sonnerToast.dismiss(toastId);
    else sonnerToast.dismiss();
  },
  
  // For shadcn compatibility
  shadcn: {
    success: (title: string, options?: { description?: string }) => {
      if (!getToastSettings()) return;
      shadcnToast.success(title, options);
    },
    error: (title: string, options?: { description?: string }) => {
      if (!getToastSettings()) return;
      shadcnToast.error(title, options);
    }
  }
};
