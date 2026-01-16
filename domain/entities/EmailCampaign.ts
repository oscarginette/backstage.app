/**
 * EmailCampaign Entity
 *
 * Represents an email campaign or draft that can be sent independently
 * of tracks. Supports both custom emails and template-based emails.
 *
 * Warm-up Support:
 * - Campaigns can opt-in to gradual warm-up (7-day schedule)
 * - Tracks progress via warmupCurrentDay (0=not started, 1-7=active, 8+=complete)
 * - Can be paused/resumed if issues detected
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages campaign business logic and validation
 * - Open/Closed: Can be extended without modification
 */

import { WarmupSchedule } from '@/domain/value-objects/WarmupSchedule';

export interface EmailCampaignProps {
  id: string;
  templateId: string | null;
  trackId: string | null;
  subject: string | null;  // Nullable for drafts
  htmlContent: string | null;  // Nullable for drafts
  status: 'draft' | 'sent';
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  warmupEnabled: boolean;
  warmupCurrentDay: number;
  warmupStartedAt: Date | null;
  warmupPausedAt: Date | null;
  warmupPauseReason: string | null;
}

export class EmailCampaign {
  constructor(
    public readonly id: string,
    public readonly templateId: string | null,
    public readonly trackId: string | null,
    public readonly subject: string | null,  // Nullable for drafts
    public readonly htmlContent: string | null,  // Nullable for drafts
    public readonly status: 'draft' | 'sent',
    public readonly scheduledAt: Date | null,
    public readonly sentAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly warmupEnabled: boolean = false,
    public readonly warmupCurrentDay: number = 0,
    public readonly warmupStartedAt: Date | null = null,
    public readonly warmupPausedAt: Date | null = null,
    public readonly warmupPauseReason: string | null = null
  ) {
    this.validate();
  }

  /**
   * Validate campaign business rules
   * @throws Error if validation fails
   *
   * Business Rules:
   * - Drafts are flexible - subject and htmlContent can be null/empty
   * - Sent campaigns require subject and htmlContent
   */
  private validate(): void {
    const isDraft = this.status === 'draft';

    // For sent campaigns, enforce strict validation
    if (!isDraft) {
      // Subject validation for sent campaigns
      if (!this.subject || this.subject.trim().length === 0) {
        throw new Error('Sent campaign subject cannot be empty');
      }

      // HTML content validation for sent campaigns
      if (!this.htmlContent || this.htmlContent.trim().length === 0) {
        throw new Error('Sent campaign HTML content cannot be empty');
      }
    }

    // Validate subject length if present
    if (this.subject && this.subject.length > 500) {
      throw new Error('Campaign subject cannot exceed 500 characters');
    }

    // Status validation
    if (!['draft', 'sent'].includes(this.status)) {
      throw new Error('Campaign status must be either "draft" or "sent"');
    }

    // Business rule: sent campaigns must have sentAt timestamp
    if (this.status === 'sent' && !this.sentAt) {
      throw new Error('Sent campaigns must have a sentAt timestamp');
    }

    // Business rule: draft campaigns cannot have sentAt timestamp
    if (this.status === 'draft' && this.sentAt) {
      throw new Error('Draft campaigns cannot have a sentAt timestamp');
    }

    // Scheduled validation
    if (this.scheduledAt && this.scheduledAt < new Date()) {
      // Allow past scheduled dates for campaigns that should have been sent
      // This is a warning condition, not an error
    }
  }

  /**
   * Check if campaign is a draft
   */
  isDraft(): boolean {
    return this.status === 'draft';
  }

  /**
   * Check if campaign has been sent
   */
  isSent(): boolean {
    return this.status === 'sent';
  }

  /**
   * Check if campaign is scheduled for future sending
   */
  isScheduled(): boolean {
    return this.scheduledAt !== null && this.scheduledAt > new Date();
  }

  /**
   * Check if campaign is linked to a track
   */
  hasTrack(): boolean {
    return this.trackId !== null;
  }

  /**
   * Check if campaign is based on a template
   */
  hasTemplate(): boolean {
    return this.templateId !== null;
  }

  /**
   * Check if campaign is a custom email (no template, no track)
   */
  isCustomEmail(): boolean {
    return !this.hasTemplate() && !this.hasTrack();
  }

  /**
   * Get campaign summary for display purposes
   */
  getSummary(): {
    id: string;
    subject: string | null;
    status: 'draft' | 'sent';
    createdAt: Date;
    scheduledAt: Date | null;
  } {
    return {
      id: this.id,
      subject: this.subject,
      status: this.status,
      createdAt: this.createdAt,
      scheduledAt: this.scheduledAt
    };
  }

  /**
   * Create a new EmailCampaign instance
   * Factory method following clean code practices
   */
  static create(props: {
    templateId?: string | null;
    trackId?: string | null;
    subject?: string | null;  // Optional for drafts
    htmlContent?: string | null;  // Optional for drafts
    status?: 'draft' | 'sent';
    scheduledAt?: Date | null;
  }): EmailCampaign {
    const id = crypto.randomUUID();
    const now = new Date();

    return new EmailCampaign(
      id,
      props.templateId || null,
      props.trackId || null,
      props.subject || null,
      props.htmlContent || null,
      props.status || 'draft',
      props.scheduledAt || null,
      props.status === 'sent' ? now : null,
      now,
      now,
      false, // warmupEnabled
      0, // warmupCurrentDay
      null, // warmupStartedAt
      null, // warmupPausedAt
      null // warmupPauseReason
    );
  }

  /**
   * Mark campaign as sent
   * Returns new instance (immutability)
   */
  markAsSent(): EmailCampaign {
    if (this.status === 'sent') {
      throw new Error('Campaign is already marked as sent');
    }

    const now = new Date();
    return new EmailCampaign(
      this.id,
      this.templateId,
      this.trackId,
      this.subject,
      this.htmlContent,
      'sent',
      this.scheduledAt,
      now,
      this.createdAt,
      now,
      this.warmupEnabled,
      this.warmupCurrentDay,
      this.warmupStartedAt,
      this.warmupPausedAt,
      this.warmupPauseReason
    );
  }

  /**
   * Update campaign properties (only drafts can be updated)
   * Returns new instance (immutability)
   */
  update(props: {
    subject?: string | null;
    htmlContent?: string | null;
    scheduledAt?: Date | null;
  }): EmailCampaign {
    if (this.status === 'sent') {
      throw new Error('Cannot update a sent campaign');
    }

    return new EmailCampaign(
      this.id,
      this.templateId,
      this.trackId,
      props.subject !== undefined ? props.subject : this.subject,
      props.htmlContent !== undefined ? props.htmlContent : this.htmlContent,
      this.status,
      props.scheduledAt !== undefined ? props.scheduledAt : this.scheduledAt,
      this.sentAt,
      this.createdAt,
      new Date(), // Update timestamp
      this.warmupEnabled,
      this.warmupCurrentDay,
      this.warmupStartedAt,
      this.warmupPausedAt,
      this.warmupPauseReason
    );
  }

  /**
   * Convert to plain object for database storage
   */
  toJSON(): EmailCampaignProps {
    return {
      id: this.id,
      templateId: this.templateId,
      trackId: this.trackId,
      subject: this.subject,
      htmlContent: this.htmlContent,
      status: this.status,
      scheduledAt: this.scheduledAt,
      sentAt: this.sentAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      warmupEnabled: this.warmupEnabled,
      warmupCurrentDay: this.warmupCurrentDay,
      warmupStartedAt: this.warmupStartedAt,
      warmupPausedAt: this.warmupPausedAt,
      warmupPauseReason: this.warmupPauseReason
    };
  }

  /**
   * WARM-UP METHODS
   */

  /**
   * Enable warm-up for this campaign
   * Returns new instance (immutability)
   */
  enableWarmup(): EmailCampaign {
    if (this.warmupEnabled) {
      throw new Error('Warm-up is already enabled for this campaign');
    }

    if (this.status !== 'draft') {
      throw new Error('Can only enable warm-up on draft campaigns');
    }

    const now = new Date();
    return new EmailCampaign(
      this.id,
      this.templateId,
      this.trackId,
      this.subject,
      this.htmlContent,
      this.status,
      this.scheduledAt,
      this.sentAt,
      this.createdAt,
      now, // updatedAt
      true, // warmupEnabled
      1, // warmupCurrentDay (start at day 1)
      now, // warmupStartedAt
      null, // warmupPausedAt
      null // warmupPauseReason
    );
  }

  /**
   * Get warm-up schedule for this campaign
   * @param totalContacts - Total contacts for this campaign
   * @returns WarmupSchedule or null if warm-up not enabled
   */
  getWarmupSchedule(totalContacts: number): WarmupSchedule | null {
    if (!this.warmupEnabled) {
      return null;
    }

    return new WarmupSchedule(
      totalContacts,
      this.warmupCurrentDay,
      this.warmupStartedAt
    );
  }

  /**
   * Check if warm-up is active (started but not paused or complete)
   */
  isWarmupActive(): boolean {
    if (!this.warmupEnabled) return false;
    if (this.warmupPausedAt !== null) return false;

    const schedule = this.getWarmupSchedule(1000); // Dummy total for status check
    return schedule ? schedule.isActive() : false;
  }

  /**
   * Check if warm-up is complete
   */
  isWarmupComplete(): boolean {
    if (!this.warmupEnabled) return false;

    const schedule = this.getWarmupSchedule(1000); // Dummy total for status check
    return schedule ? schedule.isComplete() : false;
  }

  /**
   * Check if warm-up is paused
   */
  isWarmupPaused(): boolean {
    return this.warmupEnabled && this.warmupPausedAt !== null;
  }

  /**
   * Pause warm-up (auto or manual)
   * Returns new instance (immutability)
   */
  pauseWarmup(reason: string): EmailCampaign {
    if (!this.warmupEnabled) {
      throw new Error('Cannot pause warm-up: not enabled');
    }

    if (this.warmupPausedAt !== null) {
      throw new Error('Warm-up is already paused');
    }

    const now = new Date();
    return new EmailCampaign(
      this.id,
      this.templateId,
      this.trackId,
      this.subject,
      this.htmlContent,
      this.status,
      this.scheduledAt,
      this.sentAt,
      this.createdAt,
      now, // updatedAt
      this.warmupEnabled,
      this.warmupCurrentDay,
      this.warmupStartedAt,
      now, // warmupPausedAt
      reason // warmupPauseReason
    );
  }

  /**
   * Resume paused warm-up
   * Returns new instance (immutability)
   */
  resumeWarmup(): EmailCampaign {
    if (!this.warmupEnabled) {
      throw new Error('Cannot resume warm-up: not enabled');
    }

    if (this.warmupPausedAt === null) {
      throw new Error('Warm-up is not paused');
    }

    const now = new Date();
    return new EmailCampaign(
      this.id,
      this.templateId,
      this.trackId,
      this.subject,
      this.htmlContent,
      this.status,
      this.scheduledAt,
      this.sentAt,
      this.createdAt,
      now, // updatedAt
      this.warmupEnabled,
      this.warmupCurrentDay,
      this.warmupStartedAt,
      null, // warmupPausedAt (clear)
      null // warmupPauseReason (clear)
    );
  }

  /**
   * Advance warm-up to next day
   * Returns new instance (immutability)
   */
  advanceWarmupDay(): EmailCampaign {
    if (!this.warmupEnabled) {
      throw new Error('Cannot advance warm-up day: not enabled');
    }

    if (this.warmupPausedAt !== null) {
      throw new Error('Cannot advance paused warm-up');
    }

    const now = new Date();
    return new EmailCampaign(
      this.id,
      this.templateId,
      this.trackId,
      this.subject,
      this.htmlContent,
      this.status,
      this.scheduledAt,
      this.sentAt,
      this.createdAt,
      now, // updatedAt
      this.warmupEnabled,
      this.warmupCurrentDay + 1, // Advance day
      this.warmupStartedAt,
      this.warmupPausedAt,
      this.warmupPauseReason
    );
  }

  /**
   * Create from database row
   * Note: Returns EmailCampaign entity with additional fields attached
   *
   * Database types:
   * - id: Int (PostgreSQL) -> string (entity)
   * - template_id: Int | null -> string | null
   * - track_id: String | null -> string | null
   */
  static fromDatabase(row: any): EmailCampaign {
    const campaign = new EmailCampaign(
      row.id.toString(), // Convert Int to string
      row.template_id ? row.template_id.toString() : null, // Convert Int to string
      row.track_id || null, // Already a string
      row.subject || null,
      row.html_content || null,
      row.status,
      row.scheduled_at ? new Date(row.scheduled_at) : null,
      row.sent_at ? new Date(row.sent_at) : null,
      new Date(row.created_at),
      new Date(row.updated_at),
      row.warmup_enabled ?? false,
      row.warmup_current_day ?? 0,
      row.warmup_started_at ? new Date(row.warmup_started_at) : null,
      row.warmup_paused_at ? new Date(row.warmup_paused_at) : null,
      row.warmup_pause_reason || null
    );

    // Attach additional fields for draft editing (not part of core entity)
    // Note: These fields may not exist in the database yet
    // Use Object.assign to preserve the EmailCampaign instance (keeps methods)
    return Object.assign(campaign, {
      greeting: row.greeting !== undefined ? row.greeting : null,
      message: row.message !== undefined ? row.message : null,
      signature: row.signature !== undefined ? row.signature : null,
      coverImageUrl: row.cover_image_url !== undefined ? row.cover_image_url : null,
    });
  }
}
