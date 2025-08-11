import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import { fetchReportData, exportReportToCSV, getFilterOptions } from '../reportService';
import apiClient from '../../config/api';

// Mock the apiClient
vi.mock('../../config/api', () => ({
  default: {
    get: vi.fn(),
    baseURL: 'http://localhost:3000/api/v1',
  },
}));

// Mock the getAuthToken function
vi.mock('../authService', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
}));

// Mock browser APIs
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();

// Store original implementations
const originalCreateElement = document.createElement;
const originalBodyAppend = document.body.appendChild;
const originalBodyRemove = document.body.removeChild;

beforeAll(() => {
  // Mock global URL
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  
  // Mock document.createElement for anchor tags
  document.createElement = vi.fn((tag) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
        setAttribute: vi.fn(),
        remove: vi.fn(),
      };
    }
    return originalCreateElement(tag);
  });
  
  // Mock fetch
  global.fetch = vi.fn();
});

afterEach(() => {
  // Reset all mocks after each test
  vi.clearAllMocks();
});

describe('Report Service', () => {
  const mockToken = 'test-token';
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Set up default mock implementation
    (apiClient.get as any).mockResolvedValue({ data: [] });
  });

  describe('fetchReportData', () => {
    it('should fetch report data with correct parameters', async () => {
      const reportType = 'attendance';
      const params = { start_date: '2023-01-01', end_date: '2023-01-31' };
      const mockResponse = { data: [{ id: 1, date: '2023-01-15', status: 'present' }] };
      
      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchReportData(reportType, params);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/reports/${reportType}`,
        { params }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when fetching report data', async () => {
      const reportType = 'students';
      const errorMessage = 'Network Error';
      
      (apiClient.get as any).mockRejectedValueOnce(new Error(errorMessage));

      await expect(fetchReportData(reportType, {})).rejects.toThrow(errorMessage);
    });
  });

  describe('exportReportToCSV', () => {
    it('should export report data to CSV with correct parameters', async () => {
      const reportType = 'attendance';
      const params = { start_date: '2023-01-01', end_date: '2023-01-31' };
      const mockBlob = new Blob(['test,csv,data'], { type: 'text/csv' });
      const mockResponse = { data: mockBlob };
      
      // Mock the fetch implementation for export
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
      global.fetch = mockFetch as any;

      // Mock URL.createObjectURL
      const mockCreateObjectURL = vi.fn(() => 'blob:test');
      global.URL.createObjectURL = mockCreateObjectURL as any;

      // Mock document.createElement and appendChild/removeChild
      const mockClick = vi.fn();
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockImplementation((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick,
            setAttribute: vi.fn(),
            remove: vi.fn(),
          };
        }
        return originalCreateElement(tag);
      }) as any;

      const result = await exportReportToCSV(reportType, params);

      // Verify the fetch was called with the correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/reports/${reportType}/export`),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'text/csv',
          },
        })
      );

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockClick).toHaveBeenCalled();
      expect(result).toBe(true);

      // Clean up mocks
      document.createElement = originalCreateElement;
      delete global.URL.createObjectURL;
      delete global.fetch;
    });

    it('should handle errors when exporting to CSV', async () => {
      const reportType = 'students';
      const errorMessage = 'Export failed';
      
      // Mock the fetch to reject with an error
      global.fetch = vi.fn().mockRejectedValueOnce(new Error(errorMessage)) as any;

      await expect(exportReportToCSV(reportType, {})).rejects.toThrow(errorMessage);
      
      // Clean up
      delete global.fetch;
    });
  });

  describe('getFilterOptions', () => {
    it('should fetch filter options with correct parameters', async () => {
      const filterType = 'status';
      const mockResponse = { data: ['active', 'inactive', 'pending'] };
      
      (apiClient.get as any).mockResolvedValueOnce(mockResponse);

      const result = await getFilterOptions(filterType);

      expect(apiClient.get).toHaveBeenCalledWith(
        `/reports/filter-options/${filterType}`
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when fetching filter options', async () => {
      const filterType = 'status';
      const errorMessage = 'Failed to fetch filter options';
      
      (apiClient.get as any).mockRejectedValueOnce(new Error(errorMessage));

      await expect(getFilterOptions(filterType)).rejects.toThrow(errorMessage);
    });
  });
});
