import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { PlusCircle, Download, Calendar, Filter, QrCode, User, Camera } from 'lucide-react';

// UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';

// Custom Components
import { SimpleQRScanner } from '../components/SimpleQRScanner';
import { AttendanceTable } from '../components/attendance/AttendanceTable';
import { ManualEntryForm } from '../components/attendance/ManualEntryForm';
import { FaceRecognition } from '../components/FaceRecognition';
import { TestQRCode } from '../components/TestQRCode';

// Services
import { attendanceService } from '../services/attendanceService';
import apiClient from '../config/api';

// Utils
import { getPhotoUrl } from '../utils/photoUtils';

// Types
import type { Student, Employee } from '../types';

interface AttendanceData {
  attendanceLogs: any[];
  students: Student[];
  employees: Employee[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

// Real data fetching function
const fetchAttendanceData = async (): Promise<AttendanceData> => {
  try {
    // Fetch data in parallel
    const [attendanceLogsResponse, studentsResponse, employeesResponse] = await Promise.all([
      attendanceService.getAll(),
      apiClient.get('/students'),
      apiClient.get('/employees')
    ]);

    const attendanceLogs = Array.isArray(attendanceLogsResponse) ? attendanceLogsResponse : [];
    
    // Handle different response structures
    let students = [];
    if (studentsResponse.data) {
      students = Array.isArray(studentsResponse.data) ? studentsResponse.data : 
                 studentsResponse.data.data || studentsResponse.data.students || [];
    }
    
    let employees = [];
    if (employeesResponse.data) {
      employees = Array.isArray(employeesResponse.data) ? employeesResponse.data : 
                  employeesResponse.data.data || employeesResponse.data.employees || [];
    }
    
    console.log('Fetched data:', {
      attendanceLogs: attendanceLogs.length,
      students: students.length,
      employees: employees.length,
      studentsResponse: studentsResponse,
      employeesResponse: employeesResponse
    });

    return {
      attendanceLogs,
      students,
      employees,
      isLoading: false,
      refreshData: async () => {
        // This will be set by the component
      }
    };
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return {
      attendanceLogs: [],
      students: [],
      employees: [],
      isLoading: false,
      refreshData: async () => {}
    };
  }
};

export function Attendance() {
  const { toast } = useToast();
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'manual' | 'face'>('qr');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Face recognition state
  const [isFaceRecognitionOpen, setIsFaceRecognitionOpen] = useState(false);
  const [faceRecognitionResult, setFaceRecognitionResult] = useState<{
    userId: string;
    userType: 'student' | 'employee';
    confidence?: number;
    userInfo?: any;
  } | null>(null);
  const [isProcessingFaceRecognition, setIsProcessingFaceRecognition] = useState(false);
  
  // Data state
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    attendanceLogs: [],
    students: [],
    employees: [],
    isLoading: true,
    refreshData: async () => {}
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setAttendanceData(prev => ({ ...prev, isLoading: true }));
      const data = await fetchAttendanceData();
      // Set the refreshData function to call loadData
      setAttendanceData({
        ...data,
        refreshData: async () => {
          await loadData();
        }
      });
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setAttendanceData(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const { attendanceLogs, students, employees, isLoading, refreshData } = attendanceData;
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    userType: 'all' as 'all' | 'student' | 'employee',
  });
  
  // Process users for manual entry form
  console.log('Processing users for manual entry:', { students, employees });
  
  const studentOptions = (students || []).map((student: Student) => ({
    id: student.id,
    name: student.full_name,
    identifier: student.student_code,
    photo: getPhotoUrl(student.photo_path),
  }));
  
  const employeeOptions = (employees || []).map((employee: Employee) => ({
    id: employee.id,
    name: employee.full_name,
    identifier: employee.employee_id,
    photo: getPhotoUrl(employee.photo_path),
  }));
  
  console.log('Processed options:', {
    studentOptions: studentOptions.length,
    employeeOptions: employeeOptions.length
  });
  
  // Filter attendance logs based on filters
  const filteredLogs = (attendanceLogs || []).filter((log: any) => {
    try {
      const logDate = new Date(log.timestamp);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      // Apply date filters
      if (startDate && logDate < startDate) return false;
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        if (logDate >= nextDay) return false;
      }
      
      // Apply user type filter
      if (filters.userType !== 'all' && log.user_type !== filters.userType) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error filtering log:', log, error);
      return false;
    }
  });

  // Handle QR code scan
  const handleScanSuccess = useCallback(async (decodedText: string) => {
    try {
      setScanResult('Processing QR code...');
      setScanError(null);
      
      // Parse the QR code data
      let userId: number;
      let userType: 'student' | 'employee';
      
      // Check if it's a card ID
      if (decodedText.startsWith('card_')) {
        const cardId = decodedText.split('_')[1];
        if (!cardId) throw new Error('Invalid card ID format');
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/cards/${cardId}`);
        if (!response.ok) throw new Error('Failed to fetch card details');
        
        const cardData = await response.json();
        if (!cardData.user_id || !cardData.user_type) {
          throw new Error('Invalid card data received');
        }
        
        userId = cardData.user_id;
        userType = cardData.user_type;
      } else {
        // Try to parse as JSON
        try {
          const qrData = JSON.parse(decodedText);
          userId = parseInt(qrData.user_id || qrData.userId, 10);
          userType = (qrData.user_type || qrData.userType)?.toLowerCase();
        } catch (e) {
          // If parsing as JSON fails, try to extract from string
          const match = decodedText.match(/user[Ii][dD]["']?\s*[:=]\s*([0-9]+).*?user[Tt]ype["']?\s*[:=]\s*["'](student|employee)["']/);
          if (match && match[1] && match[2]) {
            userId = parseInt(match[1], 10);
            userType = match[2].toLowerCase() as 'student' | 'employee';
          } else {
            throw new Error('Invalid QR code format');
          }
        }
      }
      
      // Validate user type
      if (userType !== 'student' && userType !== 'employee') {
        throw new Error('Invalid user type in QR code');
      }
      
      // Log attendance
      await attendanceService.create({
        user_id: userId,
        user_type: userType,
        method: 'qr',
        timestamp: new Date().toISOString(),
        status: 'present',
        match_confidence: 1.0,
        synced: 0 as 0, // Explicitly type as 0 to match the expected type
      });
      
      // Show success and refresh data
      setScanResult('Attendance logged successfully!');
      toast({
        title: 'Success',
        description: 'Attendance logged successfully!',
        variant: 'default',
      });
      
      // Close modal after delay
      setTimeout(() => {
        setIsModalOpen(false);
        setScanResult(null);
        refreshData();
      }, 2000);
      
    } catch (error) {
      console.error('Error processing QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process QR code';
      setScanError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [refreshData, toast]);
  
  // Handle manual entry submission
  const handleManualSuccess = useCallback(() => {
    setScanResult('Attendance logged successfully!');
    setTimeout(() => {
      setIsModalOpen(false);
      setScanResult(null);
      refreshData();
    }, 1000);
  }, [refreshData]);
  
  // Handle scan errors
  const handleScanError = useCallback((error: Error) => {
    console.error('QR Scanner error:', error);
    setScanError(error.message);
  }, []);
  
  // Reset modal state when closing
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setActiveTab('qr');
    setScanResult(null);
    setScanError(null);
  }, []);
  
  // Export attendance data
  const handleExport = useCallback(async () => {
    try {
      const logs = await attendanceService.getAll({
        startDate: filters.startDate,
        endDate: filters.endDate,
        userType: filters.userType === 'all' ? undefined : filters.userType
      });
      
      // Convert logs to CSV
      const headers = ['ID', 'User', 'Type', 'Status', 'Method', 'Timestamp'];
      const csvRows = [
        headers.join(','),
        ...logs.map(log => {
          const user = log.user_type === 'student' 
            ? students.find(s => s.id === log.user_id)
            : employees.find(e => e.id === log.user_id);
          
          const userName = user?.full_name || 'Unknown';
          const userIdentifier = user && 'student_code' in user 
            ? (user as Student).student_code 
            : (user as Employee)?.employee_id || 'N/A';
            
          return [
            log.id,
            `"${userName} (${userIdentifier})"`,
            log.user_type,
            log.status,
            log.method,
            new Date(log.timestamp).toLocaleString()
          ].join(',');
        })
      ];
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export attendance data',
        variant: 'destructive',
      });
    }
  }, [filters, students, employees, toast]);

  // Handle face recognition success
  const handleFaceRecognitionSuccess = useCallback(async (userId: string, userType: 'student' | 'employee', confidence?: number) => {
    try {
      setIsProcessingFaceRecognition(true);
      setFaceRecognitionResult(null);
      
      // Find user information
      const userList = userType === 'student' ? students : employees;
      const userInfo = userList.find((user: any) => user.id.toString() === userId);
      
      if (!userInfo) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // Record attendance
      const attendanceData = {
        user_id: parseInt(userId, 10),
        user_type: userType,
        timestamp: new Date().toISOString(),
        status: 'present' as const,
        method: 'face_recognition' as const,
        confidence: confidence,
        recognition_data: {
          timestamp: new Date().toISOString(),
          confidence: confidence || 0,
          method: 'face_recognition',
          device_info: navigator.userAgent,
        }
      };
      
      const result = await attendanceService.recordFaceRecognition(attendanceData);
      
      // Set result for display
      setFaceRecognitionResult({
        userId,
        userType,
        confidence,
        userInfo
      });
      
      // Show success message
      toast({
        title: "Attendance Recorded",
        description: `Face recognition successful for ${userInfo.full_name} (${confidence ? (confidence * 100).toFixed(1) : 'N/A'}% confidence)`,
        variant: "default"
      });
      
      // Refresh data
      await refreshData();
      
    } catch (error) {
      console.error('Error processing face recognition attendance:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to record attendance',
        variant: "destructive"
      });
    } finally {
      setIsProcessingFaceRecognition(false);
    }
  }, [students, employees, refreshData, toast]);

  // Handle face recognition error
  const handleFaceRecognitionError = useCallback((error: string) => {
    console.error('Face recognition error:', error);
    toast({
      title: "Face Recognition Error",
      description: error,
      variant: "destructive"
    });
  }, [toast]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-sm text-gray-500">Track and manage attendance records</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Log Attendance</span>
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-range" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Date Range</span>
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => 
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="w-full"
                />
                <div className="self-center text-gray-500">to</div>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => 
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="w-full"
                  min={filters.startDate}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="user-type" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>User Type</span>
              </Label>
              <select
                id="user-type"
                value={filters.userType}
                onChange={(e) => 
                  setFilters({ ...filters, userType: e.target.value as 'all' | 'student' | 'employee' })
                }
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Users</option>
                <option value="student">Students Only</option>
                <option value="employee">Employees Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Attendance Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Attendance Records</CardTitle>
            <div className="text-sm text-gray-500">
              {filteredLogs.length} records found
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceTable 
            logs={filteredLogs}
            students={students}
            employees={employees}
            isLoading={isLoading}
            onRefresh={refreshData}
          />
        </CardContent>
      </Card>
      
      {/* Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Log Attendance</h2>
                <button
                  onClick={handleModalClose}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'qr' | 'manual' | 'face')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="qr" className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <span>QR Code</span>
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Manual Entry</span>
                  </TabsTrigger>
                  <TabsTrigger value="face" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span>Face Recognition</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="qr" className="mt-4">
                  <div className="space-y-4">
                    {/* Test QR Code */}
                    <div className="flex justify-center mb-4">
                      <TestQRCode 
                        value='{"user_id": 1, "user_type": "student"}' 
                        size={150}
                      />
                    </div>
                    
                    <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden p-2">
                      <SimpleQRScanner 
                        onScanSuccess={handleScanSuccess}
                        onError={handleScanError}
                        isModalOpen={isModalOpen && activeTab === 'qr'}
                      />
                    </div>
                    {scanResult && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700">{scanResult}</p>
                      </div>
                    )}
                    {scanError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700">{scanError}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="manual" className="mt-4">
                  <ManualEntryForm
                    students={studentOptions}
                    employees={employeeOptions}
                    onSuccess={handleManualSuccess}
                    onCancel={handleModalClose}
                  />
                </TabsContent>

                <TabsContent value="face" className="mt-4">
                  <div className="space-y-4">
                    <div className="text-center space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Use face recognition to record attendance. Click "Start Recognition" to begin scanning for faces.
                      </p>
                      
                      <Button 
                        onClick={() => setIsFaceRecognitionOpen(true)}
                        className="w-full"
                        disabled={isProcessingFaceRecognition}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        {isProcessingFaceRecognition ? 'Processing...' : 'Start Face Recognition'}
                      </Button>
                    </div>
                    
                    {faceRecognitionResult && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800">
                              {faceRecognitionResult.userInfo?.full_name || 'Unknown User'}
                            </h4>
                            <p className="text-sm text-green-600">
                              {faceRecognitionResult.userType === 'student' ? 'Student' : 'Employee'} • 
                              Confidence: {faceRecognitionResult.confidence ? (faceRecognitionResult.confidence * 100).toFixed(1) : 'N/A'}%
                            </p>
                            <p className="text-xs text-green-500">
                              Attendance recorded successfully
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Face Recognition Modal */}
                  {isFaceRecognitionOpen && (
                    <FaceRecognition
                      onFaceRecognized={(userId, userType, confidence) => {
                        handleFaceRecognitionSuccess(userId, userType, confidence);
                        setIsFaceRecognitionOpen(false);
                      }}
                      onClose={() => setIsFaceRecognitionOpen(false)}
                      isEnrollmentMode={false}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <Button variant="outline" onClick={handleModalClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
