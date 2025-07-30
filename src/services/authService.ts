import { AuthUser } from '../types';
import { mockUsers } from './mockData';

let currentUser: AuthUser | null = null;

export const authService = {
  async login(username: string, password: string): Promise<AuthUser | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = mockUsers.find(u => u.username === username && u.password === password);
    if (user) {
      currentUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email
      };
      localStorage.setItem('smartpresence_user', JSON.stringify(currentUser));
      return currentUser;
    }
    return null;
  },

  async logout(): Promise<void> {
    currentUser = null;
    localStorage.removeItem('smartpresence_user');
  },

  getCurrentUser(): AuthUser | null {
    if (currentUser) return currentUser;
    
    const stored = localStorage.getItem('smartpresence_user');
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
    return null;
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
};