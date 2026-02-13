import { useEffect } from 'react';
import { useUndoRedo } from '@/hooks/useUndoRedo';

/**
 * Global keyboard shortcut listener for Undo/Redo.
 * Mount once at app root level.
 */
export function UndoRedoProvider({ children }: { children: React.ReactNode }) {
  const { undo, redo } = useUndoRedo();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      if (!isModifier) return;

      // Don't intercept when user is typing in inputs
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return <>{children}</>;
}
