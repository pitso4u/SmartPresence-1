import { DateRange } from 'react-day-picker';

export type ReportType = 'attendance' | 'students' | 'employees' | 'visitors' | 'incidents' | 'id-cards';

export interface ReportData {
  id: string | number;
  userId: string | number;
  name: string;
  type: string;
  date: string | Date;
  timeIn: string | Date;
  timeOut?: string | Date | null;
  status: string;
  [key: string]: any;
}

export interface ReportFilterOption {
  value: string;
  label: string;
}

export interface ReportFiltersState {
  userType: ReportFilterOption;
  status: ReportFilterOption;
  dateRange: ReportFilterOption & { value: string | DateRange };
  search?: string;
}

export interface ReportTableProps {
  data: ReportData[];
  isLoading: boolean;
  onRowClick?: (id: string | number) => void;
}

export interface ReportFiltersProps {
  filters: ReportFiltersState;
  onFilterChange: (type: keyof ReportFiltersState, value: any) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onExport: () => void;
  isLoading: boolean;
  hasData: boolean;
}

export interface ReportExportProps {
  onExport: () => void;
  isLoading: boolean;
  disabled: boolean;
}
