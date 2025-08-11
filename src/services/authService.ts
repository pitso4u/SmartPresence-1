import { User, AuthUser } from '../types';
import apiClient from '../config/api';

export const authService = {
  // Login user
  async login(username: string, password: string): Promise<AuthUser> {
    try {
      const response = await apiClient.post<AuthUser>('/users/login', {
        username,
        password
      });
      return response.data!;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Register user
  async register(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<AuthUser> {
    try {
      const response = await apiClient.post<AuthUser>('/users/register', userData);
      return response.data!;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await apiClient.get<AuthUser>('/users/me');
      return response.data || null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(userId: number, userData: Partial<User>): Promise<AuthUser | null> {
    try {
      const response = await apiClient.put<AuthUser>(`/users/${userId}`, userData);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to update user ${userId}:`, error);
      throw error;
    }
  },

  // Change password
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      await apiClient.put(`/users/${userId}/password`, {
        currentPassword,
        newPassword
      });
      return true;
    } catch (error) {
      console.error(`Failed to change password for user ${userId}:`, error);
      throw error;
    }
  },

  // Logout
  async logout(): Promise<boolean> {
    try {
      await apiClient.post('/users/logout', {});
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  // Delete user (admin only)
  async deleteUser(userId: number): Promise<boolean> {
    try {
      await apiClient.delete(`/users/${userId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete user ${userId}:`, error);
      throw error;
    }
  }
};