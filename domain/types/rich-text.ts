/**
 * Rich Text Types and Configuration
 *
 * Defines email-safe HTML tags and sanitization rules for rich text content.
 * Used by RichTextContent value object and sanitization processes.
 *
 * Security: Whitelist approach - only allow explicitly safe tags/attributes
 */

/**
 * Email-safe HTML tags allowed in rich text content
 *
 * Limited to basic formatting that works across all email clients:
 * - strong, em, u, s: Text formatting
 * - p, br: Paragraphs and line breaks
 * - a: Links (href attribute only)
 */
export const EMAIL_SAFE_TAGS = [
  'strong', // Bold
  'em',     // Italic
  'u',      // Underline
  's',      // Strikethrough
  'p',      // Paragraph
  'br',     // Line break
  'a',      // Link
] as const;

/**
 * Sanitization configuration for sanitize-html library
 *
 * Ensures user-generated HTML is safe for:
 * - Email rendering (removes scripts, iframes, etc.)
 * - XSS prevention (strict attribute whitelist)
 * - Email client compatibility (only universally supported tags)
 */
export const EMAIL_SANITIZE_CONFIG = {
  allowedTags: EMAIL_SAFE_TAGS as unknown as string[],
  allowedAttributes: {
    a: ['href', 'title'], // Links: only href and title
  },
  allowedSchemes: ['http', 'https', 'mailto'], // Safe URL schemes only
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto'],
  },
  // Remove all CSS classes and IDs
  allowedClasses: {},
  // Remove all inline styles
  allowedStyles: {},
  // Transform relative URLs to absolute (safer)
  transformTags: {
    a: (_tagName: string, attribs: Record<string, string>) => {
      return {
        tagName: 'a',
        attribs: {
          href: attribs.href || '',
          title: attribs.title || '',
          // Add rel="noopener noreferrer" for security
          rel: 'noopener noreferrer',
          // Force links to open in new tab
          target: '_blank',
        },
      };
    },
  },
};
