import { describe, expect, it } from 'vitest';
import { __testables, validateScore } from '@/lib/leaderboard';

describe('leaderboard submission validation', () => {
  it('detects short wrap/practice score columns', () => {
    const columns = __testables.resolveScoreColumnsFromNames(new Set(['id', 'wrap', 'practice']));
    expect(columns).toEqual({ wrap: 'wrap', practice: 'practice', variant: 'short' });
  });

  it('accepts valid final run score payloads without replay', () => {
    const validated = validateScore({
      score: 120,
      length: 14,
      difficulty: 'classic',
      mode: 'retro',
      wrapAround: false,
      practiceMode: false,
      name: 'PlayerOne'
    });

    expect(validated.score).toBe(120);
    expect(validated.length).toBe(14);
    expect(validated.name).toBe('PlayerOne');
    expect(validated.wrapAround).toBe(false);
    expect(validated.practiceMode).toBe(false);
  });

  it('rejects invalid score and length', () => {
    expect(() =>
      validateScore({
        score: 0,
        length: 14,
        difficulty: 'classic',
        mode: 'modern',
        wrapAround: false,
        practiceMode: false
      })
    ).toThrow('Invalid score');

    expect(() =>
      validateScore({
        score: 100,
        length: 1,
        difficulty: 'classic',
        mode: 'modern',
        wrapAround: false,
        practiceMode: false
      })
    ).toThrow('Invalid length');
  });

  it('rejects names longer than 20 chars', () => {
    expect(() =>
      validateScore({
        score: 100,
        length: 12,
        difficulty: 'classic',
        mode: 'modern',
        wrapAround: false,
        practiceMode: false,
        name: '123456789012345678901'
      })
    ).toThrow('Name must be 20 characters or fewer.');
  });
});
