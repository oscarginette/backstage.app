import { sql } from '@/lib/db';
import {
  IContactRepository,
  Contact,
  ContactStats,
  BulkImportContactInput,
  BulkImportResult
} from '@/domain/repositories/IContactRepository';
import type { ContactMetadata } from '@/domain/types/metadata';

export class PostgresContactRepository implements IContactRepository {
  async getSubscribed(userId: number): Promise<Contact[]> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at
      FROM contacts
      WHERE subscribed = true AND user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      unsubscribeToken: row.unsubscribe_token,
      subscribed: row.subscribed,
      createdAt: row.created_at
    }));
  }

  async findByEmail(email: string, userId: number): Promise<Contact | null> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at
      FROM contacts
      WHERE LOWER(email) = LOWER(${email}) AND user_id = ${userId}
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      unsubscribeToken: row.unsubscribe_token,
      subscribed: row.subscribed,
      createdAt: row.created_at
    };
  }

  async findByUnsubscribeToken(token: string): Promise<Contact | null> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at, user_id
      FROM contacts
      WHERE unsubscribe_token = ${token}
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      unsubscribeToken: row.unsubscribe_token,
      subscribed: row.subscribed,
      createdAt: row.created_at,
      userId: row.user_id
    };
  }

  async updateSubscriptionStatus(id: number, subscribed: boolean, userId: number): Promise<void> {
    await sql`
      UPDATE contacts
      SET subscribed = ${subscribed}
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }

  async unsubscribe(id: number): Promise<void> {
    await sql`
      UPDATE contacts
      SET
        subscribed = false,
        unsubscribed_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  }

  async resubscribe(id: number, userId: number): Promise<void> {
    await sql`
      UPDATE contacts
      SET
        subscribed = true,
        unsubscribed_at = NULL
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }

  async findAll(userId: number): Promise<Contact[]> {
    const result = await sql`
      SELECT id, email, name, unsubscribe_token, subscribed, created_at, source, unsubscribed_at, metadata
      FROM contacts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      unsubscribeToken: row.unsubscribe_token,
      subscribed: row.subscribed,
      createdAt: row.created_at,
      source: row.source,
      unsubscribedAt: row.unsubscribed_at,
      metadata: row.metadata as ContactMetadata | undefined
    }));
  }

  async getStats(userId: number): Promise<ContactStats> {
    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
        COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
        COUNT(*) as total_contacts,
        COUNT(*) FILTER (WHERE source = 'hypeddit') as from_hypeddit,
        COUNT(*) FILTER (WHERE source = 'hypedit') as from_hypedit,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_last_30_days,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_last_7_days
      FROM contacts
      WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      return {
        totalContacts: 0,
        activeSubscribers: 0,
        unsubscribed: 0,
        fromHypeddit: 0,
        fromHypedit: 0,
        newLast30Days: 0,
        newLast7Days: 0
      };
    }

    const row = result.rows[0];
    return {
      totalContacts: Number(row.total_contacts),
      activeSubscribers: Number(row.active_subscribers),
      unsubscribed: Number(row.unsubscribed),
      fromHypeddit: Number(row.from_hypeddit),
      fromHypedit: Number(row.from_hypedit),
      newLast30Days: Number(row.new_last_30_days),
      newLast7Days: Number(row.new_last_7_days)
    };
  }

  async delete(ids: number[], userId: number): Promise<number> {
    if (ids.length === 0) return 0;

    const result = await sql`
      DELETE FROM contacts
      WHERE id = ANY(${ids}) AND user_id = ${userId}
    `;

    return result.rowCount || 0;
  }

  async bulkImport(contacts: BulkImportContactInput[]): Promise<BulkImportResult> {
    if (contacts.length === 0) {
      return { inserted: 0, updated: 0, skipped: 0, errors: [] };
    }

    // For Neon compatibility, use fallback approach directly
    // Neon with pooling doesn't support sql.array() in production
    console.log('[BulkImport] Processing contacts individually (Neon compatible)');
    return this.bulkImportFallback(contacts);
  }

  /**
   * Fallback: Process contacts individually when batch insert fails
   * Used for error handling and reporting which specific contacts failed
   */
  private async bulkImportFallback(contacts: BulkImportContactInput[]): Promise<BulkImportResult> {
    console.log('[BulkImport] Using fallback individual inserts');

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const contact of contacts) {
      try {
        // Stringify metadata - PostgreSQL will infer JSONB type from column definition
        const metadataJson = JSON.stringify(contact.metadata || {});

        const result = await sql`
          INSERT INTO contacts (
            user_id,
            email,
            name,
            source,
            subscribed,
            metadata
          )
          VALUES (
            ${contact.userId},
            ${contact.email.toLowerCase().trim()},
            ${contact.name || null},
            ${contact.source},
            ${contact.subscribed},
            ${metadataJson}
          )
          ON CONFLICT (user_id, email) DO UPDATE SET
            name = EXCLUDED.name,
            subscribed = EXCLUDED.subscribed,
            source = EXCLUDED.source,
            metadata = contacts.metadata || COALESCE(EXCLUDED.metadata, '{}'::jsonb)
          RETURNING (xmax = 0) AS inserted
        `;

        if (result.rows.length > 0 && result.rows[0].inserted) {
          inserted++;
        } else {
          updated++;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[BulkImport] Error importing contact ${contact.email}:`, errorMessage);
        errors.push({
          email: contact.email,
          error: errorMessage
        });
        skipped++;
      }
    }

    return {
      inserted,
      updated,
      skipped,
      errors
    };
  }

  /**
   * Count total contacts for a user (used for quota checks)
   * @param userId - User identifier
   * @returns Total number of contacts for the user
   */
  async countByUserId(userId: number): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count
        FROM contacts
        WHERE user_id = ${userId}
      `;

      if (result.rows.length === 0) return 0;

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('PostgresContactRepository.countByUserId error:', error);
      throw new Error(
        `Failed to count contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
