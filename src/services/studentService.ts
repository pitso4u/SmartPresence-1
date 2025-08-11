import { Student } from '../types';
import apiClient from '../config/api';

export const studentService = {
  // Get all students
  async getAll(): Promise<Student[]> {
    try {
      const response = await apiClient.get<Student[]>('/students');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch students:', error);
      throw error;
    }
  },

  // Get student by ID
  async getById(id: number): Promise<Student | null> {
    try {
      const response = await apiClient.get<Student>(`/students/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch student ${id}:`, error);
      throw error;
    }
  },

  // Get student by code
  async getByCode(code: string): Promise<Student | null> {
    try {
      const response = await apiClient.get<Student>(`/students/code/${code}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch student by code ${code}:`, error);
      throw error;
    }
  },

  // Create new student
  async create(studentData: Omit<Student, 'id' | 'created_at'>): Promise<Student> {
    try {
      const response = await apiClient.post<Student>('/students', studentData);
      return response.data!;
    } catch (error) {
      console.error('Failed to create student:', error);
      throw error;
    }
  },

  // Update student
  async update(id: number, studentData: Partial<Student>): Promise<Student | null> {
    try {
      const response = await apiClient.put<Student>(`/students/${id}`, studentData);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to update student ${id}:`, error);
      throw error;
    }
  },

  // Delete student
  async delete(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/students/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete student ${id}:`, error);
      throw error;
    }
  },

  // Sync students
  async sync(syncData: any): Promise<any> {
    try {
      const response = await apiClient.post('/students/sync', syncData);
      return response.data;
    } catch (error) {
      console.error('Failed to sync students:', error);
      throw error;
    }
  },

  // Get distinct grades
  async getDistinctGrades(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/students/distinct/grades');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch distinct grades:', error);
      throw error;
    }
  },

  // Get distinct classrooms
  async getDistinctClassrooms(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/students/distinct/classrooms');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch distinct classrooms:', error);
      throw error;
    }
  }
};