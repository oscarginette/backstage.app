/**
 * PostgresDemoRepository
 *
 * PostgreSQL implementation of IDemoRepository using Vercel Postgres.
 * Handles all demo persistence operations with ownership validation.
 *
 * Clean Architecture: Infrastructure layer implements domain interface.
 */

import { sql } from '@/lib/db';
import { Demo } from '@/domain/entities/Demo';
import type {
  IDemoRepository,
  CreateDemoInput,
  UpdateDemoInput,
} from '@/domain/repositories/IDemoRepository';

export class PostgresDemoRepository implements IDemoRepository {
  /**
   * Creates a new demo
   */
  async create(input: CreateDemoInput): Promise<Demo> {
    const result = await sql`
      INSERT INTO demos (
        id,
        user_id,
        title,
        artist_name,
        genre,
        bpm,
        key,
        file_url,
        artwork_url,
        waveform_url,
        duration_seconds,
        release_date,
        notes,
        active,
        created_at,
        updated_at
      )
      VALUES (
        ${input.id},
        ${input.userId},
        ${input.title},
        ${input.artistName},
        ${input.genre ?? null},
        ${input.bpm ?? null},
        ${input.key ?? null},
        ${input.fileUrl},
        ${input.artworkUrl ?? null},
        ${input.waveformUrl ?? null},
        ${input.durationSeconds ?? null},
        ${input.releaseDate ?? null},
        ${input.notes ?? null},
        ${input.active ?? true},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING
        id,
        user_id,
        title,
        artist_name,
        genre,
        bpm,
        key,
        file_url,
        artwork_url,
        waveform_url,
        duration_seconds,
        release_date,
        notes,
        active,
        created_at,
        updated_at
    `;

    const row = result.rows[0];
    return Demo.fromDatabase({
      id: row.id,
      user_id: String(row.user_id), // Convert Int to string for entity
      title: row.title,
      artist_name: row.artist_name,
      genre: row.genre,
      bpm: row.bpm,
      key: row.key,
      file_url: row.file_url,
      artwork_url: row.artwork_url,
      waveform_url: row.waveform_url,
      duration_seconds: row.duration_seconds,
      release_date: row.release_date,
      notes: row.notes,
      active: row.active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Finds a demo by ID for a specific user
   */
  async findById(demoId: string, userId: number): Promise<Demo | null> {
    const result = await sql`
      SELECT
        id,
        user_id,
        title,
        artist_name,
        genre,
        bpm,
        key,
        file_url,
        artwork_url,
        waveform_url,
        duration_seconds,
        release_date,
        notes,
        active,
        created_at,
        updated_at
      FROM demos
      WHERE id = ${demoId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return Demo.fromDatabase({
      id: row.id,
      user_id: String(row.user_id),
      title: row.title,
      artist_name: row.artist_name,
      genre: row.genre,
      bpm: row.bpm,
      key: row.key,
      file_url: row.file_url,
      artwork_url: row.artwork_url,
      waveform_url: row.waveform_url,
      duration_seconds: row.duration_seconds,
      release_date: row.release_date,
      notes: row.notes,
      active: row.active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Finds all demos for a specific user
   */
  async findByUserId(userId: number): Promise<Demo[]> {
    const result = await sql`
      SELECT
        id,
        user_id,
        title,
        artist_name,
        genre,
        bpm,
        key,
        file_url,
        artwork_url,
        waveform_url,
        duration_seconds,
        release_date,
        notes,
        active,
        created_at,
        updated_at
      FROM demos
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) =>
      Demo.fromDatabase({
        id: row.id,
        user_id: String(row.user_id),
        title: row.title,
        artist_name: row.artist_name,
        genre: row.genre,
        bpm: row.bpm,
        key: row.key,
        file_url: row.file_url,
        artwork_url: row.artwork_url,
        waveform_url: row.waveform_url,
        duration_seconds: row.duration_seconds,
        release_date: row.release_date,
        notes: row.notes,
        active: row.active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  /**
   * Finds only active demos for a specific user
   */
  async findActiveByUserId(userId: number): Promise<Demo[]> {
    const result = await sql`
      SELECT
        id,
        user_id,
        title,
        artist_name,
        genre,
        bpm,
        key,
        file_url,
        artwork_url,
        waveform_url,
        duration_seconds,
        release_date,
        notes,
        active,
        created_at,
        updated_at
      FROM demos
      WHERE user_id = ${userId} AND active = true
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) =>
      Demo.fromDatabase({
        id: row.id,
        user_id: String(row.user_id),
        title: row.title,
        artist_name: row.artist_name,
        genre: row.genre,
        bpm: row.bpm,
        key: row.key,
        file_url: row.file_url,
        artwork_url: row.artwork_url,
        waveform_url: row.waveform_url,
        duration_seconds: row.duration_seconds,
        release_date: row.release_date,
        notes: row.notes,
        active: row.active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  /**
   * Updates a demo
   */
  async update(
    demoId: string,
    userId: number,
    input: UpdateDemoInput
  ): Promise<Demo> {
    // Build dynamic SET clause based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }
    if (input.artistName !== undefined) {
      updates.push(`artist_name = $${paramIndex++}`);
      values.push(input.artistName);
    }
    if (input.genre !== undefined) {
      updates.push(`genre = $${paramIndex++}`);
      values.push(input.genre);
    }
    if (input.bpm !== undefined) {
      updates.push(`bpm = $${paramIndex++}`);
      values.push(input.bpm);
    }
    if (input.key !== undefined) {
      updates.push(`key = $${paramIndex++}`);
      values.push(input.key);
    }
    if (input.artworkUrl !== undefined) {
      updates.push(`artwork_url = $${paramIndex++}`);
      values.push(input.artworkUrl);
    }
    if (input.waveformUrl !== undefined) {
      updates.push(`waveform_url = $${paramIndex++}`);
      values.push(input.waveformUrl);
    }
    if (input.releaseDate !== undefined) {
      updates.push(`release_date = $${paramIndex++}`);
      values.push(input.releaseDate);
    }
    if (input.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(input.notes);
    }
    if (input.active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      values.push(input.active);
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // Only updated_at would be updated, just fetch existing
      const existing = await this.findById(demoId, userId);
      if (!existing) {
        throw new Error('Demo not found or access denied');
      }
      return existing;
    }

    // Add WHERE clause parameters
    values.push(demoId);
    values.push(userId);

    const result = await sql.query(
      `
      UPDATE demos
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING
        id,
        user_id,
        title,
        artist_name,
        genre,
        bpm,
        key,
        file_url,
        artwork_url,
        waveform_url,
        duration_seconds,
        release_date,
        notes,
        active,
        created_at,
        updated_at
      `,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Demo not found or access denied');
    }

    const row = result.rows[0];
    return Demo.fromDatabase({
      id: row.id,
      user_id: String(row.user_id),
      title: row.title,
      artist_name: row.artist_name,
      genre: row.genre,
      bpm: row.bpm,
      key: row.key,
      file_url: row.file_url,
      artwork_url: row.artwork_url,
      waveform_url: row.waveform_url,
      duration_seconds: row.duration_seconds,
      release_date: row.release_date,
      notes: row.notes,
      active: row.active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Deletes a demo (soft delete by setting active = false)
   */
  async delete(demoId: string, userId: number): Promise<void> {
    const result = await sql`
      UPDATE demos
      SET active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${demoId} AND user_id = ${userId}
    `;

    if (result.rowCount === 0) {
      throw new Error('Demo not found or access denied');
    }
  }

  /**
   * Counts total demos for a user
   */
  async countByUserId(userId: number): Promise<number> {
    const result = await sql`
      SELECT COUNT(*)::int as count
      FROM demos
      WHERE user_id = ${userId}
    `;

    return result.rows[0].count;
  }

  /**
   * Finds demos by genre for a specific user
   */
  async findByGenre(userId: number, genre: string): Promise<Demo[]> {
    const result = await sql`
      SELECT
        id,
        user_id,
        title,
        artist_name,
        genre,
        bpm,
        key,
        file_url,
        artwork_url,
        waveform_url,
        duration_seconds,
        release_date,
        notes,
        active,
        created_at,
        updated_at
      FROM demos
      WHERE user_id = ${userId} AND LOWER(genre) = LOWER(${genre})
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) =>
      Demo.fromDatabase({
        id: row.id,
        user_id: String(row.user_id),
        title: row.title,
        artist_name: row.artist_name,
        genre: row.genre,
        bpm: row.bpm,
        key: row.key,
        file_url: row.file_url,
        artwork_url: row.artwork_url,
        waveform_url: row.waveform_url,
        duration_seconds: row.duration_seconds,
        release_date: row.release_date,
        notes: row.notes,
        active: row.active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }
}
