import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SystemSettings } from "@/services/settingsService";

interface AttendanceSettingsProps {
  settings: SystemSettings;
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  touched: Record<string, boolean>;
}

export function AttendanceSettings({
  settings,
  errors,
  onInputChange,
  onBlur,
  touched
}: AttendanceSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attendance Settings</CardTitle>
        <CardDescription className="text-sm">
          Configure attendance tracking parameters and late arrival policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="attendance_start_time" className="text-sm font-medium">
                Start Time
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">Official start time for attendance (HH:MM)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="attendance_start_time"
              type="time"
              value={settings.attendance_start_time || ''}
              onChange={(e) => onInputChange('attendance_start_time', e.target.value)}
              onBlur={() => onBlur('attendance_start_time')}
              className={touched['attendance_start_time'] && errors['attendance_start_time'] ? 'border-destructive' : ''}
            />
            {touched['attendance_start_time'] && errors['attendance_start_time'] && (
              <p className="text-sm text-destructive">{errors['attendance_start_time']}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="attendance_end_time" className="text-sm font-medium">
                End Time
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">Official end time for attendance (HH:MM)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="attendance_end_time"
              type="time"
              value={settings.attendance_end_time || ''}
              onChange={(e) => onInputChange('attendance_end_time', e.target.value)}
              onBlur={() => onBlur('attendance_end_time')}
              className={touched['attendance_end_time'] && errors['attendance_end_time'] ? 'border-destructive' : ''}
            />
            {touched['attendance_end_time'] && errors['attendance_end_time'] && (
              <p className="text-sm text-destructive">{errors['attendance_end_time']}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="late_threshold_minutes" className="text-sm font-medium">
              Late Arrival Threshold (minutes)
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Number of minutes after the start time when a student is considered late
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="late_threshold_minutes"
            type="number"
            min="0"
            max="240"
            value={settings.late_threshold_minutes || 0}
            onChange={(e) => onInputChange('late_threshold_minutes', parseInt(e.target.value) || 0)}
            onBlur={() => onBlur('late_threshold_minutes')}
            className={touched['late_threshold_minutes'] && errors['late_threshold_minutes'] ? 'border-destructive' : ''}
          />
          {touched['late_threshold_minutes'] && errors['late_threshold_minutes'] && (
            <p className="text-sm text-destructive">{errors['late_threshold_minutes']}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
