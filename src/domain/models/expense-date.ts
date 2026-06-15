const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Value Object representing the calendar date of an expense.
 *
 * All calculations are performed against UTC midnights, so day counts
 * are exact calendar days: independent of the local timezone and of
 * the time of day of the reference date.
 */
export class ExpenseDate {
  private constructor(private readonly utcMidnight: number) {}

  /**
   * Creates an ExpenseDate from an ISO date string (YYYY-MM-DD).
   *
   * @param isoDate - The ISO date string to parse.
   * @returns An instance of ExpenseDate.
   * @throws Error if the input is not a valid ISO date or represents an impossible date.
   *
   */
  public static fromIso(isoDate: string): ExpenseDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!match) {
      throw new Error(`Invalid date format: ${isoDate}. Expected ISO date (YYYY-MM-DD).`);
    }

    const [, yearStr, monthStr, dayStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr) - 1; // Date.UTC months are 0-indexed
    const day = Number(dayStr);

    const date = new Date(Date.UTC(year, month, day));
    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month ||
      date.getUTCDate() !== day
    ) {
      throw new Error(`Invalid date: ${isoDate}.`);
    }

    return new ExpenseDate(date.getTime());
  }

  /**
   * Whether an ISO string is a real calendar date (well-formed and
   * existent, e.g. rejects 2026-02-30). Lets callers validate up front
   * so {@link fromIso} never throws downstream.
   */
  public static isValid(this: void, isoDate: string): boolean {
    try {
      ExpenseDate.fromIso(isoDate);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Number of full calendar days elapsed between this date and the
   * reference date. Negative when this date is in the future.
   */
  public daysOld(referenceDate: Date): number {
    const utcReference = Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    );

    return Math.floor((utcReference - this.utcMidnight) / MS_PER_DAY);
  }

  public isFuture(referenceDate: Date): boolean {
    return this.daysOld(referenceDate) < 0;
  }
}
