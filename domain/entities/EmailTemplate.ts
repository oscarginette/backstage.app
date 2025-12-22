/**
 * EmailTemplate Entity
 *
 * Represents an email template with MJML content for visual email building.
 * Supports versioning and default template management.
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages template business logic and validation
 * - Open/Closed: Can be extended without modification
 */

export interface EmailTemplateProps {
  id: string;
  name: string;
  description: string | null;
  mjmlContent: object;
  htmlSnapshot: string;
  isDefault: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  parentTemplateId?: string | null;
  deletedAt?: Date | null;
}

export class EmailTemplate {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly mjmlContent: object,
    public readonly htmlSnapshot: string,
    public readonly isDefault: boolean,
    public readonly version: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly parentTemplateId?: string | null,
    public readonly deletedAt?: Date | null
  ) {
    this.validate();
  }

  /**
   * Validate template business rules
   * @throws Error if validation fails
   */
  private validate(): void {
    // Name validation
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Template name cannot be empty');
    }

    if (this.name.length > 200) {
      throw new Error('Template name cannot exceed 200 characters');
    }

    // MJML content validation
    if (!this.mjmlContent || typeof this.mjmlContent !== 'object') {
      throw new Error('MJML content must be a valid object');
    }

    // Check for required MJML structure
    const mjml = this.mjmlContent as any;
    if (!mjml.tagName || mjml.tagName !== 'mjml') {
      throw new Error('MJML content must have root tagName "mjml"');
    }

    // HTML snapshot validation
    if (!this.htmlSnapshot || this.htmlSnapshot.trim().length === 0) {
      throw new Error('HTML snapshot cannot be empty');
    }

    // Version validation
    if (this.version < 1) {
      throw new Error('Template version must be at least 1');
    }

    // Parent template validation
    if (this.parentTemplateId && this.parentTemplateId === this.id) {
      throw new Error('Template cannot be its own parent');
    }
  }

  /**
   * Check if this template is the latest version
   */
  isLatestVersion(): boolean {
    return !this.parentTemplateId;
  }

  /**
   * Check if template is active (not soft deleted)
   */
  isActive(): boolean {
    return !this.deletedAt;
  }

  /**
   * Check if template can be used for sending emails
   */
  canBeUsed(): boolean {
    return this.isActive() && this.isLatestVersion();
  }

  /**
   * Get template summary for display purposes
   */
  getSummary(): {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    version: number;
  } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isDefault: this.isDefault,
      version: this.version
    };
  }

  /**
   * Create a new EmailTemplate instance
   * Factory method following clean code practices
   */
  static create(props: {
    name: string;
    description?: string;
    mjmlContent: object;
    htmlSnapshot: string;
    isDefault?: boolean;
    parentTemplateId?: string;
  }): EmailTemplate {
    const id = crypto.randomUUID();
    const now = new Date();

    return new EmailTemplate(
      id,
      props.name,
      props.description || null,
      props.mjmlContent,
      props.htmlSnapshot,
      props.isDefault || false,
      1, // Initial version
      now,
      now,
      props.parentTemplateId || null,
      null // Not deleted
    );
  }

  /**
   * Create a new version of this template
   */
  createNewVersion(props: {
    mjmlContent: object;
    htmlSnapshot: string;
    name?: string;
    description?: string;
  }): EmailTemplate {
    const id = crypto.randomUUID();
    const now = new Date();

    return new EmailTemplate(
      id,
      props.name || this.name,
      props.description !== undefined ? props.description : this.description,
      props.mjmlContent,
      props.htmlSnapshot,
      false, // New versions are never default
      this.version + 1,
      now,
      now,
      this.id, // Link to current template as parent
      null
    );
  }

  /**
   * Update template properties
   * Returns new instance (immutability)
   */
  update(props: {
    name?: string;
    description?: string | null;
    mjmlContent?: object;
    htmlSnapshot?: string;
    isDefault?: boolean;
  }): EmailTemplate {
    return new EmailTemplate(
      this.id,
      props.name !== undefined ? props.name : this.name,
      props.description !== undefined ? props.description : this.description,
      props.mjmlContent || this.mjmlContent,
      props.htmlSnapshot || this.htmlSnapshot,
      props.isDefault !== undefined ? props.isDefault : this.isDefault,
      this.version,
      this.createdAt,
      new Date(), // Update timestamp
      this.parentTemplateId,
      this.deletedAt
    );
  }

  /**
   * Soft delete the template
   */
  delete(): EmailTemplate {
    return new EmailTemplate(
      this.id,
      this.name,
      this.description,
      this.mjmlContent,
      this.htmlSnapshot,
      false, // Deleted templates can't be default
      this.version,
      this.createdAt,
      new Date(),
      this.parentTemplateId,
      new Date() // Set deletion timestamp
    );
  }

  /**
   * Convert to plain object for database storage
   */
  toJSON(): EmailTemplateProps {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      mjmlContent: this.mjmlContent,
      htmlSnapshot: this.htmlSnapshot,
      isDefault: this.isDefault,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      parentTemplateId: this.parentTemplateId,
      deletedAt: this.deletedAt
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row: any): EmailTemplate {
    return new EmailTemplate(
      row.id,
      row.name,
      row.description,
      row.mjml_content,
      row.html_snapshot,
      row.is_default,
      row.version,
      new Date(row.created_at),
      new Date(row.updated_at),
      row.parent_template_id,
      row.deleted_at ? new Date(row.deleted_at) : null
    );
  }
}
