/**
 * DataTable Filter System - Usage Example
 *
 * This example demonstrates how to use the filter system with DataTable.
 * The filter system supports:
 * - Select filters (single choice)
 * - Multi-select filters (multiple choices)
 * - Type-safe predicate functions
 * - Active filter badges
 * - Filter state management
 */

'use client';

import React, { useState } from 'react';
import DataTable from './DataTable';
import { FilterDefinition, ActiveFilters } from './DataTableFilters';

/**
 * Example: Contact data type
 */
interface Contact {
  id: number;
  name: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  list: string;
  created_at: Date;
}

/**
 * Example: Contact Table with Filters
 */
export default function ContactTableExample() {
  const [contacts] = useState<Contact[]>([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'subscribed',
      list: 'Newsletter',
      created_at: new Date('2024-01-15'),
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'unsubscribed',
      list: 'Promotions',
      created_at: new Date('2024-02-20'),
    },
    // ... more contacts
  ]);

  /**
   * Step 1: Define filter definitions
   */
  const filters: FilterDefinition[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
    {
      key: 'list',
      label: 'List',
      type: 'multi-select',
      options: [
        { label: 'Newsletter', value: 'newsletter' },
        { label: 'Promotions', value: 'promotions' },
        { label: 'Updates', value: 'updates' },
      ],
    },
  ];

  /**
   * Step 2: Define filter predicates (how to apply filters to data)
   */
  const filterPredicates: Record<string, (item: Contact, value: string | string[]) => boolean> = {
    status: (contact, value) => {
      // Select filter: value is a string
      return contact.status === value;
    },
    list: (contact, value) => {
      // Multi-select filter: value is string[]
      const lists = value as string[];
      return lists.includes(contact.list.toLowerCase());
    },
  };

  /**
   * Step 3: Define columns
   */
  const columns = [
    {
      header: 'Name',
      accessor: (contact: Contact) => contact.name,
      sortKey: (contact: Contact) => contact.name,
    },
    {
      header: 'Email',
      accessor: (contact: Contact) => contact.email,
    },
    {
      header: 'Status',
      accessor: (contact: Contact) => (
        <span
          className={
            contact.status === 'subscribed'
              ? 'text-green-600 font-medium'
              : 'text-red-600 font-medium'
          }
        >
          {contact.status}
        </span>
      ),
      sortKey: (contact: Contact) => contact.status,
    },
    {
      header: 'List',
      accessor: (contact: Contact) => contact.list,
    },
    {
      header: 'Created',
      accessor: (contact: Contact) => contact.created_at.toLocaleDateString(),
      sortKey: (contact: Contact) => contact.created_at,
    },
  ];

  /**
   * Step 4: Handle filter changes (optional - for external state management)
   */
  const handleFilterChange = (newFilters: ActiveFilters) => {
    console.log('Active filters changed:', newFilters);
    // You can sync with URL params, analytics, etc.
  };

  /**
   * Step 5: Render DataTable with filter support
   */
  return (
    <DataTable
      data={contacts}
      columns={columns}
      searchFields={(contact) => `${contact.name} ${contact.email}`}
      searchPlaceholder="Search contacts..."
      emptyMessage="No contacts found"
      // Filter props
      filters={filters}
      filterPredicates={filterPredicates}
      initialFilters={{}} // Optional: set initial filters
      onFilterChange={handleFilterChange} // Optional: handle filter changes
    />
  );
}

/**
 * Filter System Architecture
 *
 * 1. FilterDefinition (UI)
 *    - Defines what filters to show
 *    - Type: 'select' or 'multi-select'
 *    - Options: Array of { label, value }
 *
 * 2. FilterPredicates (Logic)
 *    - Defines HOW to filter data
 *    - Key matches FilterDefinition.key
 *    - Function: (item, value) => boolean
 *
 * 3. ActiveFilters (State)
 *    - Stores currently active filters
 *    - Type: Record<string, string | string[]>
 *    - Example: { status: 'subscribed', list: ['newsletter', 'promotions'] }
 *
 * 4. DataTable Integration
 *    - Filters applied FIRST (before sorting and search)
 *    - AND logic: ALL active filters must match
 *    - Automatic count updates
 *    - Filter badges with individual remove
 *
 * Best Practices:
 * - Keep filter keys consistent between FilterDefinition and filterPredicates
 * - Use lowercase values for case-insensitive matching
 * - Handle empty/null filter values gracefully
 * - Consider performance for large datasets (use indexes, memoization)
 */
