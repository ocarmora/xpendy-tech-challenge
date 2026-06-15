import { describe, it, expect, vi } from 'vitest';
import { OpenExchangeRatesProvider } from '../../../../../src/infrastructure/adapters/driven/rate-provider/open-exchange-rates-provider.js';

/** Builds a fetch stub that returns the given rate table as a successful response. */
function fetchReturning(rates: Record<string, number>, base = 'USD') {
  return vi.fn((_url: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ base, rates }),
    } as unknown as Response),
  );
}

describe('OpenExchangeRatesProvider', () => {
  it('returns 1 for the base currency without hitting the network', async () => {
    const fetchFn = fetchReturning({});
    const provider = new OpenExchangeRatesProvider(
      'app_id',
      'USD',
      fetchFn as unknown as typeof fetch,
    );

    await expect(provider.getRate('USD', '2026-06-01')).resolves.toBe(1);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('derives base-per-currency from a USD-quoted table', async () => {
    // 1 USD = 1000 CLP  ->  1 CLP = 0.001 USD
    const fetchFn = fetchReturning({ USD: 1, CLP: 1000 });
    const provider = new OpenExchangeRatesProvider(
      'app_id',
      'USD',
      fetchFn as unknown as typeof fetch,
    );

    await expect(provider.getRate('CLP', '2026-06-01')).resolves.toBeCloseTo(0.001, 10);
  });

  it('derives the rate for a non-USD base currency', async () => {
    // base EUR: 1 EUR = 0.9 USD-table-units, 1 USD = 900 CLP -> 1 CLP = 0.9/900 EUR
    const fetchFn = fetchReturning({ USD: 1, EUR: 0.9, CLP: 900 });
    const provider = new OpenExchangeRatesProvider(
      'app_id',
      'EUR',
      fetchFn as unknown as typeof fetch,
    );

    await expect(provider.getRate('CLP', '2026-06-01')).resolves.toBeCloseTo(0.001, 10);
  });

  it('fetches the rate table only once per unique date (avoids N+1)', async () => {
    const fetchFn = fetchReturning({ USD: 1, CLP: 1000, MXN: 17 });
    const provider = new OpenExchangeRatesProvider(
      'app_id',
      'USD',
      fetchFn as unknown as typeof fetch,
    );

    await provider.getRate('CLP', '2026-06-01');
    await provider.getRate('MXN', '2026-06-01');
    await provider.getRate('CLP', '2026-06-01');

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('fetches once per date when dates differ', async () => {
    const fetchFn = fetchReturning({ USD: 1, CLP: 1000 });
    const provider = new OpenExchangeRatesProvider(
      'app_id',
      'USD',
      fetchFn as unknown as typeof fetch,
    );

    await provider.getRate('CLP', '2026-06-01');
    await provider.getRate('CLP', '2026-06-02');

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('throws a clear error on a non-OK HTTP response', async () => {
    const fetchFn = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: true }),
      } as unknown as Response),
    );
    const provider = new OpenExchangeRatesProvider('bad', 'USD', fetchFn);

    await expect(provider.getRate('CLP', '2026-06-01')).rejects.toThrow(/401/);
  });

  it('throws when the requested currency is absent from the table', async () => {
    const fetchFn = fetchReturning({ USD: 1, CLP: 1000 });
    const provider = new OpenExchangeRatesProvider(
      'app_id',
      'USD',
      fetchFn as unknown as typeof fetch,
    );

    await expect(provider.getRate('JPY', '2026-06-01')).rejects.toThrow(/JPY/);
  });

  it('does not cache a failed fetch, allowing a later retry to succeed', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ base: 'USD', rates: { USD: 1, CLP: 1000 } }),
      });
    const provider = new OpenExchangeRatesProvider('app_id', 'USD', fetchFn);

    await expect(provider.getRate('CLP', '2026-06-01')).rejects.toThrow(/503/);
    await expect(provider.getRate('CLP', '2026-06-01')).resolves.toBeCloseTo(0.001, 10);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
