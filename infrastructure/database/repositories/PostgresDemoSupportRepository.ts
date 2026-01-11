/**
 * PostgresDemoSupportRepository
 *
 * PostgreSQL implementation of IDemoSupportRepository using Vercel Postgres.
 * Handles demo support tracking and analytics.
 *
 * Clean Architecture: Infrastructure layer implements domain interface.
 */

import { sql } from '@/lib/db';
import { DemoSupport } from '@/domain/entities/DemoSupport';
import { DEMO_SUPPORT_TYPES } from '@/domain/types/demo-types';
import type {
  IDemoSupportRepository,
  CreateDemoSupportInput,
  UpdateDemoSupportInput,
  DemoSupportStats,
} from '@/domain/repositories/IDemoSupportRepository';
import type { DemoSupportType } from '@/domain/types/demo-types';

export class PostgresDemoSupportRepository implements IDemoSupportRepository {
  /**
   * Creates a new demo support record
   */
  async create(input: CreateDemoSupportInput): Promise<DemoSupport> {
    const result = await sql`
      INSERT INTO demo_supports (
        id,
        demo_id,
        contact_id,
        user_id,
        support_type,
        platform,
        event_name,
        played_at,
        proof_url,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        ${input.id},
        ${input.demoId},
        ${input.contactId},
        ${input.userId},
        ${input.supportType},
        ${input.platform ?? null},
        ${input.eventName ?? null},
        ${input.playedAt ?? null},
        ${input.proofUrl ?? null},
        ${input.notes ?? null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING
        id,
        demo_id,
        contact_id,
        user_id,
        support_type,
        platform,
        event_name,
        played_at,
        proof_url,
        notes,
        created_at,
        updated_at
    `;

    const row = result.rows[0];
    return DemoSupport.fromDatabase({
      id: row.id,
      demo_id: row.demo_id,
      contact_id: row.contact_id,
      user_id: String(row.user_id),
      support_type: row.support_type,
      platform: row.platform,
      event_name: row.event_name,
      played_at: row.played_at,
      proof_url: row.proof_url,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Finds a demo support record by ID
   */
  async findById(supportId: string): Promise<DemoSupport | null> {
    const result = await sql`
      SELECT
        id,
        demo_id,
        contact_id,
        user_id,
        support_type,
        platform,
        event_name,
        played_at,
        proof_url,
        notes,
        created_at,
        updated_at
      FROM demo_supports
      WHERE id = ${supportId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return DemoSupport.fromDatabase({
      id: row.id,
      demo_id: row.demo_id,
      contact_id: row.contact_id,
      user_id: String(row.user_id),
      support_type: row.support_type,
      platform: row.platform,
      event_name: row.event_name,
      played_at: row.played_at,
      proof_url: row.proof_url,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Finds all support records for a specific demo
   */
  async findByDemoId(demoId: string): Promise<DemoSupport[]> {
    const result = await sql`
      SELECT
        id,
        demo_id,
        contact_id,
        user_id,
        support_type,
        platform,
        event_name,
        played_at,
        proof_url,
        notes,
        created_at,
        updated_at
      FROM demo_supports
      WHERE demo_id = ${demoId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) =>
      DemoSupport.fromDatabase({
        id: row.id,
        demo_id: row.demo_id,
        contact_id: row.contact_id,
        user_id: String(row.user_id),
        support_type: row.support_type,
        platform: row.platform,
        event_name: row.event_name,
        played_at: row.played_at,
        proof_url: row.proof_url,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  /**
   * Finds all support records for a specific contact
   */
  async findByContactId(contactId: number): Promise<DemoSupport[]> {
    const result = await sql`
      SELECT
        id,
        demo_id,
        contact_id,
        user_id,
        support_type,
        platform,
        event_name,
        played_at,
        proof_url,
        notes,
        created_at,
        updated_at
      FROM demo_supports
      WHERE contact_id = ${contactId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) =>
      DemoSupport.fromDatabase({
        id: row.id,
        demo_id: row.demo_id,
        contact_id: row.contact_id,
        user_id: String(row.user_id),
        support_type: row.support_type,
        platform: row.platform,
        event_name: row.event_name,
        played_at: row.played_at,
        proof_url: row.proof_url,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  /**
   * Finds all support records for a specific user
   */
  async findByUserId(userId: number): Promise<DemoSupport[]> {
    const result = await sql`
      SELECT
        id,
        demo_id,
        contact_id,
        user_id,
        support_type,
        platform,
        event_name,
        played_at,
        proof_url,
        notes,
        created_at,
        updated_at
      FROM demo_supports
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) =>
      DemoSupport.fromDatabase({
        id: row.id,
        demo_id: row.demo_id,
        contact_id: row.contact_id,
        user_id: String(row.user_id),
        support_type: row.support_type,
        platform: row.platform,
        event_name: row.event_name,
        played_at: row.played_at,
        proof_url: row.proof_url,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  /**
   * Updates a demo support record
   */
  async update(
    supportId: string,
    userId: number,
    input: UpdateDemoSupportInput
  ): Promise<DemoSupport> {
    // Build dynamic SET clause based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.supportType !== undefined) {
      updates.push(`support_type = $${paramIndex++}`);
      values.push(input.supportType);
    }
    if (input.platform !== undefined) {
      updates.push(`platform = $${paramIndex++}`);
      values.push(input.platform);
    }
    if (input.eventName !== undefined) {
      updates.push(`event_name = $${paramIndex++}`);
      values.push(input.eventName);
    }
    if (input.playedAt !== undefined) {
      updates.push(`played_at = $${paramIndex++}`);
      values.push(input.playedAt);
    }
    if (input.proofUrl !== undefined) {
      updates.push(`proof_url = $${paramIndex++}`);
      values.push(input.proofUrl);
    }
    if (input.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(input.notes);
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // Only updated_at would be updated, just fetch existing
      const existing = await this.findById(supportId);
      if (!existing) {
        throw new Error('Demo support record not found or access denied');
      }
      // Verify ownership
      if (existing.userId !== String(userId)) {
        throw new Error('Demo support record not found or access denied');
      }
      return existing;
    }

    // Add WHERE clause parameters
    values.push(supportId);
    values.push(userId);

    const result = await sql.query(
      `
      UPDATE demo_supports
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING
        id,
        demo_id,
        contact_id,
        user_id,
        support_type,
        platform,
        event_name,
        played_at,
        proof_url,
        notes,
        created_at,
        updated_at
      `,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Demo support record not found or access denied');
    }

    const row = result.rows[0];
    return DemoSupport.fromDatabase({
      id: row.id,
      demo_id: row.demo_id,
      contact_id: row.contact_id,
      user_id: String(row.user_id),
      support_type: row.support_type,
      platform: row.platform,
      event_name: row.event_name,
      played_at: row.played_at,
      proof_url: row.proof_url,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Deletes a demo support record
   */
  async delete(supportId: string, userId: number): Promise<void> {
    const result = await sql`
      DELETE FROM demo_supports
      WHERE id = ${supportId} AND user_id = ${userId}
    `;

    if (result.rowCount === 0) {
      throw new Error('Demo support record not found or access denied');
    }
  }

  /**
   * Gets support statistics for a specific demo
   */
  async getStatsByDemo(demoId: string): Promise<DemoSupportStats> {
    // Get total supports and breakdown by type
    const statsResult = await sql`
      SELECT
        COUNT(*)::int as total_supports,
        support_type,
        COUNT(*)::int as count
      FROM demo_supports
      WHERE demo_id = ${demoId}
      GROUP BY support_type
    `;

    // Get top supporting DJs
    const topDJsResult = await sql`
      SELECT
        ds.contact_id,
        c.email,
        c.name,
        COUNT(*)::int as count
      FROM demo_supports ds
      INNER JOIN contacts c ON c.id = ds.contact_id
      WHERE ds.demo_id = ${demoId}
      GROUP BY ds.contact_id, c.email, c.name
      ORDER BY count DESC
      LIMIT 10
    `;

    // Build byType map
    const byType: Record<DemoSupportType, number> = {
      [DEMO_SUPPORT_TYPES.RADIO]: 0,
      [DEMO_SUPPORT_TYPES.DJ_SET]: 0,
      [DEMO_SUPPORT_TYPES.PLAYLIST]: 0,
      [DEMO_SUPPORT_TYPES.SOCIAL_MEDIA]: 0,
      [DEMO_SUPPORT_TYPES.PODCAST]: 0,
      [DEMO_SUPPORT_TYPES.OTHER]: 0,
    };

    let totalSupports = 0;
    for (const row of statsResult.rows) {
      byType[row.support_type as DemoSupportType] = row.count;
      totalSupports += row.count;
    }

    // Build topDJs array
    const topDJs = topDJsResult.rows.map((row: any) => ({
      contactId: row.contact_id,
      email: row.email,
      name: row.name,
      count: row.count,
    }));

    return {
      totalSupports,
      byType,
      topDJs,
    };
  }

  /**
   * Gets support statistics for all demos by a user
   */
  async getStatsByUser(userId: number): Promise<DemoSupportStats> {
    // Get total supports and breakdown by type
    const statsResult = await sql`
      SELECT
        COUNT(*)::int as total_supports,
        support_type,
        COUNT(*)::int as count
      FROM demo_supports
      WHERE user_id = ${userId}
      GROUP BY support_type
    `;

    // Get top supporting DJs
    const topDJsResult = await sql`
      SELECT
        ds.contact_id,
        c.email,
        c.name,
        COUNT(*)::int as count
      FROM demo_supports ds
      INNER JOIN contacts c ON c.id = ds.contact_id
      WHERE ds.user_id = ${userId}
      GROUP BY ds.contact_id, c.email, c.name
      ORDER BY count DESC
      LIMIT 10
    `;

    // Build byType map
    const byType: Record<DemoSupportType, number> = {
      [DEMO_SUPPORT_TYPES.RADIO]: 0,
      [DEMO_SUPPORT_TYPES.DJ_SET]: 0,
      [DEMO_SUPPORT_TYPES.PLAYLIST]: 0,
      [DEMO_SUPPORT_TYPES.SOCIAL_MEDIA]: 0,
      [DEMO_SUPPORT_TYPES.PODCAST]: 0,
      [DEMO_SUPPORT_TYPES.OTHER]: 0,
    };

    let totalSupports = 0;
    for (const row of statsResult.rows) {
      byType[row.support_type as DemoSupportType] = row.count;
      totalSupports += row.count;
    }

    // Build topDJs array
    const topDJs = topDJsResult.rows.map((row: any) => ({
      contactId: row.contact_id,
      email: row.email,
      name: row.name,
      count: row.count,
    }));

    return {
      totalSupports,
      byType,
      topDJs,
    };
  }

  /**
   * Finds top DJs who supported a user's demos
   */
  async findTopSupportingDJs(
    userId: number,
    limit: number
  ): Promise<
    Array<{
      contactId: number;
      email: string;
      name: string | null;
      count: number;
    }>
  > {
    const result = await sql`
      SELECT
        ds.contact_id,
        c.email,
        c.name,
        COUNT(*)::int as count
      FROM demo_supports ds
      INNER JOIN contacts c ON c.id = ds.contact_id
      WHERE ds.user_id = ${userId}
      GROUP BY ds.contact_id, c.email, c.name
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    return result.rows.map((row: any) => ({
      contactId: row.contact_id,
      email: row.email,
      name: row.name,
      count: row.count,
    }));
  }
}
