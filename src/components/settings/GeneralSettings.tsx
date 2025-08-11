import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SystemSettings } from "@/services/settingsService";

interface GeneralSettingsProps {
  settings: SystemSettings;
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  touched: Record<string, boolean>;
}

export function GeneralSettings({
  settings,
  errors,
  onInputChange,
  onBlur,
  touched
}: GeneralSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">General Settings</CardTitle>
        <CardDescription className="text-sm">
          Configure your school's basic information and system preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="school_name" className="text-sm font-medium">
                School Name
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">The official name of your school</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="school_name"
              value={settings.school_name || ''}
              onChange={(e) => onInputChange('school_name', e.target.value)}
              onBlur={() => onBlur('school_name')}
              className={touched['school_name'] && errors['school_name'] ? 'border-destructive' : ''}
            />
            {touched['school_name'] && errors['school_name'] && (
              <p className="text-sm text-destructive">{errors['school_name']}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="school_logo_url" className="text-sm font-medium">
                School Logo URL
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">URL to your school's logo (optional)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="school_logo_url"
              value={settings.school_logo_url || ''}
              onChange={(e) => onInputChange('school_logo_url', e.target.value)}
              onBlur={() => onBlur('school_logo_url')}
              className={touched['school_logo_url'] && errors['school_logo_url'] ? 'border-destructive' : ''}
            />
            {touched['school_logo_url'] && errors['school_logo_url'] && (
              <p className="text-sm text-destructive">{errors['school_logo_url']}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="school_address" className="text-sm font-medium">
              School Address
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">The full address of your school</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="school_address"
            value={settings.school_address || ''}
            onChange={(e) => onInputChange('school_address', e.target.value)}
            onBlur={() => onBlur('school_address')}
            className={touched['school_address'] && errors['school_address'] ? 'border-destructive' : ''}
          />
          {touched['school_address'] && errors['school_address'] && (
            <p className="text-sm text-destructive">{errors['school_address']}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="school_slogan" className="text-sm font-medium">
              School Slogan
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">Your school's motto or tagline (optional)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="school_slogan"
            value={settings.school_slogan || ''}
            onChange={(e) => onInputChange('school_slogan', e.target.value)}
            onBlur={() => onBlur('school_slogan')}
            className={touched['school_slogan'] && errors['school_slogan'] ? 'border-destructive' : ''}
          />
          {touched['school_slogan'] && errors['school_slogan'] && (
            <p className="text-sm text-destructive">{errors['school_slogan']}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
