import { AttendanceLog, FaceRecognitionLog } from '../types';
import apiClient from '../config/api';
import { offlineSyncService } from './offlineSyncService';

interface FaceRecognitionAttendanceData {
  user_id: number;
  user_type: 'student' | 'employee';
  timestamp: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  method: 'face_recognition' | 'qr_code' | 'manual';
  confidence?: number;
  recognition_data?: {
    timestamp: string;
    confidence: number;
    method: string;
    device_info?: string;
    face_embedding_id?: string;
    liveness_score?: number;
    quality_score?: number;
  };
}

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
      const attendanceLogs = Array.isArray(response) ? response : [];
      
      // Cache the data for offline use (if available)
      try {
        await offlineSyncService.cacheData('attendance', attendanceLogs, '1.0');
      } catch (error) {
        console.warn('Failed to cache attendance data:', error);
        // Continue without caching - this is not critical
      }
      
      return attendanceLogs;
    } catch (error) {
      console.error('Failed to fetch attendance logs:', error);
      
      // If server is unreachable, try to get cached data
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('fetch')
      )) {
        console.log('Server unreachable, trying cached attendance data...');
        
        try {
          const cachedData = await offlineSyncService.getCachedData('attendance');
          if (cachedData) {
            console.log('Returning cached attendance data');
            return cachedData;
          }
        } catch (error) {
          console.warn('Failed to get cached attendance data:', error);
        }
        
        // If no cached data, return empty array
        console.log('No cached data available, returning empty array');
        return [];
      }
      
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

  // Create new attendance log with face recognition support
  async create(attendanceData: Omit<AttendanceLog, 'id'>, attendanceSettings?: {
    startTime: string;
    endTime: string;
    lateThresholdMinutes: number;
  }): Promise<AttendanceLog> {
    try {
      // Determine status based on attendance settings
      let status = attendanceData.status || 'present';
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      if (attendanceSettings) {
        const { startTime, endTime, lateThresholdMinutes } = attendanceSettings;
        
        // Check if current time is within attendance hours
        if (currentTime < startTime || currentTime > endTime) {
          status = 'absent';
        } else {
          // Check if late
          const startTimeMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
          const currentTimeMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
          const lateThreshold = startTimeMinutes + lateThresholdMinutes;
          
          if (currentTimeMinutes > lateThreshold) {
            status = 'late';
          }
        }
      }

      // Add device info for face recognition
      const enhancedData = {
        ...attendanceData,
        status,
        device_info: navigator.userAgent,
        timestamp: attendanceData.timestamp || new Date().toISOString(),
      };

      const response = await apiClient.post<AttendanceLog>('/attendance', enhancedData);
      return response.data!;
    } catch (error) {
      console.error('Failed to create attendance log:', error);
      
      // If server is unreachable, store offline and return a temporary record
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('fetch')
      )) {
        console.log('Server unreachable, storing attendance offline...');
        
        // Store in offline sync service (if available)
        let offlineId = `temp_${Date.now()}`;
        try {
          offlineId = await offlineSyncService.addOfflineData(
            'attendance', 
            'create', 
            enhancedData
          );
        } catch (error) {
          console.warn('Failed to store attendance offline:', error);
          // Continue with temporary ID
        }
        
        // Return a temporary record that will be synced later
        return {
          id: parseInt(offlineId.split('_')[2]), // Use timestamp as temporary ID
          ...enhancedData,
          synced: 0, // Mark as not synced
        } as AttendanceLog;
      }
      
      throw error;
    }
  },

  // Record face recognition attendance
  async recordFaceRecognition(data: FaceRecognitionAttendanceData): Promise<AttendanceLog> {
    try {
      const response = await apiClient.post<AttendanceLog>('/attendance/face', {
        ...data,
        method: 'face_recognition',
        recognition_data: {
          ...data.recognition_data,
          timestamp: data.recognition_data?.timestamp || new Date().toISOString(),
          device_info: navigator.userAgent,
        },
      });
      return response.data!;
    } catch (error) {
      console.error('Failed to record face recognition attendance:', error);
      throw error;
    }
  },

  // Get face recognition logs for a user
  async getFaceRecognitionLogs(userId: number, userType: 'student' | 'employee'): Promise<FaceRecognitionLog[]> {
    try {
      const response = await apiClient.get<FaceRecognitionLog[]>(`/attendance/face/user/${userType}/${userId}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch face recognition logs:', error);
      return [];
    }
  },

  // Update attendance record
  async updateAttendance(id: number, data: { status: string }): Promise<AttendanceLog> {
    try {
      const response = await apiClient.put<AttendanceLog>(`/attendance/${id}`, data);
      return response.data!;
    } catch (error) {
      console.error('Failed to update attendance record:', error);
      throw error;
    }
  },

  // Delete attendance record
  async deleteAttendance(id: number): Promise<void> {
    try {
      const response = await apiClient.delete(`/attendance/${id}`);
      // DELETE requests return 204 No Content, so response.data will be null
      // We just need to ensure the request was successful
      if (!response.success) {
        throw new Error('Failed to delete attendance record');
      }
    } catch (error) {
      console.error('Failed to delete attendance record:', error);
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