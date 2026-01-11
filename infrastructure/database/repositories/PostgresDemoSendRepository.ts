/**
 * PostgresDemoSendRepository
 *
 * PostgreSQL implementation of IDemoSendRepository using Vercel Postgres.
 * Handles demo send tracking, engagement analytics, and idempotent updates.
 *
 * Clean Architecture: Infrastructure layer implements domain interface.
 */

import { sql } from '@/lib/db';
import { DemoSend } from '@/domain/entities/DemoSend';
import { DEMO_SEND_STATUS } from '@/domain/types/demo-types';
import type {
  IDemoSendRepository,
  CreateDemoSendInput,
  DemoSendStats,
} from '@/domain/repositories/IDemoSendRepository';

export class PostgresDemoSendRepository implements IDemoSendRepository {
  /**
   * Creates a new demo send record
   */
  async create(input: CreateDemoSendInput): Promise<DemoSend> {
    try {
      const result = await sql`
        INSERT INTO demo_sends (
          id,
          demo_id,
          contact_id,
          user_id,
          email_subject,
          email_body_html,
          personal_note,
          status,
          sent_at,
          resend_email_id,
          metadata,
          created_at
        )
        VALUES (
          ${input.id},
          ${input.demoId},
          ${input.contactId},
          ${input.userId},
          ${input.emailSubject},
          ${input.emailBodyHtml},
          ${input.personalNote ?? null},
          ${DEMO_SEND_STATUS.SENT},
          CURRENT_TIMESTAMP,
          ${input.resendEmailId ?? null},
          ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb,
          CURRENT_TIMESTAMP
        )
        RETURNING
          id,
          demo_id,
          contact_id,
          user_id,
          email_subject,
          email_body_html,
          personal_note,
          status,
          sent_at,
          opened_at,
          clicked_at,
          resend_email_id,
          metadata,
          created_at
      `;

      const row = result.rows[0];
      return DemoSend.fromDatabase({
        id: row.id,
        demo_id: row.demo_id,
        contact_id: row.contact_id,
        user_id: String(row.user_id),
        email_subject: row.email_subject,
        email_body_html: row.email_body_html,
        personal_note: row.personal_note,
        status: row.status,
        sent_at: row.sent_at,
        opened_at: row.opened_at,
        clicked_at: row.clicked_at,
        resend_email_id: row.resend_email_id,
        metadata: row.metadata,
        created_at: row.created_at,
      });
    } catch (error: any) {
      // Handle unique constraint violation (demo_id, contact_id)
      if (error.code === '23505') {
        throw new Error('Demo already sent to this contact');
      }
      throw error;
    }
  }

  /**
   * Finds a demo send by ID
   */
  async findById(sendId: string): Promise<DemoSend | null> {
    const result = await sql`
      SELECT
        id,
        demo_id,
        contact_id,
        user_id,
        email_subject,
        email_body_html,
        personal_note,
        status,
        sent_at,
        opened_at,
        clicked_at,
        resend_email_id,
        metadata,
        created_at
      FROM demo_sends
      WHERE id = ${sendId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return DemoSend.fromDatabase({
      id: row.id,
      demo_id: row.demo_id,
      contact_id: row.contact_id,
      user_id: String(row.user_id),
      email_subject: row.email_subject,
      email_body_html: row.email_body_html,
      personal_note: row.personal_note,
      status: row.status,
      sent_at: row.sent_at,
      opened_at: row.opened_at,
      clicked_at: row.clicked_at,
      resend_email_id: row.resend_email_id,
      metadata: row.metadata,
      created_at: row.created_at,
    });
  }

  /**
   * Finds all sends for a specific demo
   */
  async findByDemoId(demoId: string): Promise<DemoSend[]> {
    const result = await sql`
      SELECT
        id,
        demo_id,
        contact_id,
        user_id,
        email_subject,
        email_body_html,
        personal_note,
        status,
        sent_at,
        opened_at,
        clicked_at,
        resend_email_id,
        metadata,
        created_at
      FROM demo_sends
      WHERE demo_id = ${demoId}
      ORDER BY sent_at DESC
    `;

    return result.rows.map((row: any) =>
      DemoSend.fromDatabase({
        id: row.id,
        demo_id: row.demo_id,
        contact_id: row.contact_id,
        user_id: String(row.user_id),
        email_subject: row.email_subject,
        email_body_html: row.email_body_html,
        personal_note: row.personal_note,
        status: row.status,
        sent_at: row.sent_at,
        opened_at: row.opened_at,
        clicked_at: row.clicked_at,
        resend_email_id: row.resend_email_id,
        metadata: row.metadata,
        created_at: row.created_at,
      })
    );
  }

  /**
   * Finds all demos sent to a specific contact
   */
  async findByContactId(contactId: number): Promise<DemoSend[]> {
    const result = await sql`
      SELECT
        id,
        demo_id,
        contact_id,
        user_id,
        email_subject,
        email_body_html,
        personal_note,
        status,
        sent_at,
        opened_at,
        clicked_at,
        resend_email_id,
        metadata,
        created_at
      FROM demo_sends
      WHERE contact_id = ${contactId}
      ORDER BY sent_at DESC
    `;

    return result.rows.map((row: any) =>
      DemoSend.fromDatabase({
        id: row.id,
        demo_id: row.demo_id,
        contact_id: row.contact_id,
        user_id: String(row.user_id),
        email_subject: row.email_subject,
        email_body_html: row.email_body_html,
        personal_note: row.personal_note,
        status: row.status,
        sent_at: row.sent_at,
        opened_at: row.opened_at,
        clicked_at: row.clicked_at,
        resend_email_id: row.resend_email_id,
        metadata: row.metadata,
        created_at: row.created_at,
      })
    );
  }

  /**
   * Finds all demo sends for a specific user
   */
  async findByUserId(userId: number): Promise<DemoSend[]> {
    const result = await sql`
      SELECT
        id,
        demo_id,
        contact_id,
        user_id,
        email_subject,
        email_body_html,
        personal_note,
        status,
        sent_at,
        opened_at,
        clicked_at,
        resend_email_id,
        metadata,
        created_at
      FROM demo_sends
      WHERE user_id = ${userId}
      ORDER BY sent_at DESC
    `;

    return result.rows.map((row: any) =>
      DemoSend.fromDatabase({
        id: row.id,
        demo_id: row.demo_id,
        contact_id: row.contact_id,
        user_id: String(row.user_id),
        email_subject: row.email_subject,
        email_body_html: row.email_body_html,
        personal_note: row.personal_note,
        status: row.status,
        sent_at: row.sent_at,
        opened_at: row.opened_at,
        clicked_at: row.clicked_at,
        resend_email_id: row.resend_email_id,
        metadata: row.metadata,
        created_at: row.created_at,
      })
    );
  }

  /**
   * Marks a demo send as opened (idempotent)
   */
  async markAsOpened(sendId: string, timestamp: Date): Promise<DemoSend> {
    const result = await sql`
      UPDATE demo_sends
      SET
        status = ${DEMO_SEND_STATUS.OPENED},
        opened_at = CASE
          WHEN opened_at IS NULL THEN ${timestamp}
          ELSE opened_at
        END
      WHERE id = ${sendId}
      RETURNING
        id,
        demo_id,
        contact_id,
        user_id,
        email_subject,
        email_body_html,
        personal_note,
        status,
        sent_at,
        opened_at,
        clicked_at,
        resend_email_id,
        metadata,
        created_at
    `;

    if (result.rows.length === 0) {
      throw new Error('Demo send not found');
    }

    const row = result.rows[0];
    return DemoSend.fromDatabase({
      id: row.id,
      demo_id: row.demo_id,
      contact_id: row.contact_id,
      user_id: String(row.user_id),
      email_subject: row.email_subject,
      email_body_html: row.email_body_html,
      personal_note: row.personal_note,
      status: row.status,
      sent_at: row.sent_at,
      opened_at: row.opened_at,
      clicked_at: row.clicked_at,
      resend_email_id: row.resend_email_id,
      metadata: row.metadata,
      created_at: row.created_at,
    });
  }

  /**
   * Marks a demo send as clicked (idempotent, also marks as opened)
   */
  async markAsClicked(sendId: string, timestamp: Date): Promise<DemoSend> {
    const result = await sql`
      UPDATE demo_sends
      SET
        status = ${DEMO_SEND_STATUS.CLICKED},
        opened_at = CASE
          WHEN opened_at IS NULL THEN ${timestamp}
          ELSE opened_at
        END,
        clicked_at = CASE
          WHEN clicked_at IS NULL THEN ${timestamp}
          ELSE clicked_at
        END
      WHERE id = ${sendId}
      RETURNING
        id,
        demo_id,
        contact_id,
        user_id,
        email_subject,
        email_body_html,
        personal_note,
        status,
        sent_at,
        opened_at,
        clicked_at,
        resend_email_id,
        metadata,
        created_at
    `;

    if (result.rows.length === 0) {
      throw new Error('Demo send not found');
    }

    const row = result.rows[0];
    return DemoSend.fromDatabase({
      id: row.id,
      demo_id: row.demo_id,
      contact_id: row.contact_id,
      user_id: String(row.user_id),
      email_subject: row.email_subject,
      email_body_html: row.email_body_html,
      personal_note: row.personal_note,
      status: row.status,
      sent_at: row.sent_at,
      opened_at: row.opened_at,
      clicked_at: row.clicked_at,
      resend_email_id: row.resend_email_id,
      metadata: row.metadata,
      created_at: row.created_at,
    });
  }

  /**
   * Gets engagement statistics for a specific demo
   */
  async getStatsByDemo(demoId: string): Promise<DemoSendStats> {
    const result = await sql`
      SELECT
        COUNT(*)::int as total_sent,
        COUNT(opened_at)::int as total_opened,
        COUNT(clicked_at)::int as total_clicked
      FROM demo_sends
      WHERE demo_id = ${demoId}
    `;

    const row = result.rows[0];
    const totalSent = row.total_sent;
    const totalOpened = row.total_opened;
    const totalClicked = row.total_clicked;

    return {
      totalSent,
      totalOpened,
      totalClicked,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    };
  }

  /**
   * Gets engagement statistics for all demos by a user
   */
  async getStatsByUser(userId: number): Promise<DemoSendStats> {
    const result = await sql`
      SELECT
        COUNT(*)::int as total_sent,
        COUNT(opened_at)::int as total_opened,
        COUNT(clicked_at)::int as total_clicked
      FROM demo_sends
      WHERE user_id = ${userId}
    `;

    const row = result.rows[0];
    const totalSent = row.total_sent;
    const totalOpened = row.total_opened;
    const totalClicked = row.total_clicked;

    return {
      totalSent,
      totalOpened,
      totalClicked,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    };
  }

  /**
   * Finds all demo sends for a specific contact email (GDPR compliance)
   */
  async findByContactEmail(email: string): Promise<DemoSend[]> {
    const result = await sql`
      SELECT
        ds.id,
        ds.demo_id,
        ds.contact_id,
        ds.user_id,
        ds.email_subject,
        ds.email_body_html,
        ds.personal_note,
        ds.status,
        ds.sent_at,
        ds.opened_at,
        ds.clicked_at,
        ds.resend_email_id,
        ds.metadata,
        ds.created_at
      FROM demo_sends ds
      INNER JOIN contacts c ON c.id = ds.contact_id
      WHERE LOWER(c.email) = LOWER(${email})
      ORDER BY ds.sent_at DESC
    `;

    return result.rows.map((row: any) =>
      DemoSend.fromDatabase({
        id: row.id,
        demo_id: row.demo_id,
        contact_id: row.contact_id,
        user_id: String(row.user_id),
        email_subject: row.email_subject,
        email_body_html: row.email_body_html,
        personal_note: row.personal_note,
        status: row.status,
        sent_at: row.sent_at,
        opened_at: row.opened_at,
        clicked_at: row.clicked_at,
        resend_email_id: row.resend_email_id,
        metadata: row.metadata,
        created_at: row.created_at,
      })
    );
  }

  /**
   * Checks if a demo has already been sent to a contact
   */
  async hasBeenSent(demoId: string, contactId: number): Promise<boolean> {
    const result = await sql`
      SELECT EXISTS(
        SELECT 1
        FROM demo_sends
        WHERE demo_id = ${demoId} AND contact_id = ${contactId}
      ) as exists
    `;

    return result.rows[0].exists;
  }
}
