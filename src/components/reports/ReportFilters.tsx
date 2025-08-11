import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { ReportFiltersProps } from './ReportTypes';
import Select, { SelectOption } from '@/components/ui/select';
import { ReportExport } from './ReportExport';

export function ReportFilters({
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onExport,
  isLoading,
  hasData,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 flex flex-col md:flex-row gap-4">
        {/* Date Range Picker - Simplified for now */}
        <div className="w-full md:w-auto">
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
            onClick={() => {
              // For now, just log the click - we'll implement a proper date picker later
              console.log('Date range picker clicked');
              // Call onDateRangeChange to avoid TypeScript warning
              if (onDateRangeChange) {
                onDateRangeChange(dateRange);
              }
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(new Date(dateRange.from), 'MMM d, yyyy')} -{' '}
                  {format(new Date(dateRange.to), 'MMM d, yyyy')}
                </>
              ) : (
                format(new Date(dateRange.from), 'MMM d, yyyy')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </div>

        {/* User Type Filter */}
        <div className="w-full md:w-48">
          <div className="relative">
            <Select
              options={[
                { value: '', label: 'All User Types' },
                { value: 'student', label: 'Students' },
                { value: 'employee', label: 'Employees' },
                { value: 'visitor', label: 'Visitors' }
              ]}
              value={{
                value: filters.userType.value,
                label: filters.userType.label || 'All User Types'
              }}
              onChange={(option: SelectOption) => onFilterChange('userType', { 
                ...filters.userType, 
                value: option?.value?.toString() || '',
                label: option?.label || 'All User Types'
              })}
              placeholder="Select user type"
              className="w-full"
            />
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform opacity-50" />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <div className="relative">
            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' },
                { value: 'excused', label: 'Excused' }
              ]}
              value={{
                value: filters.status.value,
                label: filters.status.label || 'All Statuses'
              }}
              onChange={(option: SelectOption) => onFilterChange('status', { 
                ...filters.status, 
                value: option?.value?.toString() || '',
                label: option?.label || 'All Statuses'
              })}
              placeholder="Select status"
              className="w-full"
            />
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform opacity-50" />
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-8"
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value as string)}
            />
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="w-full md:w-auto">
        <ReportExport 
          onExport={onExport} 
          isLoading={isLoading} 
          disabled={!hasData} 
        />
      </div>
    </div>
  );
}
