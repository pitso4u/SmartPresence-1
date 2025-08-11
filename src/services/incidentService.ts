import { Incident } from '../types';
import apiClient from '../config/api';

export const incidentService = {
  // Get all incidents
  async getAll(): Promise<Incident[]> {
    try {
      const response = await apiClient.get<Incident[]>('/incidents');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      throw error;
    }
  },

  // Get incident by ID
  async getById(id: number): Promise<Incident | null> {
    try {
      const response = await apiClient.get<Incident>(`/incidents/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch incident ${id}:`, error);
      throw error;
    }
  },

  // Create new incident
  async create(incidentData: Omit<Incident, 'id' | 'reported_at'>): Promise<Incident> {
    try {
      const response = await apiClient.post<Incident>('/incidents', incidentData);
      return response.data!;
    } catch (error) {
      console.error('Failed to create incident:', error);
      throw error;
    }
  },

  // Update incident
  async update(id: number, incidentData: Partial<Incident>): Promise<Incident | null> {
    try {
      const response = await apiClient.put<Incident>(`/incidents/${id}`, incidentData);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to update incident ${id}:`, error);
      throw error;
    }
  },

  // Delete incident
  async delete(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/incidents/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete incident ${id}:`, error);
      throw error;
    }
  },

  // Get incidents by user
  async getByUser(userId: number, userType: 'student' | 'employee'): Promise<Incident[]> {
    try {
      const response = await apiClient.get<Incident[]>(`/incidents/user/${userId}?userType=${userType}`);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to fetch incidents for user ${userId}:`, error);
      throw error;
    }
  },

  // Get incidents by date range
  async getByDateRange(startDate: string, endDate: string): Promise<Incident[]> {
    try {
      const response = await apiClient.get<Incident[]>(`/incidents/date-range?start=${startDate}&end=${endDate}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch incidents by date range:', error);
      throw error;
    }
  },

  // Get incidents by type
  async getByType(incidentType: string): Promise<Incident[]> {
    try {
      const response = await apiClient.get<Incident[]>(`/incidents/type/${incidentType}`);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to fetch incidents by type ${incidentType}:`, error);
      throw error;
    }
  },

  // Sync incidents
  async sync(syncData: any): Promise<any> {
    try {
      const response = await apiClient.post('/incidents/sync', syncData);
      return response.data;
    } catch (error) {
      console.error('Failed to sync incidents:', error);
      throw error;
    }
  }
};