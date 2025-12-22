/**
 * QuotaTracking Entity
 *
 * Represents email quota tracking for a user.
 * Enforces daily/monthly sending limits for multi-tenant email system.
 *
 * Clean Architecture: Domain entity with no external dependencies.
 */

export interface QuotaTrackingProps {
  id: number;
  userId: number;
  emailsSentToday: number;
  lastResetDate: Date;
  monthlyLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export class QuotaTracking {
  private constructor(private readonly props: QuotaTrackingProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.userId || this.props.userId <= 0) {
      throw new Error('Invalid userId: must be positive integer');
    }

    if (this.props.emailsSentToday < 0) {
      throw new Error('Invalid emailsSentToday: cannot be negative');
    }

    if (this.props.monthlyLimit <= 0) {
      throw new Error('Invalid monthlyLimit: must be positive');
    }

    if (this.props.monthlyLimit > 10000) {
      throw new Error('Invalid monthlyLimit: cannot exceed 10,000');
    }
  }

  // Getters
  get id(): number {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get emailsSentToday(): number {
    return this.props.emailsSentToday;
  }

  get lastResetDate(): Date {
    return this.props.lastResetDate;
  }

  get monthlyLimit(): number {
    return this.props.monthlyLimit;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  canSendEmail(): boolean {
    return this.props.emailsSentToday < this.props.monthlyLimit;
  }

  getRemainingQuota(): number {
    return Math.max(0, this.props.monthlyLimit - this.props.emailsSentToday);
  }

  needsReset(): boolean {
    const now = new Date();
    const lastReset = new Date(this.props.lastResetDate);

    // Check if it's a new day (different date)
    return (
      now.getFullYear() !== lastReset.getFullYear() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getDate() !== lastReset.getDate()
    );
  }

  // Static factory methods
  static create(
    id: number,
    userId: number,
    emailsSentToday: number,
    lastResetDate: Date,
    monthlyLimit: number,
    createdAt: Date,
    updatedAt: Date
  ): QuotaTracking {
    return new QuotaTracking({
      id,
      userId,
      emailsSentToday,
      lastResetDate,
      monthlyLimit,
      createdAt,
      updatedAt,
    });
  }

  static createNew(userId: number, monthlyLimit: number): QuotaTracking {
    const now = new Date();
    return new QuotaTracking({
      id: 0, // Will be set by database
      userId,
      emailsSentToday: 0,
      lastResetDate: now,
      monthlyLimit,
      createdAt: now,
      updatedAt: now,
    });
  }
}
