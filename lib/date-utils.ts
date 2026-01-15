/**
 * Date Formatting Utilities
 *
 * Shared date formatting functions for consistent date display across the application.
 * Extracted from CampaignPreviewModal and EmailContentEditor to reduce code duplication.
 */

/**
 * Format date for display in campaign previews
 *
 * @param dateString - ISO date string to format
 * @returns Formatted date string (e.g., "Mon, Jan 15, 2026, 10:30 AM")
 *
 * Used in: CampaignPreviewModal
 *
 * @example
 * formatCampaignDate('2026-01-15T10:30:00Z')
 * // Returns: "Wed, Jan 15, 2026, 10:30 AM"
 */
export function formatCampaignDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date as relative time ("2m ago", "just now")
 *
 * @param date - Date object to format
 * @returns Human-readable relative time string
 *
 * Used in: EmailContentEditor (auto-save indicator)
 *
 * @example
 * formatTimeAgo(new Date(Date.now() - 30000))
 * // Returns: "30s ago"
 *
 * @example
 * formatTimeAgo(new Date(Date.now() - 300000))
 * // Returns: "5m ago"
 */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

/**
 * Format date for email headers
 *
 * @param date - Date object to format
 * @returns Formatted date string (e.g., "Mon, Jan 15, 2026")
 *
 * Used for email header displays and general date formatting.
 *
 * @example
 * formatEmailDate(new Date('2026-01-15T10:30:00Z'))
 * // Returns: "Wed, Jan 15, 2026"
 */
export function formatEmailDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
