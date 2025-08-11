import { useState, useEffect, useCallback } from 'react';
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ReportType, ReportData, ReportFiltersState, DateRange } from './ReportTypes';
import { processApiResponse, generatePdf } from './reportUtils';

export function useReports(initialReportType: ReportType = 'attendance') {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for report data and loading
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [activeTab, setActiveTab] = useState<ReportType>(initialReportType);
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 })
  }));
  
  const [filters, setFilters] = useState<ReportFiltersState>({
    userType: { value: '', label: 'All User Types' },
    status: { value: '', label: 'All Statuses' },
    dateRange: { 
      value: 'this-week', 
      label: 'This Week',
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 })
    },
    search: ''
  });

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real app, you would make an API call here
      // For now, we'll use mock data
      const mockData: ReportData[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'John Doe',
          type: 'student',
          date: new Date().toISOString(),
          timeIn: new Date().toISOString(),
          status: 'present'
        },
        // Add more mock data as needed
      ];
      
      setReportData(mockData);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, dateRange, filters, user?.token]);

  // Handle filter changes
  const handleFilterChange = useCallback((type: keyof ReportFiltersState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [type]: { ...prev[type], ...(typeof value === 'object' ? value : { value }) }
    }));
  }, []);

  // Handle date range change
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range?.from && range.to) {
      setDateRange(range);
      handleFilterChange('dateRange', {
        value: 'custom',
        label: 'Custom Range',
        from: range.from,
        to: range.to
      });
    }
  }, [handleFilterChange]);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as ReportType);
  }, []);

  // Handle export to PDF
  const handleExport = useCallback(async () => {
    if (reportData.length === 0) return;
    
    try {
      await generatePdf(reportData, dateRange);
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [reportData, dateRange]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return {
    // State
    reportData,
    isLoading,
    error,
    activeTab,
    dateRange,
    filters,
    
    // Handlers
    setActiveTab: handleTabChange,
    setDateRange: handleDateRangeChange,
    onFilterChange: handleFilterChange,
    onExport: handleExport,
    refetch: fetchReportData
  };
}
