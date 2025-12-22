/**
 * IEmailTemplateRepository Interface
 *
 * Defines the contract for email template data access.
 * Following Dependency Inversion Principle (DIP):
 * - Domain layer defines the interface
 * - Infrastructure layer provides concrete implementation
 */

import { EmailTemplate } from '../entities/EmailTemplate';

export interface CreateTemplateInput {
  name: string;
  description?: string;
  mjmlContent: object;
  htmlSnapshot: string;
  isDefault?: boolean;
  parentTemplateId?: string;
}

export interface UpdateTemplateInput {
  id: string;
  name?: string;
  description?: string | null;
  mjmlContent?: object;
  htmlSnapshot?: string;
  isDefault?: boolean;
}

export interface FindTemplatesOptions {
  includeDeleted?: boolean;
  onlyDefault?: boolean;
  parentTemplateId?: string;
}

/**
 * Repository interface for EmailTemplate
 * Follows Interface Segregation Principle (ISP): focused, minimal interface
 */
export interface IEmailTemplateRepository {
  /**
   * Create a new template
   * @param input Template creation data
   * @returns Created template
   */
  create(input: CreateTemplateInput): Promise<EmailTemplate>;

  /**
   * Find template by ID
   * @param id Template UUID
   * @returns Template or null if not found
   */
  findById(id: string): Promise<EmailTemplate | null>;

  /**
   * Find all templates
   * @param options Query options
   * @returns Array of templates
   */
  findAll(options?: FindTemplatesOptions): Promise<EmailTemplate[]>;

  /**
   * Update template
   * @param input Update data
   * @returns Updated template
   */
  update(input: UpdateTemplateInput): Promise<EmailTemplate>;

  /**
   * Soft delete template
   * @param id Template UUID
   */
  delete(id: string): Promise<void>;

  /**
   * Get the default template
   * @returns Default template or null if none set
   */
  findDefault(): Promise<EmailTemplate | null>;

  /**
   * Set a template as default
   * Automatically unsets previous default
   * @param id Template UUID
   */
  setDefault(id: string): Promise<void>;

  /**
   * Get all versions of a template
   * @param templateId Parent template ID or any version ID
   * @returns Array of template versions, ordered by version DESC
   */
  findVersions(templateId: string): Promise<EmailTemplate[]>;

  /**
   * Create a new version of an existing template
   * @param templateId ID of template to create version from
   * @param mjmlContent New MJML content
   * @param htmlSnapshot New HTML snapshot
   * @returns New template version
   */
  createVersion(
    templateId: string,
    mjmlContent: object,
    htmlSnapshot: string
  ): Promise<EmailTemplate>;

  /**
   * Find templates by name (search)
   * @param name Name to search for (supports partial matching)
   * @returns Array of matching templates
   */
  findByName(name: string): Promise<EmailTemplate[]>;

  /**
   * Count total templates
   * @param includeDeleted Include soft-deleted templates
   * @returns Count of templates
   */
  count(includeDeleted?: boolean): Promise<number>;

  /**
   * Get template usage statistics
   * @param templateId Template UUID
   * @returns Usage stats (emails sent, open rate, click rate)
   */
  getUsageStats(templateId: string): Promise<{
    totalEmailsSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
}
