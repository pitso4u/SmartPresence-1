import { Employee } from '../types';
import { mockEmployees } from './mockData';

let employees = [...mockEmployees];
let nextId = Math.max(...employees.map(e => e.id)) + 1;

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return employees;
  },

  async getById(id: number): Promise<Employee | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return employees.find(e => e.id === id) || null;
  },

  async create(employeeData: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newEmployee: Employee = {
      ...employeeData,
      id: nextId++,
      created_at: new Date().toISOString()
    };
    employees.push(newEmployee);
    return newEmployee;
  },

  async update(id: number, employeeData: Partial<Employee>): Promise<Employee | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    employees[index] = { ...employees[index], ...employeeData };
    return employees[index];
  },

  async delete(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    employees.splice(index, 1);
    return true;
  }
};