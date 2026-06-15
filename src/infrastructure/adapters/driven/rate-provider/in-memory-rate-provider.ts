import type { RateProvider } from '../../../../domain/ports/rate-provider.js';

/**
 * In-memory adapter: returns a fixed rate for every currency and date.
 * A simple stand-in for the real provider when no live rates are needed
 * (defaults to 1, i.e. treat every currency as the base currency).
 */
export class InMemoryRateProvider implements RateProvider {
  public constructor(private readonly rate: number = 1) {}

  public getRate(_currency: string, _date: string): Promise<number> {
    return Promise.resolve(this.rate);
  }
}
