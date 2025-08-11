import apiClient from '../config/api';

export interface CardDesign {
  primary_color: string;
  secondary_color: string;
  text_color: string;
  header_background: string;
  header_text_color: string;
  show_qr_code: boolean;
  show_photo: boolean;
  show_id_number: boolean;
  show_slogan: boolean;
  card_width: number; // in mm
  card_height: number; // in mm
  font_family: string;
  border_radius: number; // in pixels
  border_width: number; // in pixels
  border_color: string;
  shadow: string;
}

export interface SystemSettings {
  // School Information
  school_name: string;
  school_address: string;
  school_logo_url?: string;
  school_slogan: string;
  
  // Contact Information
  contact_email: string;
  contact_phone: string;
  
  // Attendance Settings
  attendance_start_time: string;
  attendance_end_time: string;
  late_threshold_minutes: number;
  
  // System Settings
  sync_interval_minutes: number;
  max_photo_size_mb: number;
  allowed_photo_formats: string[];
  
  // ID Card Design
  card_design: CardDesign;
  
  // Additional Settings
  enable_offline_mode: boolean;
  enable_dark_mode: boolean;
  auto_backup: boolean;
  backup_retention_days: number;
}

export const settingsService = {
  // Get all settings
  async getAll(): Promise<SystemSettings> {
    try {
      const response = await apiClient.get<SystemSettings>('/settings');
      return response.data!;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw error;
    }
  },

  // Get setting by key
  async getByKey(key: string): Promise<any> {
    try {
      const response = await apiClient.get(`/settings/${key}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch setting ${key}:`, error);
      throw error;
    }
  },

  // Update settings
  async update(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      const response = await apiClient.put<SystemSettings>('/settings', settings);
      return response.data!;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  // Update specific setting
  async updateSetting(key: string, value: any): Promise<any> {
    try {
      const response = await apiClient.put(`/settings/${key}`, { value });
      return response.data;
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
      throw error;
    }
  },

  // Reset settings to defaults
  async resetToDefaults(): Promise<SystemSettings> {
    try {
      const response = await apiClient.post<SystemSettings>('/settings/reset', {});
      return response.data!;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  },

  // Export settings
  async export(): Promise<any> {
    try {
      const response = await apiClient.get('/settings/export');
      return response.data;
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  },

  // Import settings
  async import(settingsData: any): Promise<SystemSettings> {
    try {
      const response = await apiClient.post<SystemSettings>('/settings/import', settingsData);
      return response.data!;
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }
}; 