import { Visitor } from '../types';
import { mockVisitors } from './mockData';

let visitors = [...mockVisitors];
let nextId = Math.max(...visitors.map(v => v.id)) + 1;

export const visitorService = {
  async getAll(): Promise<Visitor[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return visitors;
  },

  async getById(id: number): Promise<Visitor | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return visitors.find(v => v.id === id) || null;
  },

  async create(visitorData: Omit<Visitor, 'id' | 'entry_time'>): Promise<Visitor> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newVisitor: Visitor = {
      ...visitorData,
      id: nextId++,
      entry_time: new Date().toISOString()
    };
    visitors.push(newVisitor);
    return newVisitor;
  },

  async update(id: number, visitorData: Partial<Visitor>): Promise<Visitor | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = visitors.findIndex(v => v.id === id);
    if (index === -1) return null;
    
    visitors[index] = { ...visitors[index], ...visitorData };
    return visitors[index];
  },

  async delete(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = visitors.findIndex(v => v.id === id);
    if (index === -1) return false;
    
    visitors.splice(index, 1);
    return true;
  },

  async checkOut(id: number): Promise<Visitor | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = visitors.findIndex(v => v.id === id);
    if (index === -1) return null;
    
    visitors[index].exit_time = new Date().toISOString();
    return visitors[index];
  }
};