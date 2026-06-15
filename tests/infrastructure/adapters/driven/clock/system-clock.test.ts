import { describe, it, expect } from 'vitest';
import { SystemClock } from '../../../../../src/infrastructure/adapters/driven/clock/system-clock.js';
import { FixedClock } from '../../../../helpers/fixed-clock.js';

describe('SystemClock', () => {
  it('returns a Date close to the real wall clock', () => {
    const before = Date.now();
    const now = new SystemClock().now();

    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe('FixedClock', () => {
  it('always returns the same instant', () => {
    const fixed = new Date('2026-06-10T00:00:00Z');
    const clock = new FixedClock(fixed);

    expect(clock.now()).toBe(fixed);
    expect(clock.now()).toBe(fixed);
  });
});
