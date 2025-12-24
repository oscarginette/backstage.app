/**
 * FetchBrevoContactsUseCase
 *
 * Fetches contacts from Brevo API and transforms them to ImportedContact entities.
 * Implements business logic for Brevo import workflow.
 *
 * Clean Architecture + SOLID:
 * - Single Responsibility: Only fetches and transforms Brevo contacts
 * - Dependency Inversion: Depends on IBrevoAPIClient interface, not concrete implementation
 * - Open/Closed: Easy to extend for new data sources without modifying existing code
 */

import { IBrevoAPIClient, BrevoContact, BrevoList } from '@/domain/repositories/IBrevoAPIClient';
import { ImportedContact } from '@/domain/entities/ImportedContact';

export interface FetchBrevoContactsInput {
  userId: number;
  previewOnly: boolean; // true = limit to 500, false = fetch all
}

export interface FetchBrevoContactsResult {
  contacts: ImportedContact[];
  totalContactsAvailable: number;
  listsProcessed: BrevoList[];
}

export class FetchBrevoContactsUseCase {
  constructor(private readonly brevoClient: IBrevoAPIClient) {}

  async execute(input: FetchBrevoContactsInput): Promise<FetchBrevoContactsResult> {
    const { previewOnly } = input;

    // 1. Fetch all available lists
    const lists = await this.brevoClient.getLists();

    // 2. Fetch contacts from all lists (with limit if preview mode)
    const limit = previewOnly ? 500 : undefined;
    const brevoContacts = await this.brevoClient.getContactsFromAllLists({ limit });

    // 3. Transform Brevo contacts to ImportedContact entities
    const importedContacts = brevoContacts.map((contact, index) =>
      this.transformBrevoContact(contact, index + 1)
    );

    return {
      contacts: importedContacts,
      totalContactsAvailable: previewOnly ?
        lists.reduce((sum, list) => sum + (list.totalSubscribers || 0), 0) :
        brevoContacts.length,
      listsProcessed: lists
    };
  }

  /**
   * Transform Brevo contact to ImportedContact entity
   *
   * Business Rules:
   * 1. Email: Direct mapping from Brevo
   * 2. Name: Prefer attributes.NAME, fallback to concat(FIRSTNAME, LASTNAME)
   * 3. Subscribed: Inverted from emailBlacklisted (!blacklisted = subscribed)
   * 4. Metadata: Preserve ALL Brevo attributes + tracking fields
   */
  private transformBrevoContact(
    contact: BrevoContact,
    rowNumber: number
  ): ImportedContact {
    const attrs = contact.attributes || {};

    // Extract name (prefer NAME attribute, fallback to FIRSTNAME + LASTNAME)
    const name = this.extractName(attrs);

    // Subscribed status (inverted from emailBlacklisted)
    const subscribed = !contact.emailBlacklisted;

    // Metadata: Preserve all Brevo data for audit trail
    const metadata: Record<string, any> = {
      brevo_id: contact.id.toString(),
      brevo_list_ids: contact.listIds,
      attributes: attrs,
      imported_from_brevo: true,
      imported_at: new Date().toISOString()
    };

    return ImportedContact.create(
      contact.email,
      name,
      subscribed,
      metadata,
      rowNumber
    );
  }

  /**
   * Extract name from Brevo attributes
   * Tries multiple strategies in order:
   * 1. attributes.NAME (if exists)
   * 2. concat(attributes.FIRSTNAME, attributes.LASTNAME)
   * 3. null (if no name data available)
   */
  private extractName(attributes: Record<string, any>): string | null {
    // Strategy 1: Direct NAME attribute
    if (attributes.NAME && typeof attributes.NAME === 'string') {
      return attributes.NAME.trim();
    }

    // Strategy 2: Concatenate FIRSTNAME + LASTNAME
    const firstName = attributes.FIRSTNAME && typeof attributes.FIRSTNAME === 'string'
      ? attributes.FIRSTNAME.trim()
      : '';
    const lastName = attributes.LASTNAME && typeof attributes.LASTNAME === 'string'
      ? attributes.LASTNAME.trim()
      : '';

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    if (firstName) {
      return firstName;
    }

    if (lastName) {
      return lastName;
    }

    // Strategy 3: No name available
    return null;
  }
}
