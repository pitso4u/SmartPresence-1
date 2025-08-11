import { Card } from '../types';
import apiClient from '../config/api';

export const cardService = {
  // Get all cards
  async getAll(): Promise<Card[]> {
    try {
      const response = await apiClient.get<Card[]>('/cards');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      throw error;
    }
  },

  // Get card by ID
  async getById(id: number): Promise<Card | null> {
    try {
      const response = await apiClient.get<Card>(`/cards/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch card ${id}:`, error);
      throw error;
    }
  },

  // Get cards by user
  async getByUser(userId: number, userType: 'student' | 'employee'): Promise<Card[]> {
    try {
      const response = await apiClient.get<Card[]>(`/cards/user/${userId}?userType=${userType}`);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to fetch cards for user ${userId}:`, error);
      throw error;
    }
  },

  // Generate new card (deprecated, use generateAll instead)
  async generate(userId: number, userType: 'student' | 'employee'): Promise<Card> {
    try {
      const response = await apiClient.post<Card>('/cards', {
        user_id: userId,
        user_type: userType
      });
      return response.data!;
    } catch (error) {
      console.error('Failed to generate card:', error);
      throw error;
    }
  },

  // Generate cards for all users (students and employees)
  async generateAll(): Promise<{ generated: number; totalStudents: number; totalEmployees: number; cards: Card[] }> {
    try {
      const response = await apiClient.post<{
        status: string;
        data: {
          generated: number;
          totalStudents: number;
          totalEmployees: number;
          cards: Card[];
        };
      }>('/cards/generate-all', {});
      
      if (!response.data?.data) {
        throw new Error('Invalid response format from server');
      }
      
      // Deduplicate cards in the response
      const uniqueCards = [];
      const seen = new Set();
      
      for (const card of response.data.data.cards) {
        const key = `${card.user_type}_${card.user_id}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCards.push(card);
        }
      }
      
      return {
        ...response.data.data,
        cards: uniqueCards,
        generated: uniqueCards.length
      };
    } catch (error) {
      console.error('Failed to generate cards for all users:', error);
      throw error;
    }
  },

  // Delete card
  async delete(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/cards/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete card ${id}:`, error);
      throw error;
    }
  }
};