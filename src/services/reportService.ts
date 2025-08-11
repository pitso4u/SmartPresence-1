import apiClient from '../config/api';

// Types for report parameters
export interface ReportParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
  user_type?: string;
  [key: string]: any; // Allow additional dynamic parameters
}

/**
 * Fetch report data from the API
 * @param reportType Type of report to fetch (e.g., 'attendance')
 * @param params Query parameters for filtering
 * @returns Promise with report data
 */
export const fetchReportData = async (
  reportType: string, 
  params: Partial<ReportParams> = {}
) => {
  try {
    // Convert params to query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    // Use apiClient to make the request
    // Use the same endpoint as attendanceService since we know it works
    const response = await apiClient.get(`/attendance?${queryParams}`);
    
    if (!response) {
      throw new Error('No response received from the server');
    }
    
    // The attendance endpoint returns the array directly, not wrapped in a data property
    if (!Array.isArray(response)) {
      console.warn('Expected an array response but got:', { response });
      return [];
    }
    
    console.log(`[reportService] Fetched ${reportType} report data:`, response);
    return response;
  } catch (error) {
    console.error(`Error fetching ${reportType} report:`, error);
    throw error;
  }
};

/**
 * Export report data to CSV
 * @param reportType Type of report to export (e.g., 'attendance')
 * @param params Query parameters for filtering
 * @returns Promise that resolves when the download starts
 */
export const exportReportToCSV = async (
  reportType: string, 
  params: Partial<ReportParams> = {}
) => {
  try {
    // Convert params to query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    // Use apiClient to make the request with custom headers
    const response = await fetch(`${apiClient.baseURL}/reports/${reportType}/export?${queryParams}`, {
      method: 'GET',
      credentials: 'include', // This is needed for cookies
      headers: {
        'Accept': 'text/csv',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    // Create a download link for the CSV file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    console.error(`Error exporting ${reportType} report:`, error);
    throw error;
  }
};

/**
 * Get available filter options for reports
 * @param filterType Type of filter options to fetch
 * @returns Promise with filter options
 */
export const getFilterOptions = async (filterType: string) => {
  try {
    const response = await apiClient.get(`/reports/filter-options/${filterType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${filterType} filter options:`, error);
    throw error;
  }
};

/**
 * Get all reports summary for dashboard
 * @returns Promise with reports summary data
 */
export const getAll = async () => {
  try {
    console.log('Fetching reports summary from:', `${apiClient.baseURL}/reports/summary`);
    const response = await apiClient.get('/reports/summary');
    console.log('Raw API response:', response);
    
    if (!response) {
      throw new Error('No response received from the server');
    }
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Return the full response since the API might be returning data at the root level
    return response;
  } catch (error: unknown) {
    console.error('Error in reportService.getAll():', error);
    // Return a default response structure to prevent undefined errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      total: {
        students: 0,
        employees: 0,
        visitors: 0,
        openIncidents: 0,
        attendance: 0
      },
      recent: [],
      error: errorMessage
    };
  }
};

// Default export for backward compatibility
const reportService = {
  fetchReportData,
  exportReportToCSV,
  getFilterOptions,
  getAll
};

export default reportService;
