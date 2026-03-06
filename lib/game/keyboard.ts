const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

type KeyboardTarget = {
  tagName?: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => unknown;
} | null;

export const isTypingTarget = (target: KeyboardTarget) => {
  if (!target) return false;

  if (target.isContentEditable) return true;

  if (target.tagName && EDITABLE_TAGS.has(target.tagName.toUpperCase())) {
    return true;
  }

  if (typeof target.closest === 'function') {
    return Boolean(target.closest('[contenteditable="true"]'));
  }

  return false;
};

