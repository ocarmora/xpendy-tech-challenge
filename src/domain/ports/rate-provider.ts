/**
 * Port: provides the exchange rate from a currency to the policy's base
 * currency for a given date. The domain defines the contract; adapters
 * (in-memory for tests, Open Exchange Rates client in Part 2) implement it.
 */
export interface RateProvider {
  /**
   * @param currency - ISO 4217 code of the expense's currency (e.g. "CLP").
   * @param date - ISO date (YYYY-MM-DD) of the expense; rates are historical.
   * @returns Units of base currency per 1 unit of `currency`.
   * @throws When the rate cannot be provided (unknown currency, etc.).
   */
  getRate(currency: string, date: string): Promise<number>;
}
