import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SystemSettings } from "@/services/settingsService";

interface SystemSettingsProps {
  settings: SystemSettings;
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  touched: Record<string, boolean>;
}

export function SystemSettingsComponent({
  settings,
  errors,
  onInputChange,
  onBlur,
  touched
}: SystemSettingsProps) {
  const renderSwitch = (name: string, label: string, description: string) => {
    const isChecked = settings?.[name as keyof SystemSettings] as boolean;
    const error = errors[name];
    const isTouched = touched[name];

    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center">
            <Label htmlFor={name} className="text-sm font-medium">
              {label}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{description}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {isTouched && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <Switch
          id={name}
          checked={isChecked}
          onCheckedChange={(checked) => onInputChange(name, checked)}
          onBlur={() => onBlur(name)}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        />
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">System Settings</CardTitle>
        <CardDescription className="text-sm">
          Configure system-wide preferences and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Application Settings</h3>
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            {renderSwitch(
              'enable_dark_mode',
              'Enable Dark Mode',
              'Switch between light and dark theme'
            )}
            
            {renderSwitch(
              'enable_offline_mode',
              'Enable Offline Mode',
              'Allow the application to work without an internet connection'
            )}
            
            {renderSwitch(
              'auto_backup',
              'Automatic Backups',
              'Automatically create backups of your data'
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Synchronization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="sync_interval_minutes" className="text-sm font-medium">
                  Sync Interval (minutes)
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      How often to sync data with the server (in minutes)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="sync_interval_minutes"
                type="number"
                min="1"
                value={settings.sync_interval_minutes || 15}
                onChange={(e) => onInputChange('sync_interval_minutes', parseInt(e.target.value) || 15)}
                onBlur={() => onBlur('sync_interval_minutes')}
                className={touched['sync_interval_minutes'] && errors['sync_interval_minutes'] ? 'border-destructive' : ''}
              />
              {touched['sync_interval_minutes'] && errors['sync_interval_minutes'] && (
                <p className="text-sm text-destructive">
                  {errors['sync_interval_minutes']}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="backup_retention_days" className="text-sm font-medium">
                  Backup Retention (days)
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      How long to keep backup files before automatically deleting them
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="backup_retention_days"
                type="number"
                min="1"
                max="365"
                value={settings.backup_retention_days || 30}
                onChange={(e) => onInputChange('backup_retention_days', parseInt(e.target.value) || 30)}
                onBlur={() => onBlur('backup_retention_days')}
                className={touched['backup_retention_days'] && errors['backup_retention_days'] ? 'border-destructive' : ''}
              />
              {touched['backup_retention_days'] && errors['backup_retention_days'] && (
                <p className="text-sm text-destructive">
                  {errors['backup_retention_days']}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Media Settings</h3>
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="max_photo_size_mb" className="text-sm font-medium">
                  Maximum Photo Size (MB)
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Maximum allowed size for uploaded photos in megabytes
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="max_photo_size_mb"
                type="number"
                min="0.1"
                step="0.1"
                value={settings.max_photo_size_mb || 5}
                onChange={(e) => onInputChange('max_photo_size_mb', parseFloat(e.target.value) || 5)}
                onBlur={() => onBlur('max_photo_size_mb')}
                className={touched['max_photo_size_mb'] && errors['max_photo_size_mb'] ? 'border-destructive' : ''}
              />
              {touched['max_photo_size_mb'] && errors['max_photo_size_mb'] && (
                <p className="text-sm text-destructive">
                  {errors['max_photo_size_mb']}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
