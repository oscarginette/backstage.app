/**
 * ImportBrevoContactsUseCase
 *
 * Handles importing contacts from Brevo into Backstage.
 * Clean Architecture + SOLID compliant.
 *
 * Business Logic:
 * - Validates user has active Brevo integration
 * - Fetches contacts from Brevo API (paginated)
 * - Imports/deduplicates contacts via bulk upsert
 * - Creates import history record for audit trail
 * - Returns import statistics
 *
 * GDPR Compliance:
 * - Preserves subscription status from Brevo
 * - Creates audit trail for all imports
 * - Tracks source of all contacts
 */

import type { IBrevoIntegrationRepository } from '@/domain/repositories/IBrevoIntegrationRepository';
import type { IBrevoImportHistoryRepository } from '@/domain/repositories/IBrevoImportHistoryRepository';
import type { IContactRepository, BulkImportContactInput } from '@/domain/repositories/IContactRepository';
import type { IBrevoAPIClient, BrevoContact } from '@/domain/repositories/IBrevoAPIClient';

/**
 * Input for import operation
 */
export interface ImportBrevoContactsInput {
  userId: number;
  previewLimit?: number;
}

/**
 * Result of import operation
 */
export interface ImportBrevoContactsResult {
  success: boolean;
  error?: string;
  import?: {
    contactsFetched: number;
    contactsInserted: number;
    contactsUpdated: number;
    contactsSkipped: number;
    listsProcessed: number;
    duration: number;
    hasErrors: boolean;
    errors?: string[];
  };
}

/**
 * Use Case for importing contacts from Brevo
 *
 * Dependencies injected via constructor (Dependency Inversion Principle)
 */
export class ImportBrevoContactsUseCase {
  constructor(
    private brevoIntegrationRepo: IBrevoIntegrationRepository,
    private brevoImportHistoryRepo: IBrevoImportHistoryRepository,
    private contactRepo: IContactRepository,
    private brevoClient: IBrevoAPIClient
  ) {}

  /**
   * Execute import operation
   *
   * Steps:
   * 1. Validate user has active Brevo integration
   * 2. Create import history record
   * 3. Fetch all lists from Brevo
   * 4. Fetch contacts from all lists (with pagination + deduplication)
   * 5. Import contacts via bulk upsert
   * 6. Update import history with results
   * 7. Update integration last sync timestamp
   *
   * @param input - Import parameters
   * @returns Import result with statistics
   */
  async execute(input: ImportBrevoContactsInput): Promise<ImportBrevoContactsResult> {
    const startTime = Date.now();
    let importHistoryId: number | null = null;

    try {
      // Step 1: Validate integration exists and is active
      const integration = await this.brevoIntegrationRepo.findByUserId(input.userId);

      if (!integration) {
        return {
          success: false,
          error: 'Brevo integration not found. Please connect your Brevo account first.'
        };
      }

      // Step 2: Create import history record
      const importHistory = await this.brevoImportHistoryRepo.create({
        userId: input.userId,
        integrationId: integration.id,
        status: 'running',
        previewUsed: !!input.previewLimit
      });

      importHistoryId = importHistory.id;

      console.log(`[User ${input.userId}] Starting Brevo import...`);

      // Step 3: Fetch all lists from Brevo
      const lists = await this.brevoClient.getLists();
      console.log(`[User ${input.userId}] Found ${lists.length} Brevo lists`);

      // Step 4: Fetch all contacts with deduplication
      // The Brevo client handles pagination and deduplication automatically
      const brevoContacts = await this.brevoClient.getContactsFromAllLists({
        limit: input.previewLimit
      });

      console.log(`[User ${input.userId}] Fetched ${brevoContacts.length} unique contacts from Brevo`);

      // Step 5: Transform Brevo contacts to our format
      const contactsToImport = this.transformBrevoContacts(brevoContacts, input.userId);

      // Step 6: Import contacts via bulk upsert
      const importResult = await this.contactRepo.bulkImport(contactsToImport);

      // Step 7: Calculate duration
      const duration = Date.now() - startTime;

      // Step 8: Update import history with results
      await this.brevoImportHistoryRepo.updateWithResults(importHistoryId, {
        contactsFetched: brevoContacts.length,
        contactsInserted: importResult.inserted,
        contactsUpdated: importResult.updated,
        contactsSkipped: importResult.skipped,
        listsProcessed: lists.length,
        status: 'completed',
        durationMs: duration,
        errorsDetail: importResult.errors.length > 0
          ? importResult.errors.slice(0, 50).map(e => e.error)
          : undefined
      });

      // Step 9: Update integration last sync timestamp
      await this.brevoIntegrationRepo.updateLastSync(integration.id);

      console.log(
        `[User ${input.userId}] Import completed: ${brevoContacts.length} fetched, ` +
        `${importResult.inserted} inserted, ${importResult.updated} updated`
      );

      // Step 10: Return success response
      return {
        success: true,
        import: {
          contactsFetched: brevoContacts.length,
          contactsInserted: importResult.inserted,
          contactsUpdated: importResult.updated,
          contactsSkipped: importResult.skipped,
          listsProcessed: lists.length,
          duration,
          hasErrors: importResult.errors.length > 0,
          errors: importResult.errors.length > 0
            ? importResult.errors.slice(0, 10).map(e => e.error)
            : undefined
        }
      };

    } catch (error: unknown) {
      console.error('[ImportBrevoContactsUseCase] Error:', error);

      // Calculate duration for failed import
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Mark import as failed
      if (importHistoryId) {
        await this.brevoImportHistoryRepo.updateWithResults(importHistoryId, {
          contactsFetched: 0,
          contactsInserted: 0,
          contactsUpdated: 0,
          contactsSkipped: 0,
          listsProcessed: 0,
          status: 'failed',
          durationMs: duration,
          errorMessage
        });
      }

      // Record error on integration
      if (importHistoryId) {
        const integration = await this.brevoIntegrationRepo.findByUserId(input.userId);
        if (integration) {
          await this.brevoIntegrationRepo.recordError(integration.id, errorMessage);
        }
      }

      return {
        success: false,
        error: 'Failed to import contacts from Brevo',
        import: {
          contactsFetched: 0,
          contactsInserted: 0,
          contactsUpdated: 0,
          contactsSkipped: 0,
          listsProcessed: 0,
          duration,
          hasErrors: true,
          errors: [errorMessage]
        }
      };
    }
  }

  /**
   * Transform Brevo contacts to our BulkImportContactInput format
   *
   * Maps Brevo fields to our contact schema:
   * - email → email
   * - attributes.FIRSTNAME/LASTNAME/NAME → name
   * - emailBlacklisted → !subscribed
   * - brevo_id, brevo_list_ids → metadata
   *
   * @param brevoContacts - Contacts from Brevo API
   * @param userId - User identifier
   * @returns Contacts in our import format
   */
  private transformBrevoContacts(
    brevoContacts: BrevoContact[],
    userId: number
  ): BulkImportContactInput[] {
    return brevoContacts.map(contact => {
      // Extract name from Brevo attributes
      const attrs = contact.attributes || {};
      const firstName = attrs.FIRSTNAME as string || '';
      const lastName = attrs.LASTNAME as string || '';
      const name = (attrs.NAME as string) ||
                   (firstName && lastName ? `${firstName} ${lastName}`.trim() : null);

      // Check subscription status (emailBlacklisted = unsubscribed)
      const subscribed = !contact.emailBlacklisted;

      // Prepare metadata (ContactMetadata compatible)
      const metadata: BulkImportContactInput['metadata'] = {
        externalId: contact.id.toString(),
        importedAt: new Date().toISOString(),
        source: 'brevo_import',
        originalData: {
          brevo_id: contact.id,
          brevo_list_ids: contact.listIds || [],
          attributes: attrs
        }
      };

      return {
        userId,
        email: contact.email,
        name,
        subscribed,
        source: 'brevo_import',
        metadata
      };
    });
  }
}
