import { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import Select, { SelectOption } from '@/components/ui/select';
import { Badge } from '../../components/ui/badge';
import { format, parseISO } from 'date-fns';

export interface ReportFilters {
  userType: SelectOption;
  status: SelectOption;
  dateRange: SelectOption;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  name: string;
  type: string;
  date: Date | string;
  timeIn: Date | string;
  timeOut?: Date | string | null;
  status: string;
}

export interface AttendanceReportProps {
  data: AttendanceRecord[];
  isLoading: boolean;
  onExport: () => Promise<void>;
  onFilterChange: (key: keyof ReportFilters, value: string) => void;
  filters: ReportFilters;
  dateRange: { from: Date; to: Date };
}

// Filter options
const userTypeOptions: SelectOption[] = [
  { value: '', label: 'All User Types' },
  { value: 'student', label: 'Student' },
  { value: 'employee', label: 'Employee' },
  { value: 'visitor', label: 'Visitor' },
];

const statusOptions: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half-day', label: 'Half Day' },
];

// Helper function to format date or datetime strings
const formatDateTime = (dateTime: string | Date | null | undefined): string => {
  if (!dateTime) return 'N/A';
  const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
  return format(date, 'MMM d, yyyy hh:mm a');
};

const dateRangeOptions: SelectOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
];

export const AttendanceReport = ({
  data,
  isLoading,
  onExport,
  onFilterChange,
  filters,
  dateRange,
}: AttendanceReportProps) => {
  // Format status badge
  const getStatusBadge = useCallback((status: string) => {
    const statusColors: Record<string, string> = {
      'Present': 'bg-green-100 text-green-800',
      'Late': 'bg-yellow-100 text-yellow-800',
      'Absent': 'bg-red-100 text-red-800',
      'Half-day': 'bg-blue-100 text-blue-800',
    };
    
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={colorClass}>
        {status}
      </Badge>
    );
  }, []);

  // Define columns for the data table
  const columns = useMemo<ColumnDef<AttendanceRecord>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="font-medium">{String(row.original.name)}</div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'User Type',
        cell: ({ row }) => (
          <span className="capitalize">{String(row.original.type)}</span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => {
          const date = row.getValue('date');
          return formatDateTime(date as string | Date);
        },
      },
      {
        accessorKey: 'timeIn',
        header: 'Time In',
        cell: ({ row }) => {
          const timeIn = row.getValue('timeIn');
          return timeIn ? formatDateTime(timeIn as string | Date) : 'N/A';
        },
      },
      {
        accessorKey: 'timeOut',
        header: 'Time Out',
        cell: ({ row }) => {
          const timeOut = row.getValue('timeOut');
          return timeOut ? formatDateTime(timeOut as string | Date) : 'N/A';
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(String(row.original.status)),
      },
    ],
    [getStatusBadge]
  );

  // Handle filter changes with proper typing
  const handleFilterChange = useCallback((key: keyof ReportFilters, option: SelectOption | null) => {
    if (option) {
      // Ensure we're passing a string value to onFilterChange
      const value = typeof option.value === 'number' ? option.value.toString() : option.value;
      onFilterChange(key, value);
    } else {
      onFilterChange(key, '');
    }
  }, [onFilterChange]);

  // Format date range for display
  const formattedDateRange = `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Attendance Report</h2>
        <Button variant="outline" onClick={onExport} disabled={!data.length}>
          Export to CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">User Type</label>
          <Select
            value={filters.userType}
            onChange={(option) => handleFilterChange('userType', option)}
            options={userTypeOptions}
            placeholder="Select user type"
            className="w-[200px]"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select
            value={filters.status}
            onChange={(option) => handleFilterChange('status', option)}
            options={statusOptions}
            placeholder="Select status"
            className="w-[200px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Date Range</label>
          <Select
            options={dateRangeOptions}
            value={filters.dateRange}
            onChange={(option) => handleFilterChange('dateRange', option)}
            placeholder="Select date range"
            className="w-[200px]"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Attendance Records</h3>
              <p className="text-sm text-muted-foreground">
                Showing {data.length} records from {formattedDateRange}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Select
                  value={filters.userType}
                  onChange={(option) => handleFilterChange('userType', option)}
                  options={userTypeOptions}
                  placeholder="User type"
                  className="w-[200px]"
                />
                <Select
                  value={filters.status}
                  onChange={(option) => handleFilterChange('status', option)}
                  options={statusOptions}
                  placeholder="Status"
                  className="w-[200px]"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={onExport} 
                disabled={!data.length}
                className="ml-2"
              >
                Export to CSV
              </Button>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            emptyState={
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  {isLoading ? 'Loading attendance records...' : 'No attendance records found for the selected filters'}
                </p>
                {!isLoading && data.length === 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      onFilterChange('userType', '');
                      onFilterChange('status', '');
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};
