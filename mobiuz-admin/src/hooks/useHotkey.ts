import { useEffect } from 'react';

/**
 * Bitta harfli tezkor tugma (masalan "n" yoki "/").
 * Input/textarea ichida yozayotganda va Ctrl/Alt bosilganda ishlamaydi.
 */
export function useHotkey(key: string, handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;

      if (e.key.toLowerCase() === key) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [key, handler, enabled]);
}