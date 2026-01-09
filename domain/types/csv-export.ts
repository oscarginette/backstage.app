/**
 * CSV Export Configuration Types
 *
 * Defines available export options and formats for contact data.
 * Follows typed constants pattern (see .claude/CLAUDE.md).
 */

// Export formats (for future extensibility)
export type ExportFormat = 'csv' | 'json' | 'xlsx';

export const EXPORT_FORMATS = {
  CSV: 'csv' as const,
  JSON: 'json' as const,
  XLSX: 'xlsx' as const,
} as const;

// Export scopes
export type ExportScope = 'all' | 'selected' | 'filtered';

export const EXPORT_SCOPES = {
  ALL: 'all' as const,
  SELECTED: 'selected' as const,
  FILTERED: 'filtered' as const,
} as const;

// Available columns for export
export type ContactExportColumn =
  | 'id'
  | 'email'
  | 'name'
  | 'subscribed'
  | 'source'
  | 'createdAt'
  | 'unsubscribedAt'
  | 'unsubscribeToken'
  | 'metadata'
  | 'metadata.source'
  | 'metadata.importedAt'
  | 'metadata.importBatchId'
  | 'metadata.externalId'
  | 'metadata.customFields'
  | 'metadata.tags'
  | 'metadata.gdprDeleted';

export const CONTACT_EXPORT_COLUMNS = {
  ID: 'id' as const,
  EMAIL: 'email' as const,
  NAME: 'name' as const,
  SUBSCRIBED: 'subscribed' as const,
  SOURCE: 'source' as const,
  CREATED_AT: 'createdAt' as const,
  UNSUBSCRIBED_AT: 'unsubscribedAt' as const,
  UNSUBSCRIBE_TOKEN: 'unsubscribeToken' as const,
  METADATA: 'metadata' as const,
  METADATA_SOURCE: 'metadata.source' as const,
  METADATA_IMPORTED_AT: 'metadata.importedAt' as const,
  METADATA_BATCH_ID: 'metadata.importBatchId' as const,
  METADATA_EXTERNAL_ID: 'metadata.externalId' as const,
  METADATA_CUSTOM_FIELDS: 'metadata.customFields' as const,
  METADATA_TAGS: 'metadata.tags' as const,
  METADATA_GDPR_DELETED: 'metadata.gdprDeleted' as const,
} as const;

// Default columns for quick export
export const DEFAULT_EXPORT_COLUMNS: ContactExportColumn[] = [
  CONTACT_EXPORT_COLUMNS.EMAIL,
  CONTACT_EXPORT_COLUMNS.NAME,
  CONTACT_EXPORT_COLUMNS.SUBSCRIBED,
  CONTACT_EXPORT_COLUMNS.SOURCE,
  CONTACT_EXPORT_COLUMNS.CREATED_AT,
];

// Column metadata for UI
export interface ExportColumnMetadata {
  key: ContactExportColumn;
  label: string;
  description: string;
  category: 'basic' | 'status' | 'metadata' | 'advanced';
}

export const EXPORT_COLUMN_METADATA: ExportColumnMetadata[] = [
  {
    key: CONTACT_EXPORT_COLUMNS.EMAIL,
    label: 'Email',
    description: 'Contact email address',
    category: 'basic',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.NAME,
    label: 'Name',
    description: 'Contact full name',
    category: 'basic',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.SUBSCRIBED,
    label: 'Subscribed',
    description: 'Current subscription status',
    category: 'status',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.SOURCE,
    label: 'Source',
    description: 'Original import source',
    category: 'basic',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.CREATED_AT,
    label: 'Added Date',
    description: 'When contact was added',
    category: 'basic',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.UNSUBSCRIBED_AT,
    label: 'Unsubscribed Date',
    description: 'When contact unsubscribed',
    category: 'status',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.ID,
    label: 'Contact ID',
    description: 'Internal contact ID',
    category: 'advanced',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.UNSUBSCRIBE_TOKEN,
    label: 'Unsubscribe Token',
    description: 'Unique unsubscribe token',
    category: 'advanced',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.METADATA_SOURCE,
    label: 'Import Source Detail',
    description: 'Detailed import source from metadata',
    category: 'metadata',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.METADATA_IMPORTED_AT,
    label: 'Import Timestamp',
    description: 'Exact time of import',
    category: 'metadata',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.METADATA_BATCH_ID,
    label: 'Import Batch ID',
    description: 'UUID of import batch',
    category: 'metadata',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.METADATA_EXTERNAL_ID,
    label: 'External ID',
    description: 'ID from external system (Brevo, etc)',
    category: 'metadata',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.METADATA_CUSTOM_FIELDS,
    label: 'Custom Fields',
    description: 'User-defined custom fields (JSON)',
    category: 'metadata',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.METADATA_TAGS,
    label: 'Tags',
    description: 'Contact tags (comma-separated)',
    category: 'metadata',
  },
  {
    key: CONTACT_EXPORT_COLUMNS.METADATA_GDPR_DELETED,
    label: 'GDPR Deleted',
    description: 'Whether contact was GDPR-deleted',
    category: 'metadata',
  },
];

// Export request input
export interface ExportContactsInput {
  userId: number;
  scope: ExportScope;
  selectedIds?: number[]; // Required when scope = 'selected'
  columns: ContactExportColumn[];
  format: ExportFormat;
}

// Export result
export interface ExportContactsResult {
  success: boolean;
  data?: string; // CSV string or JSON string
  filename: string;
  rowCount: number;
  error?: string;
}
