# Reports Module

This module provides a comprehensive reporting system for the SmartPresence application, allowing users to view and export various types of reports.

## Structure

```
components/reports/
├── ReportTypes.ts      # TypeScript types and interfaces
├── ReportFilters.tsx   # Filter controls component
├── ReportTable.tsx     # Data table display component
├── ReportExport.tsx    # Export functionality
├── useReports.ts       # Custom hook for reports logic
├── reportUtils.ts      # Utility functions
└── index.ts           # Module exports
```

## Components

### ReportFilters
Handles all filtering controls including:
- Date range picker
- User type filter
- Status filter
- Search functionality
- Export button

### ReportTable
Displays report data in a tabular format with:
- Loading state
- Empty state
- Sortable columns
- Row click handling
- Responsive design

### ReportExport
Manages the export functionality:
- PDF generation
- Export status feedback
- Error handling

## Hooks

### useReports
Manages the reports state and logic:
- Data fetching
- Filter management
- Date range handling
- Export functionality

## Usage

```tsx
import { 
  ReportFilters, 
  ReportTable, 
  useReports,
  type ReportType
} from '@/components/reports';

// In your component:
const {
  reportData,
  isLoading,
  error,
  activeTab,
  dateRange,
  filters,
  setActiveTab,
  setDateRange,
  onFilterChange,
  onExport,
  refetch
} = useReports('attendance');
```

## Features

- **Multiple Report Types**: Support for attendance, students, employees, visitors, incidents, and ID cards
- **Advanced Filtering**: Filter by date range, user type, status, and search
- **PDF Export**: Generate and download reports in PDF format
- **Responsive Design**: Works on desktop and mobile devices
- **Type Safety**: Fully typed with TypeScript

## Dependencies

- `date-fns` - Date manipulation
- `jspdf` - PDF generation
- `jspdf-autotable` - Table generation in PDFs
- `react-day-picker` - Date range picker

## Future Improvements

- Add more report types as needed
- Implement server-side pagination for large datasets
- Add CSV export option
- Add more filter options and presets
- Implement report scheduling
