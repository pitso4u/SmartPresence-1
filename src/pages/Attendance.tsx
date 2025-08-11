import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Filter, Download, Clock, User, Plus, X, QrCode, Type } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AttendanceLog } from '../types';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';
import { employeeService } from '../services/employeeService';
import { format } from 'date-fns';
import { getPhotoUrl, getFallbackImage } from '../utils/photoUtils';

export function Attendance() {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('qr');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualEntryUserType, setManualEntryUserType] = useState<'student' | 'employee'>('student');
  const [manualEntryUserId, setManualEntryUserId] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    userType: 'all' as 'all' | 'student' | 'employee'
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    let isMounted = true;
    
    const initializeScanner = async () => {
      if (!isModalOpen || activeTab !== 'qr' || scannerRef.current) return;
      
      try {
        // Check camera permissions first
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop the tracks to release the camera
        stream.getTracks().forEach(track => track.stop());
        
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            qrbox: {
              width: 250,
              height: 250,
            },
            fps: 5,
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
          },
          true // verbose logging for debugging
        );
        
        if (!isMounted) return;
        
        scannerRef.current = scanner;
        
        const onScanSuccess = async (decodedText: string) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setScanResult(decodedText);

        try {
          if (scannerRef.current) {
            scannerRef.current.clear();
            scannerRef.current = null;
          }

          // Parse the QR code data
          let user_id: number;
          let user_type: string;
          
          // Check if the QR code is in the format 'card_123'
          if (decodedText.startsWith('card_')) {
            const cardId = decodedText.split('_')[1];
            if (!cardId) {
              throw new Error('Invalid card ID format');
            }
            
            // Fetch card details from the backend
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/cards/${cardId}`);
            if (!response.ok) {
              throw new Error('Failed to fetch card details');
            }
            
            const cardData = await response.json();
            if (!cardData.userId || !cardData.userType) {
              throw new Error('Invalid card data received');
            }
            
            const qrData = {
              userId: String(cardData.user_id || cardData.userId), // Ensure userId is a string
              userType: cardData.user_type || cardData.userType,
              timestamp: new Date().toISOString()
            };

            if (qrData.userType !== 'student' && qrData.userType !== 'employee') {
              throw new Error('Invalid user type in card data');
            }

            await attendanceService.create({
              user_id: parseInt(qrData.userId, 10),
              user_type: qrData.userType as 'student' | 'employee',
              method: 'qr',
              timestamp: qrData.timestamp,
              status: 'present',
              match_confidence: 1.0,
              synced: 0,
            });

            alert('Attendance logged successfully via QR code!');
            setIsModalOpen(false);
            loadData();
          } else {
            // Try to parse as JSON for backward compatibility
            try {
              const qrData = JSON.parse(decodedText);
              user_id = parseInt(qrData.user_id || qrData.userId, 10);
              user_type = (qrData.user_type || qrData.userType)?.toLowerCase();
            } catch (error) {
              // If parsing as JSON fails, try to extract user ID and type from the string
              const match = decodedText.match(/user[Ii][dD]["']?\s*[:=]\s*([0-9]+).*?user[Tt]ype["']?\s*[:=]\s*["'](student|employee)["']/);
              if (match && match[1] && match[2]) {
                user_id = parseInt(match[1], 10);
                user_type = match[2].toLowerCase();
              } else {
                throw new Error('Invalid QR code format. Could not parse user information.');
              }
            }
            
            // Validate the parsed data
            if (isNaN(user_id) || (user_type !== 'student' && user_type !== 'employee')) {
              throw new Error('Invalid user ID or type in QR code.');
            }

            await attendanceService.create({
              user_id: user_id, // user_id is already parsed as a number above
              user_type: user_type as 'student' | 'employee',
              method: 'qr',
              timestamp: new Date().toISOString(),
              status: 'present',
              match_confidence: 1.0,
              synced: 0,
            });

            alert('Attendance logged successfully via QR code!');
            setIsModalOpen(false);
            loadData();
          }
        } catch (error: any) {
          console.error('Failed to process QR code:', error);
          setScanError(`Failed to process QR code: ${error.message}`);
        } finally {
          setIsSubmitting(false);
        }
      };

      const onScanError = (errorMessage: string) => {
        setScanError(`QR Code scan error: ${errorMessage}`);
      };

        scanner.render(onScanSuccess, onScanError);
        
        const cameraButton = document.querySelector('#html5-qrcode-button-camera-permission');
        if (cameraButton) {
          cameraButton.addEventListener('click', () => {
            setScanError(null);
          });
        }
        
      } catch (error: unknown) {
        console.error('Camera access error:', error);
        if (isMounted) {
          if (error instanceof Error) {
            if (error.name === 'NotAllowedError') {
              setScanError('Camera access was denied. Please allow camera access to scan QR codes.');
            } else if (error.name === 'NotFoundError') {
              setScanError('No camera found. Please connect a camera to scan QR codes.');
            } else {
              setScanError(`Failed to access camera: ${error.message}. Please check your camera settings.`);
            }
          } else {
            setScanError('An unknown error occurred while accessing the camera.');
          }
        }
      }
    };

    initializeScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
        });
        scannerRef.current = null;
      }
    };
  }, [isModalOpen, activeTab]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !manualEntryUserId) return;
    
    setIsSubmitting(true);
    setScanError(null);
    
    try {
      await attendanceService.create({
        user_id: parseInt(manualEntryUserId, 10),
        user_type: manualEntryUserType,
        method: 'manual',
        timestamp: new Date().toISOString(),
        status: 'present',
        match_confidence: 1.0,
        synced: 0,
      });
      
      // Refresh data
      await loadData();
      setScanResult('Attendance logged successfully!');
      
      // Reset form and close modal after a delay
      setTimeout(() => {
        setIsModalOpen(false);
        setScanResult(null);
        setManualEntryUserId('');
      }, 2000);
      
    } catch (error) {
      console.error('Error logging attendance:', error);
      setScanError(error instanceof Error ? error.message : 'Failed to log attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const logs = await attendanceService.getAll(filters);
      setAttendanceLogs(logs);
      
      // Load students and employees for manual entry
      const [studentsData, employeesData] = await Promise.all([
        studentService.getAll(),
        employeeService.getAll()
      ]);
      setStudents(studentsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setScanError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInfo = (log: AttendanceLog) => {
    if (log.user_type === 'student') {
      const student = students.find(s => s.id === log.user_id);
      return student ? { name: student.full_name, identifier: student.student_code, photo: getPhotoUrl(student.photo_path) } : null;
    } else {
      const employee = employees.find(e => e.id === log.user_id);
      return employee ? { name: employee.full_name, identifier: employee.employee_id, photo: getPhotoUrl(employee.photo_path) } : null;
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
        <div className="flex space-x-2">
          <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Log Attendance</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
  <button
    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
    style={{ height: '40px', alignSelf: 'flex-end' }}
    onClick={() => setFilters({ startDate: '', endDate: '', userType: 'all' })}
    type="button"
  >
    Show All
  </button>
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
                              onError={(e) => {
                                e.currentTarget.src = getFallbackImage();
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Log New Attendance</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div>
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    className={`${activeTab === 'qr' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('qr')}
                  >
                    <QrCode className="mr-2 h-5 w-5" /> QR Code Scan
                  </button>
                  <button
                    type="button"
                    className={`${activeTab === 'manual' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('manual')}
                  >
                    <Type className="mr-2 h-5 w-5" /> Manual Entry
                  </button>
                </nav>
              </div>

              {activeTab === 'qr' && (
                <div className="mt-4">
                  <div className="relative">
                    <div id="qr-reader" className="w-full"></div>
                    {scanError && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 font-medium">Error: {scanError}</p>
                        <button
                          onClick={() => {
                            setScanError(null);
                            if (scannerRef.current) {
                              scannerRef.current.clear();
                              scannerRef.current = null;
                            }
                          }}
                          className="mt-2 text-sm text-red-600 hover:underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                    {scanResult && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 font-medium">Scan successful!</p>
                        <p className="text-sm text-gray-600 mt-1">Processing attendance...</p>
                      </div>
                    )}
                    {!scanError && !scanResult && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-blue-700">Position the QR code within the frame to scan</p>
                        <p className="text-sm text-gray-500 mt-1">Make sure the QR code is well-lit and in focus</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="userType" className="block text-sm font-medium text-gray-700">User Type</label>
                      <select
                        id="userType"
                        value={manualEntryUserType}
                        onChange={(e) => {
                          setManualEntryUserType(e.target.value as 'student' | 'employee');
                          setManualEntryUserId(''); // Reset user selection
                        }}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="student">Student</option>
                        <option value="employee">Employee</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="user" className="block text-sm font-medium text-gray-700">Select User</label>
                      <select
                        id="user"
                        value={manualEntryUserId}
                        onChange={(e) => setManualEntryUserId(e.target.value)}
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">-- Select a user --</option>
                        {(manualEntryUserType === 'student' ? students : employees).map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} ({manualEntryUserType === 'student' ? user.student_code : user.employee_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !manualEntryUserId}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                    >
                      {isSubmitting ? 'Submitting...' : 'Log Attendance'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}