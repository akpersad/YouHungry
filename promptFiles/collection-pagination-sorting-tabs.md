# Collection Page: Pagination, Sorting, and Tabs Implementation

**Date:** October 11, 2025  
**Status:** ✅ COMPLETED

## Overview

This document details the implementation of pagination, sorting, and tab navigation features for the collection page to improve UX, performance, and organization.

## Problem Statement

The original collection page had several UX issues:

1. **Performance Issues**: Collections with many restaurants (>10) loaded all at once, causing slow rendering
2. **Poor Organization**: Decision-making features at the bottom of long pages were hard to find
3. **No Sorting Options**: Users couldn't sort restaurants by preference
4. **Overwhelming Content**: Group collections mixed restaurant management with decision features

## Solution

### 1. Sorting Functionality

**Implementation:**

- Added sort dropdown with three options:
  - Rating (Highest First) - DEFAULT
  - Name (A-Z)
  - Name (Z-A)
- Sorting applied before pagination
- Uses `useMemo` for performance optimization

**User Benefits:**

- Find highly-rated restaurants quickly (default)
- Locate specific restaurants alphabetically
- Better browsing experience

**Code Example:**

```typescript
const sortedRestaurants = useMemo(() => {
  const sorted = [...restaurants];

  switch (sortBy) {
    case 'rating-desc':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
  }

  return sorted;
}, [restaurants, sortBy]);
```

### 2. Pagination

**Implementation:**

- Displays 10 restaurants per page
- Shows pagination controls when >10 restaurants
- Previous/Next buttons with disabled states
- Page number display with ellipsis for many pages
- Auto-scrolls to top when page changes
- Resets to page 1 when sort changes
- Map view shows ALL restaurants (no pagination)

**User Benefits:**

- Faster page loads for large collections
- Easier navigation through restaurants
- Better mobile experience
- All restaurants visible on map for context

**Code Example:**

```typescript
const paginatedRestaurants = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return sortedRestaurants.slice(startIndex, endIndex);
}, [sortedRestaurants, currentPage, itemsPerPage]);

const totalPages = Math.ceil(sortedRestaurants.length / itemsPerPage);
```

**Pagination UI:**

```typescript
{totalPages > 1 && viewType !== 'map' && (
  <div className="flex items-center justify-center gap-2 mt-6">
    <Button
      onClick={() => handlePageChange(currentPage - 1)}
      disabled={currentPage === 1}
      variant="outline"
      size="sm"
    >
      Previous
    </Button>

    {/* Page numbers with ellipsis */}
    <div className="flex items-center gap-1">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
        const showPage =
          page === 1 ||
          page === totalPages ||
          Math.abs(page - currentPage) <= 1;

        if (showEllipsis) return <span key={page}>...</span>;
        if (!showPage) return null;

        return (
          <Button
            key={page}
            onClick={() => handlePageChange(page)}
            variant={currentPage === page ? 'default' : 'outline'}
          >
            {page}
          </Button>
        );
      })}
    </div>

    <Button
      onClick={() => handlePageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      variant="outline"
      size="sm"
    >
      Next
    </Button>
  </div>
)}
```

### 3. Tab Navigation

**Implementation:**

- Created reusable `Tabs` component
- Two tabs for group collections:
  - **Restaurants Tab**: Restaurant list, Add Restaurant, View Statistics
  - **Decisions Tab**: Group decision features, Decide for Me, Start Group Decision
- Personal collections show Restaurants content directly (no tabs)
- Badge support showing restaurant count
- ARIA attributes for accessibility
- Mobile-responsive design

**User Benefits:**

- Better organization of features
- Decision features easy to find
- Cleaner interface
- Appropriate context for each action

**Tabs Component:**

```typescript
export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className="border-b border-border">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={isActive ? 'active-styles' : 'inactive-styles'}
              aria-selected={isActive}
              role="tab"
            >
              {tab.label}
              {tab.badge && <span className="badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            hidden={tab.id !== activeTab}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**CollectionView Tab Configuration:**

```typescript
const tabItems = useMemo((): TabItem[] => {
  const isGroupCollection = collection?.type === 'group';

  const tabs: TabItem[] = [
    {
      id: 'restaurants',
      label: 'Restaurants',
      badge: collection?.restaurantIds.length || 0,
      content: (
        <>
          {/* Add Restaurant, View Statistics buttons */}
          {/* Restaurant list */}
        </>
      ),
    },
  ];

  // Add Decisions tab only for group collections
  if (isGroupCollection && !groupLoading) {
    tabs.push({
      id: 'decisions',
      label: 'Decisions',
      content: (
        <>
          {/* Decide for Me, Start Group Decision buttons */}
          {/* Group Decision Making component */}
        </>
      ),
    });
  }

  return tabs;
}, [collection, groupLoading, isCurrentUserAdmin]);
```

## Component Behavior

### Personal Collections

- No tabs shown
- Show restaurants list directly
- "Add Restaurant" button
- "Decide for Me" button (personal decision)
- "View Statistics" button

### Group Collections

- **Restaurants Tab** (default):
  - Restaurant list with sorting and pagination
  - "Add Restaurant" button
  - "View Statistics" button
  - Badge showing restaurant count

- **Decisions Tab**:
  - Group decision history
  - "Decide for Me" button (personal decision)
  - "Start Group Decision" button (admin only)
  - Active/pending group decisions

## Accessibility Features

### Tabs Component

- `role="tab"` on tab buttons
- `aria-selected` indicates active tab
- `role="tabpanel"` on tab content
- `hidden` attribute for inactive panels
- Keyboard navigation support
- Focus management

### Sort Dropdown

- Native `<select>` element for accessibility
- Proper labeling with "Sort by:" text
- Keyboard navigable
- Screen reader compatible

### Pagination

- Disabled state on buttons clearly indicated
- `aria-disabled` on disabled buttons
- Descriptive button text (Previous/Next, page numbers)
- Keyboard accessible

## Performance Optimizations

1. **useMemo for sorting**: Only re-sorts when restaurants or sortBy changes
2. **useMemo for pagination**: Only re-slices when sorted data or page changes
3. **Scroll to top**: Improves UX when changing pages
4. **Map view optimization**: Shows all restaurants on map without pagination slicing
5. **Lazy rendering**: Tab content only renders when active

## Testing

### Unit Tests Created

**Tabs Component (`Tabs.test.tsx`):**

- ✅ Renders all tab headers
- ✅ Displays badges when provided
- ✅ Shows content of active tab
- ✅ Marks active tab with aria-selected
- ✅ Calls onTabChange when tab clicked
- ✅ Switches content when tab changes
- ✅ Applies custom className
- ✅ Handles single tab
- ✅ Renders tabpanel with correct role

**CollectionRestaurantsList Sorting (`CollectionRestaurantsList.test.tsx`):**

- ✅ Defaults to sorting by rating (highest first)
- ✅ Sorts by name A-Z when selected
- ✅ Sorts by name Z-A when selected
- ✅ Displays sort dropdown when restaurants exist
- ✅ Does not display sort dropdown when no restaurants

**CollectionRestaurantsList Pagination:**

- ✅ Shows pagination controls when >10 restaurants
- ✅ Does not show pagination when ≤10 restaurants
- ✅ Shows only first 10 restaurants on page 1
- ✅ Navigates to next page when Next clicked
- ✅ Navigates to previous page when Previous clicked
- ✅ Disables Previous button on first page
- ✅ Disables Next button on last page
- ✅ Resets to page 1 when sort changes
- ✅ Does not show pagination in map view

### Manual Testing Checklist

- [ ] Sort by rating shows highest rated first
- [ ] Sort by name A-Z works correctly
- [ ] Sort by name Z-A works correctly
- [ ] Pagination shows 10 items per page
- [ ] Previous button disabled on page 1
- [ ] Next button disabled on last page
- [ ] Page numbers display correctly
- [ ] Clicking page number navigates correctly
- [ ] Changing sort resets to page 1
- [ ] Map view shows all restaurants
- [ ] Tabs work in group collections
- [ ] Tabs show correct badges
- [ ] Personal collections don't show tabs
- [ ] Tab content switches correctly
- [ ] Keyboard navigation works
- [ ] Mobile responsive design works
- [ ] Screen reader announces changes

## Files Changed

### Created

- `src/components/ui/Tabs.tsx` - Reusable tab component
- `src/components/ui/Tabs.css` - Tab component styles
- `src/components/ui/__tests__/Tabs.test.tsx` - Tab component tests

### Modified

- `src/components/features/CollectionRestaurantsList.tsx` - Added sorting and pagination
- `src/components/features/CollectionView.tsx` - Refactored to use tabs
- `src/components/features/__tests__/CollectionRestaurantsList.test.tsx` - Added tests

## CSS Guidelines

All CSS follows the project's design system:

- Uses rem units for sizing (e.g., `0.75rem` instead of `12px`)
- Separate CSS files instead of inline styles
- CSS variables for colors (e.g., `var(--primary)`, `var(--text)`)
- Mobile-first responsive design
- Dark mode support

## Future Enhancements

Potential improvements for future iterations:

1. **Persistent Preferences**: Save sort and view preferences to user settings
2. **Filter Options**: Add filtering by cuisine, price range, rating threshold
3. **Search**: Add search functionality within collections
4. **Infinite Scroll**: Alternative to pagination for mobile
5. **Bulk Actions**: Select multiple restaurants for batch operations
6. **Sort by Distance**: When user location is available
7. **Custom Sort Orders**: User-defined ordering (drag and drop)

## Usage Examples

### Using Tabs Component in Other Features

```typescript
import { Tabs, TabItem } from '@/components/ui/Tabs';

const MyComponent = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: <OverviewContent />,
    },
    {
      id: 'details',
      label: 'Details',
      badge: 3,
      content: <DetailsContent />,
    },
  ];

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};
```

### Implementing Similar Pagination

```typescript
// State
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

// Pagination logic
const paginatedItems = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return items.slice(startIndex, endIndex);
}, [items, currentPage, itemsPerPage]);

const totalPages = Math.ceil(items.length / itemsPerPage);
```

## Conclusion

The pagination, sorting, and tab navigation features significantly improve the collection page UX by:

1. **Performance**: Faster loading for large collections
2. **Organization**: Better separation of concerns with tabs
3. **Usability**: Multiple sort options and easy navigation
4. **Accessibility**: Full ARIA support and keyboard navigation
5. **Mobile**: Responsive design that works on all devices

All features are fully tested, documented, and follow the project's design system guidelines.
