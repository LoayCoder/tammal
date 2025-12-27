import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

interface HSLColorPickerProps {
  label: string;
  value: HSLColor;
  onChange: (color: HSLColor) => void;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function HSLColorPicker({ label, value, onChange }: HSLColorPickerProps) {
  const { t } = useTranslation();

  const handleHueChange = (newValue: number[]) => {
    onChange({ ...value, h: newValue[0] });
  };

  const handleSaturationChange = (newValue: number[]) => {
    onChange({ ...value, s: newValue[0] });
  };

  const handleLightnessChange = (newValue: number[]) => {
    onChange({ ...value, l: newValue[0] });
  };

  const hexColor = hslToHex(value.h, value.s, value.l);
  const hslString = `hsl(${value.h}, ${value.s}%, ${value.l}%)`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <div className="flex items-center gap-2">
            <div 
              className="h-8 w-8 rounded-md border border-border shadow-sm" 
              style={{ backgroundColor: hslString }}
            />
            <span className="text-xs text-muted-foreground font-mono">{hexColor}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hue Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">{t('branding.hue')}</Label>
            <span className="text-sm text-muted-foreground">{value.h}°</span>
          </div>
          <div 
            className="h-3 rounded-md"
            style={{
              background: 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))'
            }}
          />
          <Slider
            value={[value.h]}
            onValueChange={handleHueChange}
            max={360}
            min={0}
            step={1}
            className="cursor-pointer"
          />
        </div>

        {/* Saturation Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">{t('branding.saturation')}</Label>
            <span className="text-sm text-muted-foreground">{value.s}%</span>
          </div>
          <div 
            className="h-3 rounded-md"
            style={{
              background: `linear-gradient(to right, hsl(${value.h}, 0%, ${value.l}%), hsl(${value.h}, 100%, ${value.l}%))`
            }}
          />
          <Slider
            value={[value.s]}
            onValueChange={handleSaturationChange}
            max={100}
            min={0}
            step={1}
            className="cursor-pointer"
          />
        </div>

        {/* Lightness Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm">{t('branding.lightness')}</Label>
            <span className="text-sm text-muted-foreground">{value.l}%</span>
          </div>
          <div 
            className="h-3 rounded-md"
            style={{
              background: `linear-gradient(to right, hsl(${value.h}, ${value.s}%, 0%), hsl(${value.h}, ${value.s}%, 50%), hsl(${value.h}, ${value.s}%, 100%))`
            }}
          />
          <Slider
            value={[value.l]}
            onValueChange={handleLightnessChange}
            max={100}
            min={0}
            step={1}
            className="cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  );
}
