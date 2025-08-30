import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Edit, Trash2, User, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { getPhotoUrl } from '../../utils/photoUtils';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../ui/use-toast';
import type { Student, Employee, AttendanceLog } from '../../types';

interface AttendanceTableProps {
  logs: any[];
  students: Student[];
  employees: Employee[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const getUserInfo = (log: any, students: Student[], employees: Employee[]) => {
  if (log.user_type === 'student') {
    const student = students.find(s => s.id === log.user_id);
    return student ? {
      name: student.full_name,
      identifier: student.student_code,
      photo: getPhotoUrl(student.photo_path) 
    } : null;
  } else {
    const employee = employees.find(e => e.id === log.user_id);
    return employee ? {
      name: employee.full_name,
      identifier: employee.employee_id,
      photo: getPhotoUrl(employee.photo_path) 
    } : null;
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'bg-green-100 text-green-800';
  if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'present':
      return 'default';
    case 'late':
      return 'secondary';
    case 'absent':
      return 'destructive';
    case 'excused':
      return 'outline';
    default:
      return 'outline';
  }
};

const getFallbackImage = (userType: string) => {
  return userType === 'student' 
    ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNFNUU1RTUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMiA2LjQ4IDIgMTJaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xMiA2QzE0LjIwOTEgNiAxNiA3Ljc5MDg2IDE2IDEwQzE2IDEyLjIwOTEgMTQuMjA5MSAxNCAxMiAxNEM5Ljc5MDg2IDE0IDggMTIuMjA5MSA4IDEwQzggNy43OTA4NiA5Ljc5MDg2IDYgMTIgNloiIGZpbGw9IiM5OTk5OTkiLz4KPHBhdGggZD0iTTEyIDIyQzE1LjMxIDIyIDE4LjE5IDIwLjQyIDE5LjUgMTcuOTlDMTkuNDggMTUuOTkgMTUuNDggMTQuOTkgMTIgMTQuOTlDOC41MiAxNC45OSA0LjUyIDE1Ljk5IDQuNSAxNy45OUM1LjgxIDIwLjQyIDguNjkgMjIgMTIgMjJaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo8L3N2Zz4K'
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNFNUU1RTUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMiA2LjQ4IDIgMTJaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xMiA2QzE0LjIwOTEgNiAxNiA3Ljc5MDg2IDE2IDEwQzE2IDEyLjIwOTEgMTQuMjA5MSAxNCAxMiAxNEM5Ljc5MDg2IDE0IDggMTIuMjA5MSA4IDEwQzggNy43OTA4NiA5Ljc5MDg2IDYgMTIgNloiIGZpbGw9IiM5OTk5OTkiLz4KPHBhdGggZD0iTTEyIDIyQzE1LjMxIDIyIDE4LjE5IDIwLjQyIDE5LjUgMTcuOTlDMTkuNDggMTUuOTkgMTUuNDggMTQuOTkgMTIgMTQuOTlDOC41MiAxNC45OSA0LjUyIDE1Ljk5IDQuNSAxNy45OUM1LjgxIDIwLjQyIDguNjkgMjIgMTIgMjJaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
};

export const AttendanceTable = ({
  logs,
  students,
  employees,
  isLoading = false,
  onRefresh,
}: AttendanceTableProps) => {
  const { toast } = useToast();
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<AttendanceLog | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle edit attendance
  const handleEdit = (log: AttendanceLog) => {
    setEditingLog(log);
    setSelectedStatus(log.status);
  };

  // Handle delete attendance
  const handleDelete = (log: AttendanceLog) => {
    setDeletingLog(log);
  };

  // Confirm delete attendance
  const confirmDelete = async () => {
    if (!deletingLog) return;
    
    try {
      setIsDeleting(true);
      await attendanceService.deleteAttendance(deletingLog.id);
      
      toast({
        title: 'Success',
        description: 'Attendance record deleted successfully',
      });
      
      // Refresh the data
      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete attendance record',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeletingLog(null);
    }
  };

  // Update attendance status
  const updateAttendanceStatus = async (logId: number, newStatus: string) => {
    try {
      setIsUpdating(true);
      await attendanceService.updateAttendance(logId, { status: newStatus });
      
      toast({
        title: 'Success',
        description: 'Attendance record updated successfully',
      });
      
      // Refresh the data
      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to update attendance record',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
      setEditingLog(null);
    }
  };

  const [selectedStatus, setSelectedStatus] = useState<string>('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No attendance records found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
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
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => {
              const userInfo = getUserInfo(log, students, employees);
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
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = getFallbackImage(log.user_type);
                            }}
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
                    <Badge
                      variant={log.user_type === 'student' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {log.user_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="capitalize">
                      {log.method?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.match_confidence ? (
                      <Badge className={getConfidenceColor(log.match_confidence)}>
                        {(log.match_confidence * 100).toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusVariant(log.status)}>
                      {log.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(log)}
                        disabled={isUpdating}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(log)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Attendance Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Edit Attendance</h3>
                <p className="text-sm text-muted-foreground">
                  Update attendance status for {getUserInfo(editingLog, students, employees)?.name || 'Unknown User'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Current Status</label>
                <p className="text-sm text-gray-600">{editingLog.status}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">New Status</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={selectedStatus || editingLog.status}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingLog(null);
                  setSelectedStatus('');
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateAttendanceStatus(editingLog.id, selectedStatus || editingLog.status)}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold">Delete Attendance Record</h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete the attendance record for{' '}
                <strong>{getUserInfo(deletingLog, students, employees)?.name || 'Unknown User'}</strong>?
              </p>
              <p className="text-xs text-gray-500">
                Recorded on {format(new Date(deletingLog.timestamp), 'MMM dd, yyyy HH:mm')} 
                via {deletingLog.method?.replace('_', ' ')} method
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingLog(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
