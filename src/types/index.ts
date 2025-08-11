export interface Student {
  id: number;
  client_uuid: string;
  full_name: string;
  student_code: string;
  id_number: string;
  grade: string;
  classroom: string;
  photo_path: string;
  created_at: string;
  synced: number;
}

export interface Employee {
  id: number;
  client_uuid: string;
  full_name: string;
  employee_id: string;
  id_number: string;
  job_title: string;
  department: string;
  photo_path: string;
  created_at: string;
  synced: number;
  role: string;
  contact_number: string;
  email: string;
}

export interface Visitor {
  id: number;
  full_name: string;
  id_number: string;
  purpose: string;
  host: string;
  photo_path: string;
  entry_time: string;
  exit_time: string | null;
  synced: number;
  phone_number: string;
  email: string;
}

export interface AttendanceLog {
  id: number;
  user_id: number;
  user_type: 'student' | 'employee';
  timestamp: string;
  status: 'present' | 'late' | 'absent';
  method: 'manual' | 'qr' | 'facial';
  match_confidence: number;
  synced: number;
}

export interface Incident {
  id: number;
  user_id: number | null;
  user_type: 'student' | 'employee' | null;
  description: string;
  incident_type: string;
  reporter_name: string;
  reported_at: string;
  synced: number;
}

export interface Card {
  id: number;
  user_id: number;
  user_type: 'student' | 'employee';
  card_image_path: string;
  qr_code_path?: string;
  qr_code_url?: string;
  generated_at: string;
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  full_name: string;
  email: string;
  token?: string; // Add optional token property
}