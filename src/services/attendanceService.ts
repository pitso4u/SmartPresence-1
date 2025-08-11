import { AttendanceLog } from '../types';
import apiClient from '../config/api';

export const attendanceService = {
  // Get all attendance logs
  async getAll(filters: { startDate?: string; endDate?: string; userType?: string } = {}): Promise<AttendanceLog[]> {
    try {
      const params: Record<string, string> = {};
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.userType) params.user_type = filters.userType;

      const queryString = new URLSearchParams(params).toString();
      const url = `/attendance${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<any>(url);

      // The response is the array itself, not an object with a 'data' property.
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch attendance logs:', error);
      throw error;
    }
  },

  // Get attendance log by ID
  async getById(id: number): Promise<AttendanceLog | null> {
    try {
      const response = await apiClient.get<AttendanceLog>(`/attendance/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch attendance log ${id}:`, error);
      throw error;
    }
  },

  // Create new attendance log
  async create(attendanceData: Omit<AttendanceLog, 'id'>): Promise<AttendanceLog> {
    try {
      const response = await apiClient.post<AttendanceLog>('/attendance', attendanceData);
      return response.data!;
    } catch (error) {
      console.error('Failed to create attendance log:', error);
      throw error;
    }
  },

  // Update attendance log
  async update(id: number, attendanceData: Partial<AttendanceLog>): Promise<AttendanceLog | null> {
    try {
      const response = await apiClient.put<AttendanceLog>(`/attendance/${id}`, attendanceData);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to update attendance log ${id}:`, error);
      throw error;
    }
  },

  // Delete attendance log
  async delete(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/attendance/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete attendance log ${id}:`, error);
      throw error;
    }
  },

  // Get attendance by user
  async getByUser(userId: number, userType: 'student' | 'employee'): Promise<AttendanceLog[]> {
    try {
      const response = await apiClient.get<AttendanceLog[]>(`/attendance/user/${userId}?userType=${userType}`);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to fetch attendance for user ${userId}:`, error);
      throw error;
    }
  },

  // Get attendance by date range
  async getByDateRange(startDate: string, endDate: string): Promise<AttendanceLog[]> {
    try {
      const response = await apiClient.get<AttendanceLog[]>(`/attendance/date-range?start=${startDate}&end=${endDate}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch attendance by date range:', error);
      throw error;
    }
  },

  // Sync attendance
  async sync(syncData: any): Promise<any> {
    try {
      const response = await apiClient.post('/attendance/sync', syncData);
      return response.data;
    } catch (error) {
      console.error('Failed to sync attendance:', error);
      throw error;
    }
  }
};