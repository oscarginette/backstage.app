/**
 * PostgresEmailSignatureRepository
 *
 * PostgreSQL implementation of IEmailSignatureRepository.
 */

import { IEmailSignatureRepository } from '@/domain/repositories/IEmailSignatureRepository';
import {
  EmailSignature,
  SocialLink,
} from '@/domain/value-objects/EmailSignature';
import { sql } from '@vercel/postgres';

export class PostgresEmailSignatureRepository
  implements IEmailSignatureRepository
{
  async findByUserId(userId: number): Promise<EmailSignature | null> {
    const result = await sql`
      SELECT logo_url, custom_text, social_links, default_to_geebeat
      FROM email_signatures
      WHERE user_id = ${userId}
    `;

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];
    return new EmailSignature(
      row.logo_url,
      row.custom_text,
      row.social_links as SocialLink[],
      row.default_to_geebeat
    );
  }

  async upsert(userId: number, signature: EmailSignature): Promise<void> {
    const data = signature.toJSON();

    await sql`
      INSERT INTO email_signatures (
        user_id,
        logo_url,
        custom_text,
        social_links,
        default_to_geebeat,
        updated_at
      )
      VALUES (
        ${userId},
        ${data.logoUrl},
        ${data.customText},
        ${JSON.stringify(data.socialLinks)}::jsonb,
        ${data.defaultToGeeBeat},
        NOW()
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        logo_url = EXCLUDED.logo_url,
        custom_text = EXCLUDED.custom_text,
        social_links = EXCLUDED.social_links,
        default_to_geebeat = EXCLUDED.default_to_geebeat,
        updated_at = NOW()
    `;
  }

  async delete(userId: number): Promise<void> {
    await sql`
      DELETE FROM email_signatures
      WHERE user_id = ${userId}
    `;
  }
}
