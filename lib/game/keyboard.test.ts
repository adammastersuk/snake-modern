import { describe, expect, it } from 'vitest';
import { isTypingTarget } from '@/lib/game/keyboard';

describe('keyboard typing target detection', () => {
  it('treats form controls as typing targets', () => {
    expect(isTypingTarget({ tagName: 'input' })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'select' })).toBe(true);
  });

  it('treats contenteditable elements as typing targets', () => {
    expect(isTypingTarget({ isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ closest: (selector) => (selector === '[contenteditable="true"]' ? {} : null) })).toBe(true);
  });

  it('ignores non-editable targets', () => {
    expect(isTypingTarget({ tagName: 'div', isContentEditable: false, closest: () => null })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
