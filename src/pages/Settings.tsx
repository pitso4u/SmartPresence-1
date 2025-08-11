import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Undo2 } from 'lucide-react';
import useToast from '@/hooks/useToast';
import { settingsService, type SystemSettings as SystemSettingsType } from '@/services/settingsService';
import { systemSettingsSchema } from '@/lib/validations';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { CardSettings } from '@/components/settings/CardSettings';
import { AttendanceSettings } from '@/components/settings/AttendanceSettings';
import { SystemSettingsComponent } from '@/components/settings/SystemSettings';
import { TooltipProvider } from '@/components/ui/tooltip';

// Types for form errors
type FormErrors = Record<string, string>;

// Default card design values
const defaultCardDesign = {
  primary_color: '#3b82f6',
  secondary_color: '#f3f4f6',
  text_color: '#1f2937',
  header_background: '#1e40af',
  header_text_color: '#ffffff',
  show_qr_code: true,
  show_photo: true,
  show_id_number: true,
  show_slogan: true,
  card_width: 85.6,
  card_height: 54,
  font_family: 'Arial, sans-serif',
  border_radius: 8,
  border_width: 1,
  border_color: '#d1d5db',
  shadow: '0 2px 4px rgba(0,0,0,0.1)'
};

export function Settings() {
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { open: showToast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setErrors({});
      setTouched({});
      
      const serverData = await settingsService.getAll();
      
      // Create settings object with defaults first
      const defaultSettings: Omit<SystemSettingsType, 'card_design'> & { card_design?: Partial<SystemSettingsType['card_design']> } = {
        school_name: '',
        school_address: '',
        school_logo_url: '',
        school_slogan: '',
        contact_email: '',
        contact_phone: '',
        attendance_start_time: '08:00',
        attendance_end_time: '16:00',
        late_threshold_minutes: 15,
        sync_interval_minutes: 15,
        max_photo_size_mb: 5,
        allowed_photo_formats: ['image/jpeg', 'image/png'],
        enable_offline_mode: false,
        enable_dark_mode: false,
        auto_backup: true,
        backup_retention_days: 30,
        card_design: { ...defaultCardDesign }
      };

      // Merge server data with defaults, with server data taking precedence
      const settings: SystemSettingsType = {
        ...defaultSettings,
        ...serverData,
        card_design: {
          ...defaultCardDesign,
          ...(serverData.card_design || {})
        }
      };
      
      // Convert string numbers to numbers for numeric fields if needed
      if (settings.card_design) {
        const cardDesign = { ...settings.card_design };
        
        if (typeof cardDesign.card_width === 'string') {
          cardDesign.card_width = parseFloat(cardDesign.card_width) || defaultCardDesign.card_width;
        }
        if (typeof cardDesign.card_height === 'string') {
          cardDesign.card_height = parseFloat(cardDesign.card_height) || defaultCardDesign.card_height;
        }
        if (typeof cardDesign.border_radius === 'string') {
          cardDesign.border_radius = parseFloat(cardDesign.border_radius) || defaultCardDesign.border_radius;
        }
        if (typeof cardDesign.border_width === 'string') {
          cardDesign.border_width = parseFloat(cardDesign.border_width) || defaultCardDesign.border_width;
        }
        
        // Update settings with parsed card design
        settings.card_design = cardDesign;
      }
      
      // Update state with merged and parsed settings
      setSettings(settings);
      
      // Validate the loaded settings against our schema
      const validation = systemSettingsSchema.safeParse(settings);
      if (!validation.success) {
        const validationErrors = validation.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const path = issue.path.join('.');
          acc[path] = issue.message;
          return acc;
        }, {});
        
        console.warn('Loaded settings contain validation errors:', validationErrors);
        setErrors(validationErrors);
        
        // Use the showToast function from useToast hook
        showToast('Settings loaded with warnings. Some settings contain invalid values. Please review and save to fix them.', 'warning');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      
      let errorMessage = 'Failed to load settings. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      showToast(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = <K extends keyof SystemSettingsType>(
    field: K,
    value: SystemSettingsType[K]
  ) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [field]: value
    }));
    
    // Clear error when field is edited
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  // Handle card design changes from the CardSettings component
  const handleCardDesignChange = (field: string, value: any) => {
    if (!settings) return;
    
    // The field should already be in the format 'card_design.fieldName'
    const fullFieldPath = field.startsWith('card_design.') ? field : `card_design.${field}`;
    const fieldName = fullFieldPath.replace('card_design.', '') as keyof SystemSettingsType['card_design'];
    
    setSettings(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        card_design: {
          ...prev.card_design,
          [fieldName]: value
        }
      };
    });
    
    // Clear error when field is edited
    if (errors[fullFieldPath]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fullFieldPath];
        return newErrors;
      });
    }
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [fullFieldPath]: true
    }));
  };

  // Wrapper functions to handle type-unsafe input changes from child components
  const handleGeneralInputChange = (field: string, value: any) => {
    if (!settings) {
      console.error('Settings not loaded yet');
      return;
    }
    
    // This is a type-unsafe fallback for components that expect string field names
    if (field in settings) {
      handleInputChange(field as keyof SystemSettingsType, value);
    } else if (field.startsWith('card_design.')) {
      const cardField = field.replace('card_design.', '') as keyof SystemSettingsType['card_design'];
      handleCardDesignChange(cardField, value);
    } else {
      console.warn(`Field '${field}' not found in settings`);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      
      // Validate before saving
      const validation = systemSettingsSchema.safeParse(settings);
      if (!validation.success) {
        const validationErrors = validation.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const path = issue.path.join('.');
          acc[path] = issue.message;
          return acc;
        }, {});
        
        setErrors(validationErrors);
        
        // Mark all fields with errors as touched
        const touchedFields = Object.keys(validationErrors).reduce<Record<string, boolean>>((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        
        setTouched(prev => ({
          ...prev,
          ...touchedFields
        }));
        
        showToast('Please fix the errors in the form before saving.', 'error');
        return;
      }
      
      // Save the settings
      await settingsService.update(settings);
      
      showToast('Settings saved successfully.', 'success');
      
      // Reload settings to ensure we have the latest from the server
      loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to their default values? This cannot be undone.')) {
      loadSettings();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Unable to load settings</h2>
        <p className="text-muted-foreground mb-4">There was a problem loading the settings. Please try again.</p>
        <Button onClick={loadSettings}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your application settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isSaving}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings
            settings={settings}
            errors={errors}
            onInputChange={handleGeneralInputChange}
            onBlur={handleBlur}
            touched={touched}
          />
        </TabsContent>
        
        <TabsContent value="appearance">
          <CardSettings
            cardDesign={settings?.card_design || defaultCardDesign}
            errors={errors}
            onInputChange={handleCardDesignChange}
            onBlur={handleBlur}
            touched={touched}
          />
        </TabsContent>
        
        <TabsContent value="attendance">
          <AttendanceSettings
            settings={settings}
            errors={errors}
            onInputChange={handleGeneralInputChange}
            onBlur={handleBlur}
            touched={touched}
          />
        </TabsContent>
        
        <TabsContent value="system">
          <SystemSettingsComponent
            settings={settings || {
              school_name: '',
              school_address: '',
              school_logo_url: '',
              school_slogan: '',
              contact_email: '',
              contact_phone: '',
              enable_attendance: false,
              late_threshold_minutes: 15,
              absence_threshold_minutes: 60,
              enable_late_attendance: true,
              enable_absence_tracking: true,
              card_design: defaultCardDesign
            }}
            errors={errors}
            onInputChange={handleGeneralInputChange}
            onBlur={handleBlur}
            touched={touched}
          />
        </TabsContent>
      </Tabs>
      </div>
    </TooltipProvider>
  );
}
