/**
 * WarmupSchedule - Value Object
 *
 * Encapsulates warm-up schedule business logic for gradual email sending.
 * Immutable value object that calculates daily quotas and tracks progression.
 *
 * Warm-up Strategy (7-day schedule):
 * - Day 1: 50 contacts (1%)
 * - Day 2: 100 contacts (2%)
 * - Day 3: 200 contacts (4%)
 * - Day 4: 400 contacts (8%)
 * - Day 5: 800 contacts (16%)
 * - Day 6: 1,200 contacts (24%)
 * - Day 7: Remaining contacts (≈45%)
 *
 * Why this schedule:
 * - Conservative ramp-up prevents spam filter triggers
 * - Exponential growth up to Day 5, then linear
 * - Completes in 7 days for most lists
 * - Based on industry best practices (Mailchimp, SendGrid, etc.)
 */

export interface WarmupScheduleProps {
  totalContacts: number;
  currentDay: number; // 0 = not started, 1-7 = active, 8+ = complete
  startedAt: Date | null;
}

export class WarmupSchedule {
  private static readonly SCHEDULE: Record<number, number | null> = {
    1: 50,    // Day 1: 50 contacts
    2: 100,   // Day 2: 100 contacts
    3: 200,   // Day 3: 200 contacts
    4: 400,   // Day 4: 400 contacts
    5: 800,   // Day 5: 800 contacts
    6: 1200,  // Day 6: 1,200 contacts
    7: null,  // Day 7: Remaining contacts
  };

  private static readonly MAX_DAY = 7;

  constructor(
    public readonly totalContacts: number,
    public readonly currentDay: number,
    public readonly startedAt: Date | null
  ) {
    this.validate();
  }

  /**
   * Validate warm-up schedule state
   */
  private validate(): void {
    if (this.totalContacts < 0) {
      throw new Error('Total contacts cannot be negative');
    }

    if (this.currentDay < 0) {
      throw new Error('Current day cannot be negative');
    }

    if (this.currentDay > 0 && !this.startedAt) {
      throw new Error('Started date required when warm-up is active');
    }
  }

  /**
   * Get daily quota for a specific day
   *
   * @param day - Day number (1-7)
   * @returns Number of contacts to send on this day
   */
  getDailyQuota(day: number): number {
    if (day < 1 || day > WarmupSchedule.MAX_DAY) {
      throw new Error(`Invalid day: ${day}. Must be between 1 and ${WarmupSchedule.MAX_DAY}`);
    }

    const fixedQuota = WarmupSchedule.SCHEDULE[day];

    // Day 7: Send all remaining contacts
    if (fixedQuota === null) {
      const sentSoFar = this.calculateSentSoFar(day - 1);
      return Math.max(0, this.totalContacts - sentSoFar);
    }

    // Days 1-6: Send fixed quota (or remaining if less)
    const sentSoFar = this.calculateSentSoFar(day - 1);
    const remaining = Math.max(0, this.totalContacts - sentSoFar);

    return Math.min(fixedQuota, remaining);
  }

  /**
   * Calculate total contacts sent up to (but not including) a given day
   *
   * @param upToDay - Day number (0-7)
   * @returns Total contacts sent before this day
   */
  private calculateSentSoFar(upToDay: number): number {
    let total = 0;

    for (let day = 1; day <= upToDay; day++) {
      const quota = WarmupSchedule.SCHEDULE[day];
      if (quota !== null) {
        total += quota;
      }
    }

    return total;
  }

  /**
   * Check if warm-up is complete
   *
   * @returns True if all days processed or all contacts sent
   */
  isComplete(): boolean {
    return this.currentDay > WarmupSchedule.MAX_DAY;
  }

  /**
   * Check if warm-up is active (started but not complete)
   *
   * @returns True if warm-up is in progress
   */
  isActive(): boolean {
    return this.currentDay >= 1 && this.currentDay <= WarmupSchedule.MAX_DAY;
  }

  /**
   * Get estimated days remaining
   *
   * @returns Number of days left in warm-up
   */
  getDaysRemaining(): number {
    if (this.isComplete()) return 0;
    if (!this.isActive()) return WarmupSchedule.MAX_DAY;

    return WarmupSchedule.MAX_DAY - this.currentDay + 1;
  }

  /**
   * Get total contacts that will be sent across all days
   *
   * @returns Total contacts (same as totalContacts)
   */
  getTotalQuota(): number {
    return this.totalContacts;
  }

  /**
   * Get all daily quotas for the entire schedule
   *
   * @returns Array of daily quotas
   */
  getAllDailyQuotas(): Array<{ day: number; quota: number }> {
    const quotas: Array<{ day: number; quota: number }> = [];

    for (let day = 1; day <= WarmupSchedule.MAX_DAY; day++) {
      quotas.push({
        day,
        quota: this.getDailyQuota(day),
      });
    }

    return quotas;
  }

  /**
   * Advance to next day (immutable)
   *
   * @returns New WarmupSchedule for next day
   */
  advanceToNextDay(): WarmupSchedule {
    if (this.isComplete()) {
      return this; // Already complete, no change
    }

    return new WarmupSchedule(
      this.totalContacts,
      this.currentDay + 1,
      this.startedAt
    );
  }

  /**
   * Start warm-up (immutable)
   *
   * @param startDate - When warm-up starts
   * @returns New WarmupSchedule with started state
   */
  static start(totalContacts: number, startDate: Date = new Date()): WarmupSchedule {
    return new WarmupSchedule(totalContacts, 1, startDate);
  }

  /**
   * Create a not-started warm-up schedule
   *
   * @param totalContacts - Total contacts in list
   * @returns New WarmupSchedule (not started)
   */
  static create(totalContacts: number): WarmupSchedule {
    return new WarmupSchedule(totalContacts, 0, null);
  }

  /**
   * Get estimated completion date
   *
   * @returns Estimated date when warm-up will complete
   */
  getEstimatedCompletionDate(): Date | null {
    if (!this.startedAt) return null;
    if (this.isComplete()) return this.startedAt; // Already complete

    const daysRemaining = this.getDaysRemaining();
    const completionDate = new Date(this.startedAt);
    completionDate.setDate(completionDate.getDate() + daysRemaining);

    return completionDate;
  }

  /**
   * Get progress percentage
   *
   * @returns Percentage complete (0-100)
   */
  getProgressPercentage(): number {
    if (this.currentDay === 0) return 0;
    if (this.isComplete()) return 100;

    return Math.round((this.currentDay / WarmupSchedule.MAX_DAY) * 100);
  }
}
