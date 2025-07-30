import { Student } from '../types';
import { mockStudents } from './mockData';

let students = [...mockStudents];
let nextId = Math.max(...students.map(s => s.id)) + 1;

export const studentService = {
  async getAll(): Promise<Student[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return students;
  },

  async getById(id: number): Promise<Student | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return students.find(s => s.id === id) || null;
  },

  async create(studentData: Omit<Student, 'id' | 'created_at'>): Promise<Student> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newStudent: Student = {
      ...studentData,
      id: nextId++,
      created_at: new Date().toISOString()
    };
    students.push(newStudent);
    return newStudent;
  },

  async update(id: number, studentData: Partial<Student>): Promise<Student | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    students[index] = { ...students[index], ...studentData };
    return students[index];
  },

  async delete(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    students.splice(index, 1);
    return true;
  }
};