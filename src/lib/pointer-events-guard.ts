const OPEN_INTERACTION_LAYER_SELECTOR = [
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[data-radix-popper-content-wrapper] [data-state="open"]',
  '[data-radix-menu-content][data-state="open"]',
  '[data-radix-select-content][data-state="open"]',
].join(',');

export function clearStaleBodyPointerEvents() {
  if (typeof document === 'undefined') return;

  const bodyHasPointerLock = document.body.style.pointerEvents === 'none';
  if (!bodyHasPointerLock) return;

  const hasOpenLayer = document.querySelector(OPEN_INTERACTION_LAYER_SELECTOR);
  if (hasOpenLayer) return;

  document.body.style.pointerEvents = '';
  document.documentElement.style.pointerEvents = '';
}

export function scheduleBodyPointerEventsReset() {
  if (typeof window === 'undefined') return;

  [0, 50, 150, 300, 600].forEach((delay) => {
    window.setTimeout(clearStaleBodyPointerEvents, delay);
  });
}