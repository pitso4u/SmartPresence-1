import { Visitor } from '../types';
import apiClient from '../config/api';

export const visitorService = {
  // Get all visitors
  async getAll(): Promise<Visitor[]> {
    try {
      const response = await apiClient.get<Visitor[]>('/visitors');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
      throw error;
    }
  },

  // Get visitor by ID
  async getById(id: number): Promise<Visitor | null> {
    try {
      const response = await apiClient.get<Visitor>(`/visitors/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch visitor ${id}:`, error);
      throw error;
    }
  },

  // Get visitor by ID number
  async getByIdNumber(idNumber: string): Promise<Visitor | null> {
    try {
      const response = await apiClient.get<Visitor>(`/visitors/id-number/${idNumber}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch visitor by ID number ${idNumber}:`, error);
      throw error;
    }
  },

  // Create new visitor
  async create(visitorData: Omit<Visitor, 'id'>): Promise<Visitor> {
    try {
      const response = await apiClient.post<Visitor>('/visitors', visitorData);
      return response.data!;
    } catch (error) {
      console.error('Failed to create visitor:', error);
      throw error;
    }
  },

  // Update visitor
  async update(id: number, visitorData: Partial<Visitor>): Promise<Visitor | null> {
    try {
      const response = await apiClient.put<Visitor>(`/visitors/${id}`, visitorData);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to update visitor ${id}:`, error);
      throw error;
    }
  },

  // Delete visitor
  async delete(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/visitors/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete visitor ${id}:`, error);
      throw error;
    }
  },

  // Check out visitor (set exit time)
  async checkOut(id: number): Promise<Visitor | null> {
    try {
      const response = await apiClient.put<Visitor>(`/visitors/${id}/checkout`, {
        exit_time: new Date().toISOString()
      });
      return response.data || null;
    } catch (error) {
      console.error(`Failed to check out visitor ${id}:`, error);
      throw error;
    }
  },

  // Get active visitors (no exit time)
  async getActive(): Promise<Visitor[]> {
    try {
      const response = await apiClient.get<Visitor[]>('/visitors/active');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch active visitors:', error);
      throw error;
    }
  },

  // Get visitors by date range
  async getByDateRange(startDate: string, endDate: string): Promise<Visitor[]> {
    try {
      const response = await apiClient.get<Visitor[]>(`/visitors/date-range?start=${startDate}&end=${endDate}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch visitors by date range:', error);
      throw error;
    }
  },

  // Sync visitors
  async sync(syncData: any): Promise<any> {
    try {
      const response = await apiClient.post('/visitors/sync', syncData);
      return response.data;
    } catch (error) {
      console.error('Failed to sync visitors:', error);
      throw error;
    }
  }
};