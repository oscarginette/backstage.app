/**
 * RichTextContent Value Object
 *
 * Represents sanitized, validated rich text content for email campaigns.
 * Immutable value object following Clean Architecture principles.
 *
 * Responsibilities:
 * - Validate HTML length constraints
 * - Sanitize user-generated HTML (XSS prevention)
 * - Ensure email client compatibility
 *
 * Usage:
 * const content = RichTextContent.create(userInput);
 * // content.sanitizedHtml is safe to store/render
 */

import sanitizeHtml from 'sanitize-html';
import { EMAIL_SANITIZE_CONFIG } from '@/domain/types/rich-text';

/**
 * Maximum HTML content length (50,000 characters)
 *
 * Rationale:
 * - Database field limit (TEXT type)
 * - Email size limits (most clients handle <100KB)
 * - Performance (rendering large HTML)
 */
const MAX_HTML_LENGTH = 50000;

/**
 * Validation error for rich text content
 */
export class RichTextValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RichTextValidationError';
  }
}

/**
 * RichTextContent value object
 *
 * Immutable representation of sanitized HTML content.
 * Always use static create() method to instantiate.
 */
export class RichTextContent {
  private constructor(
    private readonly _rawHtml: string,
    private readonly _sanitizedHtml: string
  ) {}

  /**
   * Create RichTextContent from user input
   *
   * @param rawHtml - User-generated HTML from Tiptap editor
   * @returns Validated and sanitized RichTextContent instance
   * @throws RichTextValidationError if validation fails
   */
  static create(rawHtml: string): RichTextContent {
    // Validate input exists
    if (rawHtml === null || rawHtml === undefined) {
      throw new RichTextValidationError('HTML content cannot be null or undefined');
    }

    // Convert to string (in case number/object passed)
    const htmlString = String(rawHtml);

    // Validate length constraint
    if (htmlString.length > MAX_HTML_LENGTH) {
      throw new RichTextValidationError(
        `HTML content exceeds maximum length of ${MAX_HTML_LENGTH} characters`
      );
    }

    // Sanitize HTML (XSS prevention + email compatibility)
    const sanitizedHtml = sanitizeHtml(htmlString, EMAIL_SANITIZE_CONFIG);

    return new RichTextContent(htmlString, sanitizedHtml);
  }

  /**
   * Get original HTML (before sanitization)
   *
   * Use only for debugging/logging. Never render in production.
   */
  get rawHtml(): string {
    return this._rawHtml;
  }

  /**
   * Get sanitized HTML (safe for storage/rendering)
   *
   * This is the value to store in database and render in emails.
   */
  get sanitizedHtml(): string {
    return this._sanitizedHtml;
  }

  /**
   * Get plain text version (strip all HTML tags)
   *
   * Useful for:
   * - Email subject lines
   * - Preview text
   * - Character counting
   */
  get plainText(): string {
    return sanitizeHtml(this._sanitizedHtml, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  /**
   * Get character count (plain text length)
   */
  get characterCount(): number {
    return this.plainText.length;
  }

  /**
   * Check if content is empty (no text after stripping HTML)
   */
  get isEmpty(): boolean {
    return this.plainText.trim().length === 0;
  }
}
