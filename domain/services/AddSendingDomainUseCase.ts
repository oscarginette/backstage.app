/**
 * AddSendingDomainUseCase
 *
 * Handles adding a new sending domain for an artist.
 * Creates domain in Mailgun and saves DNS records to database.
 *
 * Flow:
 * 1. Validate domain format
 * 2. Check if domain already exists (prevent duplicates)
 * 3. Create domain in Mailgun API
 * 4. Save domain to database
 * 5. Update DNS records in database
 * 6. Return domain entity and DNS records for user configuration
 *
 * Security:
 * - Domain format validation (regex)
 * - Duplicate prevention
 * - User ownership tracking
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (add domain)
 * - OCP: Open for extension (easy to add validation rules)
 * - LSP: Works with any ISendingDomainRepository/IMailgunClient implementation
 * - ISP: Uses specific interfaces only
 * - DIP: Depends on interfaces, not concrete classes
 */

import { ISendingDomainRepository } from '../repositories/ISendingDomainRepository';
import { IMailgunClient } from '../providers/IMailgunClient';
import { SendingDomain, DNSRecords } from '../entities/SendingDomain';

export interface AddSendingDomainInput {
  userId: number;
  domain: string;
}

export interface AddSendingDomainResult {
  success: boolean;
  domain?: SendingDomain;
  dnsRecords?: DNSRecords;
  error?: string;
}

/**
 * AddSendingDomainUseCase
 *
 * Business logic for adding artist-owned domains.
 * Orchestrates Mailgun API and database operations.
 */
export class AddSendingDomainUseCase {
  constructor(
    private readonly sendingDomainRepository: ISendingDomainRepository,
    private readonly mailgunClient: IMailgunClient
  ) {}

  /**
   * Execute domain addition
   *
   * @param input - User ID and domain name
   * @returns Success result with domain and DNS records, or error
   *
   * Example:
   * const result = await useCase.execute({
   *   userId: 123,
   *   domain: 'geebeat.com'
   * });
   */
  async execute(input: AddSendingDomainInput): Promise<AddSendingDomainResult> {
    try {
      // 1. Validate domain format
      const validationError = this.validateDomain(input.domain);
      if (validationError) {
        console.log('[AddSendingDomain] Validation failed:', validationError);
        return { success: false, error: validationError };
      }

      // 2. Check if domain already exists (prevent duplicates)
      const existingDomain = await this.sendingDomainRepository.findByDomain(
        input.domain
      );
      if (existingDomain) {
        console.log('[AddSendingDomain] Domain already exists:', input.domain);
        return {
          success: false,
          error: 'Domain already registered. Each domain can only be verified once.',
        };
      }

      console.log('[AddSendingDomain] Creating domain in Mailgun:', input.domain);

      // 3. Create domain in Mailgun
      const mailgunResult = await this.mailgunClient.createDomain(input.domain);
      if (!mailgunResult.success) {
        console.error('[AddSendingDomain] Mailgun creation failed:', mailgunResult.error);
        return {
          success: false,
          error: mailgunResult.error || 'Failed to create domain in Mailgun',
        };
      }

      console.log('[AddSendingDomain] Mailgun domain created:', {
        mailgunDomainName: mailgunResult.mailgunDomainName,
        hasDNSRecords: !!mailgunResult.dnsRecords,
      });

      // 4. Create domain in database
      const domain = await this.sendingDomainRepository.create({
        userId: input.userId,
        domain: input.domain,
      });

      console.log('[AddSendingDomain] Domain created in database:', domain.id);

      // 5. Update DNS records in database
      const updatedDomain = await this.sendingDomainRepository.updateDNSRecords(
        domain.id,
        {
          dnsRecords: mailgunResult.dnsRecords,
          mailgunDomainName: mailgunResult.mailgunDomainName,
        }
      );

      console.log('[AddSendingDomain] DNS records updated successfully');

      // 6. Return success with domain and DNS records
      return {
        success: true,
        domain: updatedDomain,
        dnsRecords: mailgunResult.dnsRecords,
      };
    } catch (error) {
      console.error('[AddSendingDomain] Unexpected error:', error);

      // Don't expose internal errors to user
      return {
        success: false,
        error: 'Failed to add domain. Please try again later.',
      };
    }
  }

  /**
   * Validate domain format
   *
   * Rules:
   * - Must be valid domain format
   * - No subdomains (e.g., "mail.geebeat.com" not allowed)
   * - No protocols (e.g., "https://geebeat.com" not allowed)
   * - Alphanumeric and hyphens only
   *
   * @param domain - Domain name to validate
   * @returns Error message or null if valid
   */
  private validateDomain(domain: string): string | null {
    if (!domain || typeof domain !== 'string') {
      return 'Domain is required';
    }

    // Trim whitespace
    const trimmed = domain.trim().toLowerCase();

    // No empty strings
    if (trimmed.length === 0) {
      return 'Domain cannot be empty';
    }

    // No protocols
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return 'Domain should not include protocol (http:// or https://)';
    }

    // No paths
    if (trimmed.includes('/')) {
      return 'Domain should not include paths';
    }

    // Domain format validation
    // - Must have at least one dot (e.g., "geebeat.com")
    // - Alphanumeric and hyphens only
    // - Cannot start or end with hyphen
    // - TLD must be at least 2 characters
    const domainRegex = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]?\.([a-z0-9][a-z0-9-]{0,61}[a-z0-9]?\.)*[a-z]{2,}$/;
    if (!domainRegex.test(trimmed)) {
      return 'Invalid domain format. Please enter a valid domain (e.g., geebeat.com)';
    }

    // Prevent subdomains (optional - can be removed if subdomains are allowed)
    // Count dots: "geebeat.com" = 1 dot (ok), "mail.geebeat.com" = 2 dots (not ok)
    const dotCount = (trimmed.match(/\./g) || []).length;
    if (dotCount > 1) {
      return 'Subdomains are not supported. Please use root domain (e.g., geebeat.com)';
    }

    // Length check
    if (trimmed.length > 253) {
      return 'Domain is too long (max 253 characters)';
    }

    return null;
  }
}
