import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CardDesign } from "@/services/settingsService";

interface CardSettingsProps {
  cardDesign: CardDesign;
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  touched: Record<string, boolean>;
}

export function CardSettings({
  cardDesign,
  errors,
  onInputChange,
  onBlur,
  touched
}: CardSettingsProps) {
  const renderSwitch = (name: keyof CardDesign, label: string, description: string) => {
    const fieldName = `card_design.${name}`;
    const isChecked = cardDesign?.[name] as boolean;
    const error = errors[fieldName];
    const isTouched = touched[fieldName];

    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center">
            <Label htmlFor={fieldName} className="text-sm font-medium">
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
          id={fieldName}
          checked={isChecked}
          onCheckedChange={(checked) => onInputChange(fieldName, checked)}
          onBlur={() => onBlur(fieldName)}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        />
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ID Card Design</CardTitle>
        <CardDescription className="text-sm">
          Customize the appearance and layout of student ID cards.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Colors</h3>
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="card_design.primary_color" className="text-sm font-medium">
                  Primary Color
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="card_design.primary_color"
                    type="color"
                    value={cardDesign.primary_color}
                    onChange={(e) => onInputChange('card_design.primary_color', e.target.value)}
                    onBlur={() => onBlur('card_design.primary_color')}
                    className="h-10 w-16 p-1 rounded"
                  />
                  <span className="text-sm text-muted-foreground">
                    {cardDesign.primary_color}
                  </span>
                </div>
                {touched['card_design.primary_color'] && errors['card_design.primary_color'] && (
                  <p className="text-sm text-destructive">
                    {errors['card_design.primary_color']}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="card_design.secondary_color" className="text-sm font-medium">
                  Secondary Color
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="card_design.secondary_color"
                    type="color"
                    value={cardDesign.secondary_color}
                    onChange={(e) => onInputChange('card_design.secondary_color', e.target.value)}
                    onBlur={() => onBlur('card_design.secondary_color')}
                    className="h-10 w-16 p-1 rounded"
                  />
                  <span className="text-sm text-muted-foreground">
                    {cardDesign.secondary_color}
                  </span>
                </div>
                {touched['card_design.secondary_color'] && errors['card_design.secondary_color'] && (
                  <p className="text-sm text-destructive">
                    {errors['card_design.secondary_color']}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Display Options</h3>
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              {renderSwitch(
                'show_qr_code',
                'Show QR Code',
                'Display a QR code on the ID card for quick scanning'
              )}
              
              {renderSwitch(
                'show_photo',
                'Show Student Photo',
                'Display the student\'s photo on the ID card'
              )}
              
              {renderSwitch(
                'show_id_number',
                'Show ID Number',
                'Display the student\'s ID number on the card'
              )}
              
              {renderSwitch(
                'show_slogan',
                'Show School Slogan',
                'Display the school slogan on the ID card'
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Card Dimensions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="card_design.card_width" className="text-sm font-medium">
                Width (mm)
              </Label>
              <Input
                id="card_design.card_width"
                type="number"
                value={cardDesign.card_width}
                onChange={(e) => onInputChange('card_design.card_width', parseFloat(e.target.value) || 0)}
                onBlur={() => onBlur('card_design.card_width')}
                min="50"
                max="200"
                step="0.1"
                className={touched['card_design.card_width'] && errors['card_design.card_width'] ? 'border-destructive' : ''}
              />
              {touched['card_design.card_width'] && errors['card_design.card_width'] && (
                <p className="text-sm text-destructive">
                  {errors['card_design.card_width']}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="card_design.card_height" className="text-sm font-medium">
                Height (mm)
              </Label>
              <Input
                id="card_design.card_height"
                type="number"
                value={cardDesign.card_height}
                onChange={(e) => onInputChange('card_design.card_height', parseFloat(e.target.value) || 0)}
                onBlur={() => onBlur('card_design.card_height')}
                min="50"
                max="200"
                step="0.1"
                className={touched['card_design.card_height'] && errors['card_design.card_height'] ? 'border-destructive' : ''}
              />
              {touched['card_design.card_height'] && errors['card_design.card_height'] && (
                <p className="text-sm text-destructive">
                  {errors['card_design.card_height']}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="card_design.border_radius" className="text-sm font-medium">
                Border Radius (px)
              </Label>
              <Input
                id="card_design.border_radius"
                type="number"
                value={cardDesign.border_radius}
                onChange={(e) => onInputChange('card_design.border_radius', parseFloat(e.target.value) || 0)}
                onBlur={() => onBlur('card_design.border_radius')}
                min="0"
                max="50"
                className={touched['card_design.border_radius'] && errors['card_design.border_radius'] ? 'border-destructive' : ''}
              />
              {touched['card_design.border_radius'] && errors['card_design.border_radius'] && (
                <p className="text-sm text-destructive">
                  {errors['card_design.border_radius']}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
