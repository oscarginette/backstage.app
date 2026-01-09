/**
 * SenderIdentity Entity
 *
 * Represents the email sender configuration for a user.
 * Provider-agnostic design: supports Resend, SendGrid, or custom SMTP.
 *
 * Migration Path:
 * - Phase 1 (Early Users): Subdomain (username.mail.thebackstage.app)
 * - Phase 2 (Paid Users): Custom domain (newsletter@djdomain.com)
 *
 * Clean Architecture: Domain entity with business logic.
 * SOLID: Single Responsibility (sender identity management).
 */

export type SenderType = 'subdomain' | 'custom_domain' | 'shared';
export type SenderProvider = 'resend' | 'sendgrid' | 'smtp';
export type DomainAuthStatus = 'pending' | 'verified' | 'failed' | 'none';

export interface SenderIdentityData {
  id: number;
  userId: number;
  senderType: SenderType;
  provider: SenderProvider;

  // Email identity
  fromEmail: string;        // Full email: newsletter@technoking.mail.thebackstage.app
  fromName: string;         // Display name: "TechnoKing"
  replyToEmail?: string;    // Optional: personal email for replies

  // Domain info
  domain: string;           // technoking.mail.thebackstage.app OR djdomain.com
  subdomain?: string;       // For custom domains: "newsletter"

  // Authentication status
  authStatus: DomainAuthStatus;
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;

  // DNS records (for custom domains)
  dnsRecords?: {
    spf: string;
    dkim: string;
    dmarc?: string;
  };

  // Provider-specific config
  providerConfig?: {
    resendDomainId?: string;
    sendgridDomainId?: number;
    smtpHost?: string;
    smtpPort?: number;
  };

  // Status
  isActive: boolean;
  isPrimary: boolean;       // User can have multiple identities

  // Metadata
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class SenderIdentity {
  public readonly id: number;
  public readonly userId: number;
  public readonly senderType: SenderType;
  public readonly provider: SenderProvider;
  public readonly fromEmail: string;
  public readonly fromName: string;
  public readonly replyToEmail?: string;
  public readonly domain: string;
  public readonly subdomain?: string;
  public readonly authStatus: DomainAuthStatus;
  public readonly spfVerified: boolean;
  public readonly dkimVerified: boolean;
  public readonly dmarcVerified: boolean;
  public readonly dnsRecords?: SenderIdentityData['dnsRecords'];
  public readonly providerConfig?: SenderIdentityData['providerConfig'];
  public readonly isActive: boolean;
  public readonly isPrimary: boolean;
  public readonly verifiedAt?: Date;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: SenderIdentityData) {
    this.id = data.id;
    this.userId = data.userId;
    this.senderType = data.senderType;
    this.provider = data.provider;
    this.fromEmail = data.fromEmail;
    this.fromName = data.fromName;
    this.replyToEmail = data.replyToEmail;
    this.domain = data.domain;
    this.subdomain = data.subdomain;
    this.authStatus = data.authStatus;
    this.spfVerified = data.spfVerified;
    this.dkimVerified = data.dkimVerified;
    this.dmarcVerified = data.dmarcVerified;
    this.dnsRecords = data.dnsRecords;
    this.providerConfig = data.providerConfig;
    this.isActive = data.isActive;
    this.isPrimary = data.isPrimary;
    this.verifiedAt = data.verifiedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Check if sender identity is ready to send emails
   */
  canSendEmails(): boolean {
    if (!this.isActive) return false;

    // Subdomain: always ready (managed by platform)
    if (this.senderType === 'subdomain') return true;

    // Custom domain: must be verified
    if (this.senderType === 'custom_domain') {
      return this.authStatus === 'verified' && this.spfVerified && this.dkimVerified;
    }

    return false;
  }

  /**
   * Check if domain verification is pending
   */
  isPendingVerification(): boolean {
    return this.senderType === 'custom_domain' && this.authStatus === 'pending';
  }

  /**
   * Get formatted FROM address for email sending
   * @returns Formatted email address: "Display Name <email@domain.com>"
   */
  getFromAddress(): string {
    return `${this.fromName} <${this.fromEmail}>`;
  }

  /**
   * Get email headers for sending
   */
  getEmailHeaders(): { from: string; replyTo?: string } {
    return {
      from: this.getFromAddress(),
      replyTo: this.replyToEmail,
    };
  }

  /**
   * Check if this is a Backstage-managed subdomain
   */
  isBackstageSubdomain(): boolean {
    return this.senderType === 'subdomain' && this.domain.endsWith('.mail.thebackstage.app');
  }

  /**
   * Check if upgrade to custom domain is available
   */
  canUpgradeToCustomDomain(): boolean {
    return this.senderType === 'subdomain';
  }

  /**
   * Factory: Create subdomain identity for new user
   */
  static createSubdomainIdentity(
    userId: number,
    username: string,
    displayName: string,
    provider: SenderProvider = 'resend'
  ): Omit<SenderIdentityData, 'id' | 'createdAt' | 'updatedAt'> {
    const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = `${sanitizedUsername}.mail.thebackstage.app`;
    const fromEmail = `newsletter@${domain}`;

    return {
      userId,
      senderType: 'subdomain',
      provider,
      fromEmail,
      fromName: displayName,
      domain,
      authStatus: 'verified', // Subdomain is auto-verified
      spfVerified: true,
      dkimVerified: true,
      dmarcVerified: true,
      isActive: true,
      isPrimary: true,
    };
  }

  /**
   * Factory: Create custom domain identity (for paid users)
   */
  static createCustomDomainIdentity(
    userId: number,
    customDomain: string,
    displayName: string,
    subdomain: string = 'newsletter',
    provider: SenderProvider = 'sendgrid'
  ): Omit<SenderIdentityData, 'id' | 'createdAt' | 'updatedAt' | 'dnsRecords'> {
    const fromEmail = `${subdomain}@${customDomain}`;

    return {
      userId,
      senderType: 'custom_domain',
      provider,
      fromEmail,
      fromName: displayName,
      domain: customDomain,
      subdomain,
      authStatus: 'pending', // Requires DNS verification
      spfVerified: false,
      dkimVerified: false,
      dmarcVerified: false,
      isActive: false, // Not active until verified
      isPrimary: false,
    };
  }
}
