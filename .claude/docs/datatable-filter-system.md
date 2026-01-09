# DataTable Filter System

## Overview

The DataTable component now supports a powerful, type-safe filter system that allows users to filter data using multiple criteria. The system follows Clean Architecture principles with clear separation between UI (filter definitions), logic (predicates), and state (active filters).

## Architecture

### Three-Layer Design

1. **FilterDefinition (Presentation Layer)**
   - Defines what filters to display in the UI
   - Specifies filter type and options
   - Lives in component props

2. **FilterPredicates (Domain Layer)**
   - Defines HOW to filter data
   - Pure functions: `(item, value) => boolean`
   - Type-safe with TypeScript generics

3. **ActiveFilters (State Layer)**
   - Stores currently active filter values
   - Type: `Record<string, string | string[]>`
   - Managed by DataTable or parent component

## Filter Types

### 1. Select Filter (Single Choice)

```typescript
{
  key: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { label: 'Subscribed', value: 'subscribed' },
    { label: 'Unsubscribed', value: 'unsubscribed' },
  ],
}
```

**Predicate:**
```typescript
status: (item, value) => {
  // value is string
  return item.status === value;
}
```

### 2. Multi-Select Filter (Multiple Choices)

```typescript
{
  key: 'genre',
  label: 'Genre',
  type: 'multi-select',
  options: [
    { label: 'Rock', value: 'rock' },
    { label: 'Jazz', value: 'jazz' },
    { label: 'Electronic', value: 'electronic' },
  ],
}
```

**Predicate:**
```typescript
genre: (item, value) => {
  // value is string[]
  const genres = value as string[];
  return genres.includes(item.genre.toLowerCase());
}
```

## Data Flow

```
User Interaction → Filter Change → Update ActiveFilters State
                                   ↓
                          Apply Filters to Data (Step 1)
                                   ↓
                          Apply Sorting (Step 2)
                                   ↓
                          Apply Search (Step 3)
                                   ↓
                          Render Filtered Results
```

**Order matters:** Filters are applied FIRST, before sorting and search.

## Usage Example

```typescript
import DataTable from '@/components/dashboard/DataTable';
import { FilterDefinition, ActiveFilters } from '@/components/dashboard/DataTableFilters';

interface Contact {
  id: number;
  name: string;
  status: 'subscribed' | 'unsubscribed';
  list: string;
}

function ContactTable() {
  // Step 1: Define filters
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
      ],
    },
  ];

  // Step 2: Define predicates
  const filterPredicates = {
    status: (contact: Contact, value: string | string[]) => {
      return contact.status === value;
    },
    list: (contact: Contact, value: string | string[]) => {
      const lists = value as string[];
      return lists.includes(contact.list.toLowerCase());
    },
  };

  // Step 3: Use DataTable
  return (
    <DataTable
      data={contacts}
      columns={columns}
      searchFields={(c) => `${c.name} ${c.email}`}
      filters={filters}
      filterPredicates={filterPredicates}
      initialFilters={{}} // Optional
      onFilterChange={(filters) => console.log(filters)} // Optional
    />
  );
}
```

## Props Reference

### DataTable Filter Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `filters` | `FilterDefinition[]` | No | Array of filter definitions |
| `filterPredicates` | `Record<string, (item: T, value: string \| string[]) => boolean>` | No | Predicate functions for each filter |
| `initialFilters` | `ActiveFilters` | No | Initial active filters |
| `onFilterChange` | `(filters: ActiveFilters) => void` | No | Callback when filters change |

### FilterDefinition

```typescript
interface FilterDefinition {
  key: string;              // Unique identifier (must match predicate key)
  label: string;            // Display label
  type: 'select' | 'multi-select';
  options: FilterOption[];  // Array of { label, value }
}
```

### ActiveFilters

```typescript
type ActiveFilters = Record<string, string | string[]>;

// Example:
{
  status: 'subscribed',               // Select filter
  genre: ['rock', 'jazz'],            // Multi-select filter
  list: 'newsletter'                  // Select filter
}
```

## Filter Logic

### AND Logic (All Filters Must Match)

```typescript
const sortedAndFilteredData = useMemo(() => {
  let result = [...data];

  // Apply ALL active filters (AND logic)
  if (Object.keys(activeFilters).length > 0) {
    result = result.filter((item) => {
      return Object.entries(activeFilters).every(([key, value]) => {
        const predicate = filterPredicates[key];
        if (!predicate) return true; // Skip if no predicate

        return predicate(item, value); // Must return true for ALL filters
      });
    });
  }

  // ... sorting and search
}, [data, activeFilters, filterPredicates]);
```

### Execution Order

1. **Filters** - Applied first to raw data
2. **Sorting** - Applied to filtered data
3. **Search** - Applied to sorted, filtered data

## Features

### Automatic UI Elements

1. **Filter Button**
   - Shows active filter count badge
   - Highlights when filters active
   - Opens dropdown panel

2. **Filter Dropdown**
   - Lists all available filters
   - Shows active selections
   - "Clear all" button

3. **Active Filter Badges**
   - One badge per active filter value
   - Individual remove buttons
   - Color-coded with primary theme

4. **Results Summary**
   - "Showing X of Y records"
   - Only shown when filtering

5. **Click-Outside-to-Close**
   - Dropdown closes automatically
   - Native UX behavior

## Best Practices

### 1. Keep Keys Consistent

```typescript
// ✅ CORRECT: Same key in both
filters: [{ key: 'status', ... }]
filterPredicates: { status: (item, value) => ... }

// ❌ WRONG: Mismatched keys
filters: [{ key: 'status', ... }]
filterPredicates: { subscription_status: (item, value) => ... }
```

### 2. Use Lowercase for Case-Insensitive Matching

```typescript
// ✅ CORRECT
list: (contact, value) => {
  const lists = value as string[];
  return lists.includes(contact.list.toLowerCase());
}

// ❌ WRONG: Case-sensitive
list: (contact, value) => {
  const lists = value as string[];
  return lists.includes(contact.list); // "Newsletter" !== "newsletter"
}
```

### 3. Handle Type Guards for Multi-Select

```typescript
// ✅ CORRECT: Type guard
list: (contact, value) => {
  const lists = value as string[]; // Cast to string[]
  return lists.includes(contact.list.toLowerCase());
}

// ❌ WRONG: No type guard
list: (contact, value) => {
  return value.includes(contact.list); // TypeScript error
}
```

### 4. Performance Optimization

For large datasets (10k+ rows), consider:

```typescript
// Use indexes or pre-computed values
const statusIndex = useMemo(() => {
  const index = new Map<string, Contact[]>();
  contacts.forEach(contact => {
    if (!index.has(contact.status)) {
      index.set(contact.status, []);
    }
    index.get(contact.status)!.push(contact);
  });
  return index;
}, [contacts]);

// Use index in predicate
status: (contact, value) => {
  return statusIndex.get(value)?.includes(contact) ?? false;
}
```

## Advanced Examples

### Example 1: Complex Multi-Select with OR Logic

```typescript
// Filter: Show contacts in EITHER "Newsletter" OR "Promotions"
list: (contact, value) => {
  const lists = value as string[];
  return lists.some(list => contact.lists.includes(list)); // OR logic
}
```

### Example 2: Nested Property Filtering

```typescript
// Filter by nested property
artist_genre: (gate, value) => {
  const genres = value as string[];
  return genres.includes(gate.artist?.genre?.toLowerCase() ?? '');
}
```

### Example 3: Date Range Filtering

```typescript
// Filter definition
{
  key: 'date_range',
  label: 'Date Range',
  type: 'select',
  options: [
    { label: 'Last 7 days', value: 'last_7_days' },
    { label: 'Last 30 days', value: 'last_30_days' },
    { label: 'Last year', value: 'last_year' },
  ],
}

// Predicate
date_range: (contact, value) => {
  const now = new Date();
  const contactDate = new Date(contact.created_at);

  switch (value) {
    case 'last_7_days':
      return now.getTime() - contactDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
    case 'last_30_days':
      return now.getTime() - contactDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
    case 'last_year':
      return now.getFullYear() === contactDate.getFullYear();
    default:
      return true;
  }
}
```

### Example 4: Boolean Filters

```typescript
// Filter definition
{
  key: 'has_opened',
  label: 'Has Opened Email',
  type: 'select',
  options: [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ],
}

// Predicate
has_opened: (contact, value) => {
  return value === 'true' ? contact.opened : !contact.opened;
}
```

## Integration with URL State (Optional)

```typescript
import { useSearchParams, useRouter } from 'next/navigation';

function ContactTable() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read filters from URL
  const initialFilters: ActiveFilters = useMemo(() => {
    const filters: ActiveFilters = {};
    const status = searchParams.get('status');
    const list = searchParams.get('list');

    if (status) filters.status = status;
    if (list) filters.list = list.split(',');

    return filters;
  }, [searchParams]);

  // Sync filters to URL
  const handleFilterChange = (newFilters: ActiveFilters) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, value);
      }
    });

    router.push(`/contacts?${params.toString()}`);
  };

  return (
    <DataTable
      {...props}
      initialFilters={initialFilters}
      onFilterChange={handleFilterChange}
    />
  );
}
```

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from './DataTable';

test('filters data correctly', () => {
  const data = [
    { id: 1, status: 'subscribed', name: 'John' },
    { id: 2, status: 'unsubscribed', name: 'Jane' },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
  ];

  const filterPredicates = {
    status: (item, value) => item.status === value,
  };

  render(
    <DataTable
      data={data}
      columns={columns}
      searchFields={(item) => item.name}
      filters={filters}
      filterPredicates={filterPredicates}
    />
  );

  // Open filter dropdown
  fireEvent.click(screen.getByText('Filters'));

  // Select "Subscribed" filter
  fireEvent.click(screen.getByLabelText('Subscribed'));

  // Verify only subscribed contacts shown
  expect(screen.getByText('John')).toBeInTheDocument();
  expect(screen.queryByText('Jane')).not.toBeInTheDocument();

  // Verify results summary
  expect(screen.getByText('Showing 1 of 2 records')).toBeInTheDocument();
});
```

## Troubleshooting

### Issue: Filters not working

**Solution:** Ensure filter keys match between `FilterDefinition` and `filterPredicates`:

```typescript
// ✅ Keys match
filters: [{ key: 'status', ... }]
filterPredicates: { status: ... }
```

### Issue: Multi-select returns wrong results

**Solution:** Cast value to `string[]` in predicate:

```typescript
list: (contact, value) => {
  const lists = value as string[]; // Cast here
  return lists.includes(contact.list.toLowerCase());
}
```

### Issue: Filters reset on re-render

**Solution:** Use controlled state with `initialFilters` and `onFilterChange`:

```typescript
const [filters, setFilters] = useState<ActiveFilters>({});

<DataTable
  initialFilters={filters}
  onFilterChange={setFilters}
/>
```

### Issue: Performance slow with large datasets

**Solution:** Memoize predicates or use indexes:

```typescript
const filterPredicates = useMemo(() => ({
  status: (item, value) => item.status === value,
}), []);
```

## Files Reference

- **Component:** `/components/dashboard/DataTable.tsx`
- **Filter UI:** `/components/dashboard/DataTableFilters.tsx`
- **Example:** `/components/dashboard/DataTableFilterExample.tsx`
- **Docs:** `/.claude/docs/datatable-filter-system.md` (this file)

---

**Last Updated:** 2026-01-09
**Version:** 1.0.0
**Author:** SuperClaude
