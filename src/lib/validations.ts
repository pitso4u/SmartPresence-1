import { z } from 'zod';
import { SystemSettings } from '../services/settingsService';

// Helper function to validate time in HH:MM format
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

// Validation schema for CardDesign
export const cardDesignSchema = z.object({
  primary_color: z.string().min(1, 'Primary color is required'),
  secondary_color: z.string().min(1, 'Secondary color is required'),
  text_color: z.string().min(1, 'Text color is required'),
  header_background: z.string().min(1, 'Header background is required'),
  header_text_color: z.string().min(1, 'Header text color is required'),
  show_qr_code: z.boolean(),
  show_photo: z.boolean(),
  show_id_number: z.boolean(),
  show_slogan: z.boolean(),
  card_width: z.number().min(50, 'Card width must be at least 50mm').max(200, 'Card width cannot exceed 200mm'),
  card_height: z.number().min(50, 'Card height must be at least 50mm').max(200, 'Card height cannot exceed 200mm'),
  font_family: z.string().min(1, 'Font family is required'),
  border_radius: z.number().min(0, 'Border radius cannot be negative').max(50, 'Border radius cannot exceed 50px'),
  border_width: z.number().min(0, 'Border width cannot be negative').max(10, 'Border width cannot exceed 10px'),
  border_color: z.string().min(1, 'Border color is required'),
  shadow: z.string(),
});

// Validation schema for SystemSettings
export const systemSettingsSchema = z.object({
  // School Information
  school_name: z.string().min(1, 'School name is required'),
  school_address: z.string().min(1, 'School address is required'),
  school_logo_url: z.string().url('Invalid URL format').or(z.literal('')),
  school_slogan: z.string(),
  
  // Contact Information
  contact_email: z.string().email('Invalid email address'),
  contact_phone: z.string().min(1, 'Contact phone is required'),
  
  // Attendance Settings
  attendance_start_time: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
  attendance_end_time: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
  late_threshold_minutes: z.number().min(0, 'Cannot be negative').max(240, 'Cannot be more than 4 hours'),
  
  // System Settings
  sync_interval_minutes: z.number().min(1, 'Must be at least 1 minute'),
  max_photo_size_mb: z.number().min(0.1, 'Must be at least 0.1MB'),
  allowed_photo_formats: z.array(z.string()),
  
  // ID Card Design
  card_design: cardDesignSchema,
  
  // Additional Settings
  enable_offline_mode: z.boolean(),
  enable_dark_mode: z.boolean(),
  auto_backup: z.boolean(),
  backup_retention_days: z.number().min(1, 'Must be at least 1 day').max(365, 'Cannot exceed 365 days'),
});

// Type for form errors
export type FormErrors = {
  [key: string]: string | Record<string, string> | undefined;
  card_design?: Record<string, string>;
};

// Validate settings against the schema
export const validateSettings = (settings: SystemSettings) => {
  const result = systemSettingsSchema.safeParse(settings);
  if (!result.success) {
    const errors: FormErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (path.startsWith('card_design.')) {
        const cardField = path.split('.')[1];
        if (!errors.card_design) {
          errors.card_design = {};
        }
        errors.card_design[cardField] = issue.message;
      } else {
        errors[path] = issue.message;
      }
    }
    return { isValid: false, errors };
  }
  return { isValid: true, errors: {} };
};

// Helper function to validate a single field
export const validateField = <T>(schema: z.ZodSchema<T>, field: string, value: any) => {
  const result = schema.safeParse({ [field]: value });
  if (!result.success) {
    const error = result.error.issues.find(e => e.path[0] === field);
    return error ? error.message : '';
  }
  return '';
};
