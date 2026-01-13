/**
 * IMailgunClient Interface
 *
 * Abstraction for Mailgun Domains API operations.
 * Follows Dependency Inversion Principle (SOLID).
 *
 * Purpose: Enable multi-tenant domain verification system.
 * Each artist can verify and send emails from their own domain.
 *
 * Clean Architecture: Domain layer interface (this file).
 * Infrastructure layer implements it (MailgunDomainClient).
 *
 * SOLID: Interface segregation - focused on domain operations only.
 *
 * @see domain/entities/SendingDomain.ts for domain entity
 * @see infrastructure/email/mailgun/MailgunDomainClient.ts for implementation
 */

import { DNSRecords } from '../entities/SendingDomain';

/**
 * Result of creating a domain in Mailgun
 */
export interface MailgunDomainCreationResult {
  success: boolean;
  mailgunDomainName: string; // Mailgun internal domain identifier
  dnsRecords: DNSRecords;    // SPF, DKIM, DMARC records to configure
  error?: string;            // Error message if creation failed
}

/**
 * Result of verifying a domain in Mailgun
 */
export interface MailgunDomainVerificationResult {
  verified: boolean;         // Overall verification status (SPF + DKIM)
  spfVerified: boolean;      // SPF record verified
  dkimVerified: boolean;     // DKIM record verified
  dmarcVerified: boolean;    // DMARC record verified (optional but recommended)
  error?: string;            // Error message if verification failed
}

/**
 * IMailgunClient Interface
 *
 * Provides abstraction for Mailgun Domains API.
 * Use cases depend on this interface, not the concrete implementation.
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (Mailgun domain operations)
 * - OCP: Open for extension (easy to add mock/test implementations)
 * - LSP: Any implementation can substitute this interface
 * - ISP: Specific interface (no bloat, only domain operations)
 * - DIP: Use cases depend on this interface, not concrete class
 */
export interface IMailgunClient {
  /**
   * Create a new domain in Mailgun
   *
   * @param domain - Domain name (e.g., "geebeat.com")
   * @returns Creation result with DNS records to configure
   *
   * SECURITY: Generates secure random SMTP password
   * GDPR: No personal data stored in Mailgun
   *
   * Example:
   * const result = await mailgunClient.createDomain('geebeat.com');
   * if (result.success) {
   *   console.log('Configure these DNS records:', result.dnsRecords);
   * }
   */
  createDomain(domain: string): Promise<MailgunDomainCreationResult>;

  /**
   * Verify a domain's DNS configuration in Mailgun
   *
   * @param mailgunDomainName - Mailgun internal domain identifier
   * @returns Verification result with status of each DNS record
   *
   * NOTE: Mailgun checks DNS records and updates their status.
   * A domain is verified when both SPF and DKIM are valid.
   *
   * Example:
   * const result = await mailgunClient.verifyDomain('geebeat.com');
   * if (result.verified) {
   *   console.log('Domain verified! Ready to send emails.');
   * }
   */
  verifyDomain(mailgunDomainName: string): Promise<MailgunDomainVerificationResult>;

  /**
   * Delete a domain from Mailgun
   *
   * @param mailgunDomainName - Mailgun internal domain identifier
   *
   * CAUTION: This is destructive. Consider soft-delete in database instead.
   * Mailgun stats and logs will be lost after deletion.
   *
   * Example:
   * await mailgunClient.deleteDomain('geebeat.com');
   */
  deleteDomain(mailgunDomainName: string): Promise<void>;

  /**
   * Get domain information from Mailgun
   *
   * @param mailgunDomainName - Mailgun internal domain identifier
   * @returns Domain details including DNS records and verification status
   *
   * Example:
   * const info = await mailgunClient.getDomainInfo('geebeat.com');
   * console.log('Domain state:', info.state);
   */
  getDomainInfo(mailgunDomainName: string): Promise<any>;
}
