import { sql } from '@/lib/db';
import {
  IEmailTemplateRepository,
  CreateTemplateInput,
  UpdateTemplateInput,
  FindTemplatesOptions
} from '@/domain/repositories/IEmailTemplateRepository';
import { EmailTemplate } from '@/domain/entities/EmailTemplate';

/**
 * PostgreSQL implementation of IEmailTemplateRepository
 * Follows Clean Architecture: Infrastructure layer implements Domain interface
 */
export class PostgresEmailTemplateRepository implements IEmailTemplateRepository {
  /**
   * Create a new template
   */
  async create(input: CreateTemplateInput): Promise<EmailTemplate> {
    const result = await sql`
      INSERT INTO email_templates (
        name,
        description,
        mjml_content,
        html_snapshot,
        is_default,
        parent_template_id
      )
      VALUES (
        ${input.name},
        ${input.description || null},
        ${JSON.stringify(input.mjmlContent)}::jsonb,
        ${input.htmlSnapshot},
        ${input.isDefault || false},
        ${input.parentTemplateId || null}
      )
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error('Failed to create template');
    }

    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Find template by ID
   */
  async findById(id: string): Promise<EmailTemplate | null> {
    const result = await sql`
      SELECT * FROM email_templates
      WHERE id = ${id}
    `;

    if (result.rows.length === 0) return null;
    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Find all templates with optional filters
   * Uses template literals for Vercel Postgres compatibility
   */
  async findAll(options?: FindTemplatesOptions): Promise<EmailTemplate[]> {
    const includeDeleted = options?.includeDeleted || false;
    const onlyDefault = options?.onlyDefault || false;
    const parentTemplateId = options?.parentTemplateId;

    let result;

    // Build conditional queries using template literals
    if (!includeDeleted && onlyDefault && parentTemplateId) {
      result = await sql`
        SELECT * FROM email_templates
        WHERE deleted_at IS NULL
          AND is_default = true
          AND parent_template_id = ${parentTemplateId}
        ORDER BY created_at DESC
      `;
    } else if (!includeDeleted && onlyDefault) {
      result = await sql`
        SELECT * FROM email_templates
        WHERE deleted_at IS NULL
          AND is_default = true
        ORDER BY created_at DESC
      `;
    } else if (!includeDeleted && parentTemplateId) {
      result = await sql`
        SELECT * FROM email_templates
        WHERE deleted_at IS NULL
          AND parent_template_id = ${parentTemplateId}
        ORDER BY created_at DESC
      `;
    } else if (onlyDefault && parentTemplateId) {
      result = await sql`
        SELECT * FROM email_templates
        WHERE is_default = true
          AND parent_template_id = ${parentTemplateId}
        ORDER BY created_at DESC
      `;
    } else if (!includeDeleted) {
      result = await sql`
        SELECT * FROM email_templates
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
      `;
    } else if (onlyDefault) {
      result = await sql`
        SELECT * FROM email_templates
        WHERE is_default = true
        ORDER BY created_at DESC
      `;
    } else if (parentTemplateId) {
      result = await sql`
        SELECT * FROM email_templates
        WHERE parent_template_id = ${parentTemplateId}
        ORDER BY created_at DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM email_templates
        ORDER BY created_at DESC
      `;
    }

    return result.rows.map((row: any) => EmailTemplate.fromDatabase(row));
  }

  /**
   * Update template
   * Uses template literals for Vercel Postgres compatibility
   */
  async update(input: UpdateTemplateInput): Promise<EmailTemplate> {
    const id = input.id;
    const name = input.name;
    const description = input.description;
    const mjmlContent = input.mjmlContent ? JSON.stringify(input.mjmlContent) : undefined;
    const htmlSnapshot = input.htmlSnapshot;
    const isDefault = input.isDefault;

    // Determine which fields to update
    const hasName = input.name !== undefined;
    const hasDescription = input.description !== undefined;
    const hasMjmlContent = input.mjmlContent !== undefined;
    const hasHtmlSnapshot = input.htmlSnapshot !== undefined;
    const hasIsDefault = input.isDefault !== undefined;

    // If no updates, return existing
    if (!hasName && !hasDescription && !hasMjmlContent && !hasHtmlSnapshot && !hasIsDefault) {
      const existing = await this.findById(input.id);
      if (!existing) {
        throw new Error(`Template with id ${input.id} not found`);
      }
      return existing;
    }

    let result;

    // Build conditional UPDATE queries using template literals
    if (hasName && hasDescription && hasMjmlContent && hasHtmlSnapshot && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            description = ${description},
            mjml_content = ${mjmlContent}::jsonb,
            html_snapshot = ${htmlSnapshot},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasDescription && hasMjmlContent && hasHtmlSnapshot) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            description = ${description},
            mjml_content = ${mjmlContent}::jsonb,
            html_snapshot = ${htmlSnapshot},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasDescription && hasMjmlContent && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            description = ${description},
            mjml_content = ${mjmlContent}::jsonb,
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasDescription && hasHtmlSnapshot && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            description = ${description},
            html_snapshot = ${htmlSnapshot},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasMjmlContent && hasHtmlSnapshot && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            mjml_content = ${mjmlContent}::jsonb,
            html_snapshot = ${htmlSnapshot},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasDescription && hasMjmlContent && hasHtmlSnapshot && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET description = ${description},
            mjml_content = ${mjmlContent}::jsonb,
            html_snapshot = ${htmlSnapshot},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasDescription && hasMjmlContent) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            description = ${description},
            mjml_content = ${mjmlContent}::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasDescription && hasHtmlSnapshot) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            description = ${description},
            html_snapshot = ${htmlSnapshot},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasDescription && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            description = ${description},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasMjmlContent && hasHtmlSnapshot) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            mjml_content = ${mjmlContent}::jsonb,
            html_snapshot = ${htmlSnapshot},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasMjmlContent && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            mjml_content = ${mjmlContent}::jsonb,
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasHtmlSnapshot && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            html_snapshot = ${htmlSnapshot},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasDescription && hasMjmlContent && hasHtmlSnapshot) {
      result = await sql`
        UPDATE email_templates
        SET description = ${description},
            mjml_content = ${mjmlContent}::jsonb,
            html_snapshot = ${htmlSnapshot},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasDescription && hasMjmlContent && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET description = ${description},
            mjml_content = ${mjmlContent}::jsonb,
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasDescription && hasHtmlSnapshot && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET description = ${description},
            html_snapshot = ${htmlSnapshot},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasMjmlContent && hasHtmlSnapshot && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET mjml_content = ${mjmlContent}::jsonb,
            html_snapshot = ${htmlSnapshot},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasDescription) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            description = ${description},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasMjmlContent) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            mjml_content = ${mjmlContent}::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasHtmlSnapshot) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            html_snapshot = ${htmlSnapshot},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasDescription && hasMjmlContent) {
      result = await sql`
        UPDATE email_templates
        SET description = ${description},
            mjml_content = ${mjmlContent}::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasDescription && hasHtmlSnapshot) {
      result = await sql`
        UPDATE email_templates
        SET description = ${description},
            html_snapshot = ${htmlSnapshot},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasDescription && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET description = ${description},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasMjmlContent && hasHtmlSnapshot) {
      result = await sql`
        UPDATE email_templates
        SET mjml_content = ${mjmlContent}::jsonb,
            html_snapshot = ${htmlSnapshot},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasMjmlContent && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET mjml_content = ${mjmlContent}::jsonb,
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasHtmlSnapshot && hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET html_snapshot = ${htmlSnapshot},
            is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasName) {
      result = await sql`
        UPDATE email_templates
        SET name = ${name},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasDescription) {
      result = await sql`
        UPDATE email_templates
        SET description = ${description},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasMjmlContent) {
      result = await sql`
        UPDATE email_templates
        SET mjml_content = ${mjmlContent}::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasHtmlSnapshot) {
      result = await sql`
        UPDATE email_templates
        SET html_snapshot = ${htmlSnapshot},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (hasIsDefault) {
      result = await sql`
        UPDATE email_templates
        SET is_default = ${isDefault},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else {
      result = await sql`
        UPDATE email_templates
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    }

    if (result.rows.length === 0) {
      throw new Error(`Template with id ${input.id} not found`);
    }

    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Soft delete template
   */
  async delete(id: string): Promise<void> {
    const result = await sql`
      UPDATE email_templates
      SET
        deleted_at = CURRENT_TIMESTAMP,
        is_default = false
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      throw new Error(`Template with id ${id} not found`);
    }
  }

  /**
   * Get the default template
   */
  async findDefault(): Promise<EmailTemplate | null> {
    const result = await sql`
      SELECT * FROM email_templates
      WHERE is_default = true
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;
    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Set a template as default
   * Automatically unsets previous default
   * Note: Vercel Postgres doesn't support manual transaction control
   * We rely on individual query atomicity instead
   */
  async setDefault(id: string): Promise<void> {
    // First, unset all defaults
    await sql`
      UPDATE email_templates
      SET is_default = false
      WHERE is_default = true
    `;

    // Then set the new default
    const result = await sql`
      UPDATE email_templates
      SET is_default = true
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id
    `;

    if (result.rows.length === 0) {
      throw new Error(`Template with id ${id} not found or is deleted`);
    }
  }

  /**
   * Get all versions of a template
   */
  async findVersions(templateId: string): Promise<EmailTemplate[]> {
    // First, find the root template (parent_template_id IS NULL)
    const rootResult = await sql`
      SELECT * FROM email_templates
      WHERE id = ${templateId} AND parent_template_id IS NULL
    `;

    let rootId: string;

    if (rootResult.rows.length > 0) {
      // This is already the root template
      rootId = templateId;
    } else {
      // This might be a version, find its root
      const versionResult = await sql`
        SELECT parent_template_id FROM email_templates
        WHERE id = ${templateId}
      `;

      if (versionResult.rows.length === 0) {
        throw new Error(`Template with id ${templateId} not found`);
      }

      rootId = versionResult.rows[0].parent_template_id;

      if (!rootId) {
        // This is a standalone template with no versions
        const template = await this.findById(templateId);
        return template ? [template] : [];
      }
    }

    // Get all versions including the root
    const result = await sql`
      SELECT * FROM email_templates
      WHERE id = ${rootId} OR parent_template_id = ${rootId}
      ORDER BY version DESC
    `;

    return result.rows.map((row: any) => EmailTemplate.fromDatabase(row));
  }

  /**
   * Create a new version of an existing template
   */
  async createVersion(
    templateId: string,
    mjmlContent: object,
    htmlSnapshot: string
  ): Promise<EmailTemplate> {
    // Get the current template
    const currentTemplate = await this.findById(templateId);
    if (!currentTemplate) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // Determine the parent ID
    const parentId = currentTemplate.parentTemplateId || currentTemplate.id;

    // Get all versions to determine the next version number
    const versions = await this.findVersions(templateId);
    const maxVersion = Math.max(...versions.map(v => v.version));
    const newVersion = maxVersion + 1;

    // Create the new version
    const result = await sql`
      INSERT INTO email_templates (
        name,
        description,
        mjml_content,
        html_snapshot,
        is_default,
        version,
        parent_template_id
      )
      VALUES (
        ${currentTemplate.name},
        ${currentTemplate.description},
        ${JSON.stringify(mjmlContent)}::jsonb,
        ${htmlSnapshot},
        false,
        ${newVersion},
        ${parentId}
      )
      RETURNING *
    `;

    if (result.rows.length === 0) {
      throw new Error('Failed to create template version');
    }

    return EmailTemplate.fromDatabase(result.rows[0]);
  }

  /**
   * Find templates by name (search with partial matching)
   */
  async findByName(name: string): Promise<EmailTemplate[]> {
    const result = await sql`
      SELECT * FROM email_templates
      WHERE name ILIKE ${'%' + name + '%'}
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) => EmailTemplate.fromDatabase(row));
  }

  /**
   * Count total templates
   * Uses template literals for Vercel Postgres compatibility
   */
  async count(includeDeleted?: boolean): Promise<number> {
    let result;

    if (!includeDeleted) {
      result = await sql`
        SELECT COUNT(*) as count
        FROM email_templates
        WHERE deleted_at IS NULL
      `;
    } else {
      result = await sql`
        SELECT COUNT(*) as count
        FROM email_templates
      `;
    }

    if (result.rows.length === 0) return 0;

    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Get template usage statistics
   */
  async getUsageStats(templateId: string): Promise<{
    totalEmailsSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }> {
    const result = await sql`
      SELECT
        template_id,
        total_emails_sent,
        delivered,
        opened,
        clicked,
        COALESCE(open_rate, 0) as open_rate,
        COALESCE(click_rate, 0) as click_rate
      FROM template_usage_stats
      WHERE template_id = ${templateId}
    `;

    if (result.rows.length === 0) {
      return {
        totalEmailsSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        openRate: 0,
        clickRate: 0
      };
    }

    const row = result.rows[0];
    return {
      totalEmailsSent: Number(row.total_emails_sent || 0),
      delivered: Number(row.delivered || 0),
      opened: Number(row.opened || 0),
      clicked: Number(row.clicked || 0),
      openRate: Number(row.open_rate || 0),
      clickRate: Number(row.click_rate || 0)
    };
  }
}
