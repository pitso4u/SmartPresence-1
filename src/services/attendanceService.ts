import { AttendanceLog } from '../types';
import { mockAttendanceLogs } from './mockData';

let attendanceLogs = [...mockAttendanceLogs];

export const attendanceService = {
  async getAll(filters?: { 
    startDate?: string; 
    endDate?: string; 
    userType?: 'student' | 'employee' | 'all';
  }): Promise<AttendanceLog[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let filteredLogs = attendanceLogs;
    
    if (filters?.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(filters.startDate!)
      );
    }
    
    if (filters?.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(filters.endDate!)
      );
    }
    
    if (filters?.userType && filters.userType !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.user_type === filters.userType);
    }
    
    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  async getByUserId(userId: number, userType: 'student' | 'employee'): Promise<AttendanceLog[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return attendanceLogs.filter(log => 
      log.user_id === userId && log.user_type === userType
    );
  }
};