import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Clock, User } from 'lucide-react';
import { AttendanceLog } from '../types';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';
import { employeeService } from '../services/employeeService';
import { format } from 'date-fns';

export function Attendance() {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    userType: 'all' as 'all' | 'student' | 'employee'
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [logs, studentsData, employeesData] = await Promise.all([
        attendanceService.getAll(filters),
        studentService.getAll(),
        employeeService.getAll()
      ]);
      
      setAttendanceLogs(logs);
      setStudents(studentsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInfo = (log: AttendanceLog) => {
    if (log.user_type === 'student') {
      const student = students.find(s => s.id === log.user_id);
      return student ? { name: student.full_name, identifier: student.student_code, photo: student.photo_path } : null;
    } else {
      const employee = employees.find(e => e.id === log.user_id);
      return employee ? { name: employee.full_name, identifier: employee.employee_id, photo: employee.photo_path } : null;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Logs</h1>
          <p className="text-gray-600 mt-2">View and filter attendance records</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.userType}
                onChange={(e) => setFilters({ ...filters, userType: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="student">Students Only</option>
                <option value="employee">Employees Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceLogs.map((log) => {
                const userInfo = getUserInfo(log);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {userInfo ? (
                          <>
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={userInfo.photo}
                              alt={userInfo.name}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {userInfo.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {userInfo.identifier}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Unknown User
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {log.user_id}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.user_type === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {log.user_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(log.match_confidence)}`}>
                        {(log.match_confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.synced ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.synced ? 'Synced' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {attendanceLogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No attendance records found for the selected filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}