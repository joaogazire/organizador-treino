import { describe, expect, it } from 'vitest';
import { daysAround } from '../src/engine/dates';

describe('daysAround', () => {
  it('começa na segunda de N semanas antes e termina no domingo de N semanas depois', () => {
    const d = daysAround('2026-10-23', 1, 1); // sexta
    expect(d[0]).toBe('2026-10-12');
    expect(d[d.length - 1]).toBe('2026-11-01');
    expect(d).toHaveLength(21);
    expect(d).toContain('2026-10-23');
  });
});
