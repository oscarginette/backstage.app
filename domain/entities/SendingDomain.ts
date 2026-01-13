/**
 * SendingDomain Entity
 *
 * Represents an artist-owned domain for email sending.
 * Implements Clean Architecture + SOLID principles with immutable pattern.
 *
 * Status Flow:
 * pending → dns_configured → verifying → verified
 *                                      ↓
 *                                   failed
 *
 * Security: Each domain tied to user_id (ownership)
 * GDPR: Audit trail via verification timestamps
 */

export type DomainStatus =
  | 'pending'           // Just added, DNS not configured
  | 'dns_configured'    // DNS records added by user
  | 'verifying'         // Mailgun verification in progress
  | 'verified'          // Fully verified, ready to send
  | 'failed';           // Verification failed

export const DOMAIN_STATUS = {
  PENDING: 'pending' as const,
  DNS_CONFIGURED: 'dns_configured' as const,
  VERIFYING: 'verifying' as const,
  VERIFIED: 'verified' as const,
  FAILED: 'failed' as const,
} as const;

export interface DNSRecords {
  spf: {
    type: 'TXT';
    name: string;
    value: string;
  };
  dkim: {
    type: 'TXT';
    name: string;
    value: string;
  };
  dmarc: {
    type: 'TXT';
    name: string;
    value: string;
  };
  tracking?: {
    type: 'CNAME';
    name: string;
    value: string;
  };
  mx?: Array<{
    type: 'MX';
    name: string;
    value: string;
    priority: number;
  }>;
}

/**
 * SendingDomain Entity
 *
 * Immutable domain entity following Clean Architecture.
 * All update operations return new instances.
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (domain representation)
 * - OCP: Open for extension (easy to add new status types)
 * - LSP: Can be substituted with any domain entity
 * - ISP: Focused interface, no bloat
 * - DIP: No dependencies on infrastructure
 */
export class SendingDomain {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly domain: string,
    public readonly status: DomainStatus,
    public readonly dnsRecords: DNSRecords | null,
    public readonly mailgunDomainName: string | null,
    public readonly verificationAttempts: number,
    public readonly lastVerificationAt: Date | null,
    public readonly verifiedAt: Date | null,
    public readonly errorMessage: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Factory method for creating new domain
   * @param userId - Owner user ID
   * @param domain - Domain name (e.g., "geebeat.com")
   */
  static createNew(userId: number, domain: string): SendingDomain {
    return new SendingDomain(
      0, // Will be set by DB
      userId,
      domain,
      DOMAIN_STATUS.PENDING,
      null,
      null,
      0,
      null,
      null,
      null,
      new Date(),
      new Date()
    );
  }

  /**
   * Status checks
   */
  isPending(): boolean {
    return this.status === DOMAIN_STATUS.PENDING;
  }

  isVerified(): boolean {
    return this.status === DOMAIN_STATUS.VERIFIED;
  }

  canVerify(): boolean {
    return (
      this.status === DOMAIN_STATUS.DNS_CONFIGURED ||
      this.status === DOMAIN_STATUS.PENDING
    );
  }

  /**
   * Update methods (immutable pattern)
   * Returns new instance with updated values
   */
  withDNSRecords(records: DNSRecords, mailgunDomainName: string): SendingDomain {
    return new SendingDomain(
      this.id,
      this.userId,
      this.domain,
      DOMAIN_STATUS.DNS_CONFIGURED,
      records,
      mailgunDomainName,
      this.verificationAttempts,
      this.lastVerificationAt,
      this.verifiedAt,
      null, // Clear error message
      this.createdAt,
      new Date()
    );
  }

  withVerificationStatus(
    status: DomainStatus,
    errorMessage: string | null = null
  ): SendingDomain {
    return new SendingDomain(
      this.id,
      this.userId,
      this.domain,
      status,
      this.dnsRecords,
      this.mailgunDomainName,
      this.verificationAttempts + 1,
      new Date(),
      status === DOMAIN_STATUS.VERIFIED ? new Date() : this.verifiedAt,
      errorMessage,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Serialization for API responses
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      domain: this.domain,
      status: this.status,
      dnsRecords: this.dnsRecords,
      mailgunDomainName: this.mailgunDomainName,
      verificationAttempts: this.verificationAttempts,
      lastVerificationAt: this.lastVerificationAt,
      verifiedAt: this.verifiedAt,
      errorMessage: this.errorMessage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed flags
      isPending: this.isPending(),
      isVerified: this.isVerified(),
      canVerify: this.canVerify(),
    };
  }
}
