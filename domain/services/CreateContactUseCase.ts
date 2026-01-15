import crypto from 'crypto';
import { ImportedContact, ValidationError } from '@/domain/entities/ImportedContact';
import { CONSENT_ACTIONS, CONSENT_SOURCES } from '@/domain/entities/ConsentHistory';
import type { IContactRepository } from '@/domain/repositories/IContactRepository';
import type { IConsentHistoryRepository } from '@/domain/repositories/IConsentHistoryRepository';
import type { ContactMetadata } from '@/domain/types/metadata';
import type { Contact } from '@/domain/repositories/IContactRepository';

/**
 * CreateContactUseCase
 *
 * Handles individual contact creation with validation, duplicate detection, and GDPR consent logging.
 *
 * Responsibility (SRP):
 * - Validate contact data
 * - Check for existing contacts (duplicate detection)
 * - Generate unsubscribe token
 * - Create or update contact via repository
 * - Log GDPR consent history
 *
 * Dependencies (DIP):
 * - IContactRepository (injected)
 * - IConsentHistoryRepository (injected)
 *
 * Business Rules:
 * 1. Email must be valid format
 * 2. Name cannot exceed 100 characters
 * 3. If contact exists and is subscribed → Return error
 * 4. If contact exists and is unsubscribed → Resubscribe flow
 * 5. Always log consent history (GDPR compliance)
 */

export interface CreateContactInput {
  userId: number;
  email: string;
  name?: string | null;
  subscribed?: boolean;
  metadata?: ContactMetadata;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateContactResult {
  success: boolean;
  contact?: Contact;
  error?: string;
  action?: 'created' | 'updated' | 'resubscribed';
}

export class CreateContactUseCase {
  constructor(
    private readonly contactRepository: IContactRepository,
    private readonly consentHistoryRepository: IConsentHistoryRepository
  ) {}

  /**
   * Execute the contact creation operation
   */
  async execute(input: CreateContactInput): Promise<CreateContactResult> {
    try {
      // 1. Validate input data via ImportedContact entity
      const validatedContact = this.validateContact(input);

      // 2. Check for existing contact
      const existingContact = await this.contactRepository.findByEmail(
        input.email,
        input.userId
      );

      // 3. Handle duplicate detection
      if (existingContact) {
        return this.handleExistingContact(existingContact, input);
      }

      // 4. Create new contact
      return this.createNewContact(input, validatedContact);
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message
        };
      }

      throw error;
    }
  }

  /**
   * Validate contact data using ImportedContact entity
   * Reuses existing validation logic from CSV import
   */
  private validateContact(input: CreateContactInput): ImportedContact {
    try {
      return ImportedContact.create(
        input.email,
        input.name || null,
        input.subscribed ?? true,
        input.metadata || {},
        1 // Row number (always 1 for individual contact)
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        error instanceof Error ? error.message : 'Invalid contact data',
        1,
        input.email
      );
    }
  }

  /**
   * Handle existing contact (duplicate detection)
   */
  private async handleExistingContact(
    existingContact: Contact,
    input: CreateContactInput
  ): Promise<CreateContactResult> {
    // If contact is subscribed → Return error
    if (existingContact.subscribed) {
      return {
        success: false,
        error: 'Contact already exists and is subscribed'
      };
    }

    // If contact is unsubscribed → Resubscribe flow
    await this.contactRepository.resubscribe(existingContact.id, input.userId);

    // Log resubscribe consent
    await this.logConsentHistory(
      existingContact.id,
      CONSENT_ACTIONS.RESUBSCRIBE,
      input.ipAddress || null,
      input.userAgent || null
    );

    // Fetch updated contact
    const updatedContact = await this.contactRepository.findByEmail(
      input.email,
      input.userId
    );

    return {
      success: true,
      contact: updatedContact || undefined,
      action: 'resubscribed'
    };
  }

  /**
   * Create new contact
   */
  private async createNewContact(
    input: CreateContactInput,
    validatedContact: ImportedContact
  ): Promise<CreateContactResult> {
    // Generate 64-character unsubscribe token
    const unsubscribeToken = this.generateUnsubscribeToken();

    // Prepare contact for bulk import (reuses existing repository method)
    const contactData = {
      userId: input.userId,
      email: validatedContact.email,
      name: validatedContact.name,
      subscribed: validatedContact.subscribed,
      source: 'manual_add',
      metadata: validatedContact.metadata
    };

    // Insert contact via bulkImport (single contact = batch of 1)
    const result = await this.contactRepository.bulkImport([contactData]);

    if (result.inserted === 0 && result.errors.length > 0) {
      return {
        success: false,
        error: result.errors[0].error
      };
    }

    // Fetch created contact to get ID
    const createdContact = await this.contactRepository.findByEmail(
      input.email,
      input.userId
    );

    if (!createdContact) {
      return {
        success: false,
        error: 'Failed to create contact'
      };
    }

    // Log subscribe consent (GDPR compliance)
    await this.logConsentHistory(
      createdContact.id,
      CONSENT_ACTIONS.SUBSCRIBE,
      input.ipAddress || null,
      input.userAgent || null
    );

    return {
      success: true,
      contact: createdContact,
      action: result.updated > 0 ? 'updated' : 'created'
    };
  }

  /**
   * Generate 64-character unsubscribe token (32 bytes)
   * Same pattern as CSV import
   */
  private generateUnsubscribeToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Log consent history for GDPR compliance
   */
  private async logConsentHistory(
    contactId: number,
    action: typeof CONSENT_ACTIONS[keyof typeof CONSENT_ACTIONS],
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<void> {
    await this.consentHistoryRepository.create({
      contactId,
      action,
      timestamp: new Date(),
      source: CONSENT_SOURCES.MANUAL_IMPORT,
      ipAddress,
      userAgent,
      metadata: {
        channel: 'api' as const,
        notes: 'Contact added manually via web form'
      }
    });
  }
}
