import { z } from 'zod';
import type { RateProvider } from '../../../../domain/ports/rate-provider.js';

const HISTORICAL_URL = 'https://openexchangerates.org/api/historical';

/** Shape of a successful Open Exchange Rates historical response (the bits we use). */
const HistoricalSchema = z.object({
  base: z.string(),
  rates: z.record(z.string(), z.number()),
});

type RateTable = Record<string, number>;

/**
 * Driven adapter for the Open Exchange Rates API.
 *
 * Implements the domain's {@link RateProvider} port using the historical
 * endpoint. The free plan always quotes against USD (1 USD = rates[X] of X),
 * so the rate of `currency` in the policy's base currency is derived as
 * `rates[base] / rates[currency]` — which reduces to `1 / rates[currency]`
 * when the base is USD.
 *
 * The full rate table for a given date is fetched once and memoized, so many
 * expenses sharing a date trigger a single network call (avoids the N+1
 * problem when validating a batch).
 */
export class OpenExchangeRatesProvider implements RateProvider {
  private readonly tablesByDate = new Map<string, Promise<RateTable>>();

  public constructor(
    private readonly appId: string,
    private readonly baseCurrency: string = 'USD',
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  public async getRate(currency: string, date: string): Promise<number> {
    if (currency === this.baseCurrency) {
      return 1;
    }

    const rates = await this.fetchTable(date);

    const baseRate = rates[this.baseCurrency];
    const currencyRate = rates[currency];
    if (baseRate === undefined || currencyRate === undefined) {
      throw new Error(`No rate for ${currency}->${this.baseCurrency} on ${date}.`);
    }

    return baseRate / currencyRate;
  }

  /** Fetches (and memoizes) the rate table for a date. Failed fetches are not cached. */
  private fetchTable(date: string): Promise<RateTable> {
    const cached = this.tablesByDate.get(date);
    if (cached) {
      return cached;
    }

    const pending = this.requestTable(date).catch((error: unknown) => {
      this.tablesByDate.delete(date);
      throw error;
    });
    this.tablesByDate.set(date, pending);

    return pending;
  }

  private async requestTable(date: string): Promise<RateTable> {
    const url = `${HISTORICAL_URL}/${date}.json?app_id=${this.appId}`;
    const response = await this.fetchFn(url);

    if (!response.ok) {
      throw new Error(
        `Open Exchange Rates request failed for ${date}: ${response.status} ${response.statusText}.`,
      );
    }

    const body: unknown = await response.json();
    return HistoricalSchema.parse(body).rates;
  }
}
