import { Card } from '../types';
import { mockCards } from './mockData';

let cards = [...mockCards];

export const cardService = {
  async getAll(): Promise<Card[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return cards;
  },

  async getByUserId(userId: number, userType: 'student' | 'employee'): Promise<Card | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return cards.find(c => c.user_id === userId && c.user_type === userType) || null;
  }
};