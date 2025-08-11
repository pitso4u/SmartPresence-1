import { Employee } from '../types';
import apiClient from '../config/api';

export const employeeService = {
  // Get all employees
  async getAll(): Promise<Employee[]> {
    try {
      const response = await apiClient.get<Employee[]>('/employees');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw error;
    }
  },

  // Get employee by ID
  async getById(id: number): Promise<Employee | null> {
    try {
      const response = await apiClient.get<Employee>(`/employees/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch employee ${id}:`, error);
      throw error;
    }
  },

  // Get employee by employee ID
  async getByEmployeeId(employeeId: string): Promise<Employee | null> {
    try {
      const response = await apiClient.get<Employee>(`/employees/employee-id/${employeeId}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch employee by employee ID ${employeeId}:`, error);
      throw error;
    }
  },

  // Create new employee
  async create(employeeData: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
    try {
      const response = await apiClient.post<Employee>('/employees', employeeData);
      return response.data!;
    } catch (error) {
      console.error('Failed to create employee:', error);
      throw error;
    }
  },

  // Update employee
  async update(id: number, employeeData: Partial<Employee>): Promise<Employee | null> {
    try {
      const response = await apiClient.put<Employee>(`/employees/${id}`, employeeData);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to update employee ${id}:`, error);
      throw error;
    }
  },

  // Delete employee
  async delete(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/employees/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete employee ${id}:`, error);
      throw error;
    }
  },

  // Sync employees
  async sync(syncData: any): Promise<any> {
    try {
      const response = await apiClient.post('/employees/sync', syncData);
      return response.data;
    } catch (error) {
      console.error('Failed to sync employees:', error);
      throw error;
    }
  },

  // Get distinct departments
  async getDistinctDepartments(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/employees/distinct/departments');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch distinct departments:', error);
      throw error;
    }
  },

  // Get distinct job titles
  async getDistinctJobTitles(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/employees/distinct/job-titles');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch distinct job titles:', error);
      throw error;
    }
  }
};