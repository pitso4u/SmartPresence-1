import { Incident } from '../types';
import { mockIncidents } from './mockData';

let incidents = [...mockIncidents];
let nextId = Math.max(...incidents.map(i => i.id)) + 1;

export const incidentService = {
  async getAll(): Promise<Incident[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return incidents.sort((a, b) => 
      new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
    );
  },

  async getById(id: number): Promise<Incident | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return incidents.find(i => i.id === id) || null;
  },

  async create(incidentData: Omit<Incident, 'id' | 'reported_at'>): Promise<Incident> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newIncident: Incident = {
      ...incidentData,
      id: nextId++,
      reported_at: new Date().toISOString()
    };
    incidents.push(newIncident);
    return newIncident;
  },

  async update(id: number, incidentData: Partial<Incident>): Promise<Incident | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = incidents.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    incidents[index] = { ...incidents[index], ...incidentData };
    return incidents[index];
  },

  async delete(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = incidents.findIndex(i => i.id === id);
    if (index === -1) return false;
    
    incidents.splice(index, 1);
    return true;
  }
};