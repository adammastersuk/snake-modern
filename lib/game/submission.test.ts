import { describe, expect, it } from 'vitest';
import { resolveSubmittedScore } from '@/lib/game/submission';

describe('submission score resolution', () => {
  it('always uses completed run score when backend agrees', () => {
    expect(resolveSubmittedScore(190, 190)).toBe(190);
    expect(resolveSubmittedScore(190, undefined)).toBe(190);
  });

  it('throws when backend reports a different score', () => {
    expect(() => resolveSubmittedScore(190, 10)).toThrow(
      'Score mismatch after submission (expected 190, got 10).'
    );
  });
});
