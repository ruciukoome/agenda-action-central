import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { clearStaleBodyPointerEvents, scheduleBodyPointerEventsReset } from '@/lib/pointer-events-guard';

export function PointerEventsGuard() {
  const location = useLocation();

  useEffect(() => {
    scheduleBodyPointerEventsReset();
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handlePointerAttempt = () => clearStaleBodyPointerEvents();
    const handleFocus = () => scheduleBodyPointerEventsReset();
    const observer = new MutationObserver(() => scheduleBodyPointerEventsReset());

    window.addEventListener('pointerdown', handlePointerAttempt, true);
    window.addEventListener('touchstart', handlePointerAttempt, true);
    window.addEventListener('focusin', handleFocus, true);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });

    return () => {
      window.removeEventListener('pointerdown', handlePointerAttempt, true);
      window.removeEventListener('touchstart', handlePointerAttempt, true);
      window.removeEventListener('focusin', handleFocus, true);
      observer.disconnect();
    };
  }, []);

  return null;
}