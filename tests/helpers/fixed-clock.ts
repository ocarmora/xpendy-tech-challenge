import type { Clock } from '../../src/domain/ports/clock.js';

/** Test adapter: always returns the same instant, for deterministic evaluations. */
export class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {}

  now(): Date {
    return this.fixed;
  }
}
