import { Student, Employee, Visitor, AttendanceLog, Incident, Card, User } from '../types';

export const mockStudents: Student[] = [
  {
    id: 1,
    client_uuid: 'std-001',
    full_name: 'Alice Johnson',
    student_code: 'STD001',
    id_number: '123456789',
    grade: '10th Grade',
    classroom: 'Room 101',
    photo_path: 'https://images.pexels.com/photos/3768911/pexels-photo-3768911.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2024-01-15T08:00:00Z',
    synced: 1
  },
  {
    id: 2,
    client_uuid: 'std-002',
    full_name: 'Bob Smith',
    student_code: 'STD002',
    id_number: '987654321',
    grade: '11th Grade',
    classroom: 'Room 102',
    photo_path: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2024-01-16T08:00:00Z',
    synced: 1
  },
  {
    id: 3,
    client_uuid: 'std-003',
    full_name: 'Carol Davis',
    student_code: 'STD003',
    id_number: '456123789',
    grade: '9th Grade',
    classroom: 'Room 103',
    photo_path: 'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2024-01-17T08:00:00Z',
    synced: 1
  }
];

export const mockEmployees: Employee[] = [
  {
    id: 1,
    client_uuid: 'emp-001',
    full_name: 'Dr. Sarah Wilson',
    employee_id: 'EMP001',
    id_number: 'ID123456',
    job_title: 'Mathematics Teacher',
    department: 'Mathematics',
    photo_path: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2024-01-01T08:00:00Z',
    synced: 1,
    role: 'TEACHER',
    contact_number: '+1-555-0101',
    email: 'sarah.wilson@school.edu'
  },
  {
    id: 2,
    client_uuid: 'emp-002',
    full_name: 'Mike Johnson',
    employee_id: 'EMP002',
    id_number: 'ID789012',
    job_title: 'Principal',
    department: 'Administration',
    photo_path: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2024-01-01T08:00:00Z',
    synced: 1,
    role: 'ADMIN',
    contact_number: '+1-555-0102',
    email: 'mike.johnson@school.edu'
  }
];

export const mockVisitors: Visitor[] = [
  {
    id: 1,
    full_name: 'Jennifer Brown',
    id_number: 'VIS123456',
    purpose: 'Parent Meeting',
    host: 'Dr. Sarah Wilson',
    photo_path: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    entry_time: '2024-01-20T10:00:00Z',
    exit_time: null,
    synced: 1,
    phone_number: '+1-555-0201',
    email: 'jennifer.brown@email.com'
  },
  {
    id: 2,
    full_name: 'David Clark',
    id_number: 'VIS789012',
    purpose: 'Maintenance Inspection',
    host: 'Mike Johnson',
    photo_path: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    entry_time: '2024-01-19T14:00:00Z',
    exit_time: '2024-01-19T16:30:00Z',
    synced: 1,
    phone_number: '+1-555-0202',
    email: 'david.clark@maintenance.com'
  }
];

export const mockAttendanceLogs: AttendanceLog[] = [
  {
    id: 1,
    user_id: 1,
    user_type: 'student',
    timestamp: '2024-01-20T08:15:00Z',
    match_confidence: 0.95,
    synced: 1
  },
  {
    id: 2,
    user_id: 2,
    user_type: 'student',
    timestamp: '2024-01-20T08:20:00Z',
    match_confidence: 0.92,
    synced: 1
  },
  {
    id: 3,
    user_id: 1,
    user_type: 'employee',
    timestamp: '2024-01-20T07:45:00Z',
    match_confidence: 0.98,
    synced: 1
  }
];

export const mockIncidents: Incident[] = [
  {
    id: 1,
    user_id: 1,
    user_type: 'student',
    description: 'Late arrival to class without excuse',
    incident_type: 'Tardiness',
    reporter_name: 'Dr. Sarah Wilson',
    reported_at: '2024-01-19T10:30:00Z',
    synced: 1
  },
  {
    id: 2,
    user_id: null,
    user_type: null,
    description: 'Unauthorized visitor in building',
    incident_type: 'Security',
    reporter_name: 'Security Guard',
    reported_at: '2024-01-18T15:45:00Z',
    synced: 1
  }
];

export const mockCards: Card[] = [
  {
    id: 1,
    user_id: 1,
    user_type: 'student',
    card_image_path: 'https://images.pexels.com/photos/3768911/pexels-photo-3768911.jpeg?auto=compress&cs=tinysrgb&w=300',
    generated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: 2,
    user_id: 1,
    user_type: 'employee',
    card_image_path: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
    generated_at: '2024-01-01T09:00:00Z'
  }
];

export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    full_name: 'System Administrator',
    email: 'admin@school.edu',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    username: 'teacher',
    password: 'teacher123',
    role: 'user',
    full_name: 'Teacher User',
    email: 'teacher@school.edu',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];