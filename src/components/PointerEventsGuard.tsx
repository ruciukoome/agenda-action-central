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

    window.addEventListener('pointerdown', handlePointerAttempt, true);
    window.addEventListener('touchstart', handlePointerAttempt, true);
    window.addEventListener('focusin', handleFocus, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerAttempt, true);
      window.removeEventListener('touchstart', handlePointerAttempt, true);
      window.removeEventListener('focusin', handleFocus, true);
    };
  }, []);

  return null;
}