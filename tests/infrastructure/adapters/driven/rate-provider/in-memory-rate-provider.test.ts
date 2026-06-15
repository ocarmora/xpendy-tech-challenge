import { describe, it, expect } from 'vitest';
import { InMemoryRateProvider } from '../../../../../src/infrastructure/adapters/driven/rate-provider/in-memory-rate-provider.js';

describe('InMemoryRateProvider', () => {
  it('returns 1 by default for any currency and date', async () => {
    const provider = new InMemoryRateProvider();

    await expect(provider.getRate('CLP', '2026-06-01')).resolves.toBe(1);
  });

  it('returns the configured fixed rate regardless of currency or date', async () => {
    const provider = new InMemoryRateProvider(0.001);

    await expect(provider.getRate('CLP', '2026-06-01')).resolves.toBe(0.001);
    await expect(provider.getRate('EUR', '2030-12-31')).resolves.toBe(0.001);
  });
});
