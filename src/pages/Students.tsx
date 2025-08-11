import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Edit, Trash2, 
  ChevronUp, ChevronDown, 
  Filter, X, RotateCcw, Loader2, Camera, User, ArrowUpDown 
} from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { format, parseISO } from 'date-fns';
import { getPhotoUrl, getFallbackImage } from '../utils/photoUtils';
import  useToast  from '@/hooks/useToast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

// Create a simple Badge component
const Badge = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <span 
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${className}`}
    {...props}
  >
    {children}
  </span>
);

// Photo service mock for development
const photoService = {
  // Simulate taking a photo
  takePhoto: async (studentId: number): Promise<string> => {
    console.log(`Simulating photo capture for student ${studentId}`);
    return new Promise(resolve => {
      setTimeout(() => {
        // Return a mock photo URL
        resolve(`/photos/student-${studentId}-${Date.now()}.jpg`);
      }, 1000);
    });
  },
  
  // Simulate photo upload
  uploadPhoto: async (file: File): Promise<{ filename: string }> => {
    console.log(`Simulating upload of ${file.name}`);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ filename: `uploads/${Date.now()}-${file.name}` });
      }, 1000);
    });
  }
};


type SortDirection = 'asc' | 'desc' | null;

type SortConfig = {
  key: keyof Student | null;
  direction: SortDirection;
};

type FilterState = {
  grade: string;
  classroom: string;
};

type FilterOptions = {
  grades: string[];
  classrooms: string[];
};

export function Students() {
  const { open: showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'full_name',
    direction: 'asc'
  });
  
  const [filters, setFilters] = useState<FilterState>({
    grade: '', 
    classroom: '' 
  });

  const handleFilterChange = (filterKey: keyof FilterState, value: string): void => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    grades: [],
    classrooms: []
  });

  // Load students and filter options
  const loadStudents = async (): Promise<void> => {
    try {
      const [studentsData, grades, classrooms] = await Promise.all([
        studentService.getAll(),
        studentService.getDistinctGrades(),
        studentService.getDistinctClassrooms()
      ]);
      
      setStudents(studentsData);
      setFilterOptions({
        grades: grades || [],
        classrooms: classrooms || []
      });
    } catch (error) {
      console.error('Error loading student data:', error);
      showToast('Failed to load student data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for backward compatibility
  const loadInitialData = loadStudents;

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle sync
  const handleSync = async (): Promise<void> => {
    try {
      setIsSyncing(true);
      await studentService.sync({});
      await loadInitialData();
      showToast('Students synced successfully', 'success');
    } catch (error) {
      console.error('Error syncing students:', error);
      showToast('Failed to sync students', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Apply sorting and filtering
  const filteredStudents = useMemo(() => {
    let result = [...students];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(student => 
        (student.full_name?.toLowerCase().includes(term)) ||
        (student.student_code?.toLowerCase().includes(term)) ||
        (student.id_number?.toLowerCase().includes(term))
      );
    }
    
    // Apply filters
    if (filters.grade) {
      result = result.filter(student => student.grade === filters.grade);
    }
    if (filters.classroom) {
      result = result.filter(student => student.classroom === filters.classroom);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Student];
        const bValue = b[sortConfig.key as keyof Student];
        
        if (aValue === bValue) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        return sortConfig.direction === 'asc' 
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }
    
    return result;
  }, [students, searchTerm, filters, sortConfig]);
  
  // Handle sort request
  const handleRequestSort = (key: keyof Student): void => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  
  // Clear all filters
  const clearFilters = (): void => {
    setSearchTerm('');
    setFilters({ grade: '', classroom: '' });
  };

  const renderSortIndicator = (key: keyof Student): JSX.Element => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4" /> 
      : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      await studentService.delete(id);
      // Optimistic update
      setStudents(prev => prev.filter(s => s.id !== id));
      
      showToast('Student deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting student:', error);
      showToast('Failed to delete student', 'error');
    }
  };

  // Handle taking a photo for a student
  const handleTakePhoto = async (studentId: number) => {
    try {
      const photoUrl = await photoService.takePhoto(studentId);
      // Update the student's photo in the UI
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === studentId 
            ? { ...student, photo_path: photoUrl }
            : student
        )
      );
      showToast('Photo captured successfully', 'success');
      return photoUrl;
    } catch (error) {
      console.error('Error taking photo:', error);
      showToast('Failed to capture photo', 'error');
      throw error;
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage student records and information</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full sm:w-auto"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Sync Students
              </>
            )}
          </Button>
          <Button 
            onClick={() => {
              setEditingStudent(null);
              setShowModal(true);
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, ID, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[180px]">
              <select
                value={filters.grade}
                onChange={(e) => handleFilterChange('grade', e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Grades</option>
                {filterOptions.grades.map(grade => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 opacity-50" />
              </div>
            </div>

            <div className="relative w-full sm:w-[180px]">
              <select
                value={filters.classroom}
                onChange={(e) => handleFilterChange('classroom', e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Classes</option>
                {filterOptions.classrooms.map(classroom => (
                  <option key={classroom} value={classroom}>
                    {classroom}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 opacity-50" />
              </div>
            </div>

            {(filters.grade || filters.classroom || searchTerm) && (
              <Button 
                variant="ghost" 
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {(filters.grade || filters.classroom) && (
          <div className="flex flex-wrap gap-2">
            {filters.grade && (
              <Badge className="px-2 py-1 text-sm">
                Grade: {filters.grade}
                <button 
                  onClick={() => handleFilterChange('grade', '')}
                  className="ml-1.5 rounded-full bg-gray-200 p-0.5 hover:bg-gray-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.classroom && (
              <Badge className="px-2 py-1 text-sm">
                Class: {filters.classroom}
                <button 
                  onClick={() => handleFilterChange('classroom', '')}
                  className="ml-1.5 rounded-full bg-gray-200 p-0.5 hover:bg-gray-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold">Student Records</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Students
              </Button>
              <Button
                onClick={() => {
                  setEditingStudent(null);
                  setShowModal(true);
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRequestSort('full_name')}
                >
                  <div className="flex items-center">
                    Student
                    {renderSortIndicator('full_name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRequestSort('student_code')}
                >
                  <div className="flex items-center">
                    Student Code
                    {renderSortIndicator('student_code')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRequestSort('grade')}
                >
                  <div className="flex items-center">
                    Grade
                    {renderSortIndicator('grade')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRequestSort('classroom')}
                >
                  <div className="flex items-center">
                    Classroom
                    {renderSortIndicator('classroom')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRequestSort('created_at')}
                >
                  <div className="flex items-center">
                    Created
                    {renderSortIndicator('created_at')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="relative">
                        <img
                          src={getPhotoUrl(student.photo_path)}
                          alt={student.full_name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getFallbackImage();
                          }}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        {!student.photo_path && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {student.id_number}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.student_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.classroom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.created_at ? format(parseISO(student.created_at), 'MMM dd, yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingStudent(student);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="Delete student"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTakePhoto(student.id)}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50"
                        title="Take Photo"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Take Photo</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No students found</p>
            </div>
          )}
        </div>
      </div>

      {/* Student Modal would go here */}
      {showModal && (
        <StudentModal
          student={editingStudent}
          onClose={() => setShowModal(false)}
          onSave={loadStudents}
        />
      )}
    </div>
  );
}

// Simple modal component for student form
function StudentModal({ student, onClose, onSave }: {
  student: Student | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    full_name: student?.full_name || '',
    student_code: student?.student_code || '',
    id_number: student?.id_number || '',
    grade: student?.grade || '',
    classroom: student?.classroom || '',
    photo_path: student?.photo_path || ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let photoPath = formData.photo_path;
      
      // In a real app, you would upload the photo here
      // For now, we'll just use the preview URL if available
      if (previewUrl) {
        photoPath = previewUrl;
      }
      
      const studentData = {
        ...formData,
        photo_path: photoPath
      };
      
      if (student) {
        await studentService.update(student.id, studentData);
      } else {
        await studentService.create({
          ...studentData,
          client_uuid: `std-${Date.now()}`,
          synced: 0
        });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {student ? 'Edit Student' : 'Add New Student'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="text"
            placeholder="Student Code"
            value={formData.student_code}
            onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="text"
            placeholder="ID Number"
            value={formData.id_number}
            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="text"
            placeholder="Grade"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="text"
            placeholder="Classroom"
            value={formData.classroom}
            onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          {/* Photo Upload Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Photo</label>
            
            {/* Photo Preview */}
            {(previewUrl || formData.photo_path) && (
              <div className="relative inline-block">
                <img
                  src={previewUrl || getPhotoUrl(formData.photo_path)}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover border border-gray-300"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImage();
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setFormData({ ...formData, photo_path: '' });
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {/* File Input */}
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 flex items-center space-x-2 transition-colors">
                <Camera className="h-4 w-4" />
                <span>{selectedFile ? selectedFile.name : 'Choose Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <span className="text-sm text-gray-500">
                  {selectedFile.name}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Saving...' : (student ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}