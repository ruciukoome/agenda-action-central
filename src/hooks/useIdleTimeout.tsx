
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from '@/lib/toast-wrapper';

// Default timeout is 10 minutes (600000 milliseconds)
const DEFAULT_IDLE_TIMEOUT = 10 * 60 * 1000;
// Warning will show 1 minute before timeout
const WARNING_BEFORE_TIMEOUT = 60 * 1000;

export function useIdleTimeout(idleTime = DEFAULT_IDLE_TIMEOUT) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const idleTimeoutRef = useRef<number | null>(null);
  const warningTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Only set up timeout if user is logged in
    if (!user) return;
    
    const resetIdleTimeout = () => {
      // Clear existing timeouts
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
      if (warningTimeoutRef.current) window.clearTimeout(warningTimeoutRef.current);
      
      // Set warning timeout to display toast notification before logout
      warningTimeoutRef.current = window.setTimeout(() => {
        toast.warning("Session timeout warning", {
          description: "You'll be logged out in 1 minute due to inactivity.",
          duration: 10000, // Show for 10 seconds
        });
      }, idleTime - WARNING_BEFORE_TIMEOUT);
      
      // Set logout timeout
      idleTimeoutRef.current = window.setTimeout(() => {
        console.log("User idle timeout reached, logging out");
        
        // Sign out and redirect to login
        signOut().then(() => {
          toast.info("Session expired", {
            description: "You were logged out due to inactivity.",
          });
          navigate('/auth');
        }).catch((error) => {
          console.error("Error signing out:", error);
          navigate('/auth');
        });
      }, idleTime);
    };

    // Events to track user activity
    const events = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'wheel', 'click'
    ];
    
    // Reset the timeout on user activity
    const activityHandler = () => {
      resetIdleTimeout();
    };
    
    // Set up event listeners for all specified events
    events.forEach(event => {
      document.addEventListener(event, activityHandler, false);
    });
    
    // Initialize timeout
    resetIdleTimeout();
    
    // Clean up event listeners and timeouts
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler);
      });
      
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
      if (warningTimeoutRef.current) window.clearTimeout(warningTimeoutRef.current);
    };
  }, [idleTime, navigate, signOut, user]);
}
