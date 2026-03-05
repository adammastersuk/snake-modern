'use client';

import { ReactNode, useEffect, useRef } from 'react';

interface MobileDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function MobileDrawer({ open, title, onClose, children }: MobileDrawerProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusables = sheetRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const first = sheetRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    first?.focus();

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] md:hidden" aria-modal="true" role="dialog" aria-label={title}>
      <button className="absolute inset-0 bg-black/55" aria-label="Close settings" onClick={onClose} />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 max-h-[78vh] w-full max-w-full rounded-t-3xl border-t border-white/15 bg-slate-950/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
      >
        <button
          type="button"
          className="mx-auto mb-3 block h-3 w-20 rounded-full bg-transparent"
          aria-label="Swipe down to close settings"
          onTouchStart={(e) => {
            startYRef.current = e.changedTouches[0].clientY;
          }}
          onTouchEnd={(e) => {
            if (startYRef.current === null) return;
            const delta = e.changedTouches[0].clientY - startYRef.current;
            if (delta > 60) onClose();
            startYRef.current = null;
          }}
        >
          <span className="mx-auto block h-1.5 w-12 rounded-full bg-white/30" aria-hidden="true" />
        </button>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className="rounded-lg border border-white/20 px-3 py-1.5 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="max-h-[62vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
