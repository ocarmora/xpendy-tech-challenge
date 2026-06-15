import { ValidateExpenseUseCase } from './application/validate-expense.use-case.js';
import type { ExpenseValidator } from './application/ports/expense-validator.js';
import { AgeRule } from './domain/rules/age-rule.js';
import { CategoryLimitRule } from './domain/rules/category-limit-rule.js';
import { CostCenterRule } from './domain/rules/cost-center-rule.js';
import type { Policy } from './domain/models/policy.js';
import type { RateProvider } from './domain/ports/rate-provider.js';
import type { Clock } from './domain/ports/clock.js';
import { InMemoryRateProvider } from './infrastructure/adapters/driven/rate-provider/in-memory-rate-provider.js';
import { OpenExchangeRatesProvider } from './infrastructure/adapters/driven/rate-provider/open-exchange-rates-provider.js';
import { SystemClock } from './infrastructure/adapters/driven/clock/system-clock.js';

/**
 * Composition root: the only place that knows the concrete adapters and wires
 * them into the use case. Drivers depend on the ExpenseValidator port, not on
 * the concrete implementation returned here.
 */
export function buildExpenseValidator(
  policy: Policy,
  rateProvider: RateProvider = new InMemoryRateProvider(),
  clock: Clock = new SystemClock(),
): ExpenseValidator {
  return new ValidateExpenseUseCase(
    policy,
    [new AgeRule(), new CategoryLimitRule(), new CostCenterRule()],
    rateProvider,
    clock,
  );
}

/**
 * Wires the real Open Exchange Rates provider from the environment. Fails fast
 * with a clear message when the API key is missing, so a misconfigured run does
 * not silently fall back to mocked rates.
 */
export function buildRateProvider(policy: Policy): RateProvider {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
  if (!appId) {
    throw new Error('Missing OPEN_EXCHANGE_RATES_APP_ID. Set it in your .env (see .env.example).');
  }

  return new OpenExchangeRatesProvider(appId, policy.baseCurrency);
}
