import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Slider } from '@/shared/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
export type { HSLColor } from '@/shared/types/common.types/branding';
import type { HSLColor } from '@/shared/types/common.types/branding';

interface HSLColorPickerProps {
  label: string;
  value: HSLColor;
  onChange: (color: HSLColor) => void;
}

/* ── Conversion helpers ── */

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

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
  };
  return { r: f(0), g: f(8), b: f(4) };
}

function hexToHsl(hex: string): HSLColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToHsl(r: number, g: number, b: number): HSLColor | null {
  if ([r, g, b].some(v => v < 0 || v > 255 || isNaN(v))) return null;
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/* ── Color Panel (Saturation × Lightness) ── */

function ColorPanel({ hue, value, onChange }: { hue: number; value: HSLColor; onChange: (c: HSLColor) => void }) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    // x = saturation (0-100), y = lightness inverted (100→0)
    onChange({ h: hue, s: Math.round(x * 100), l: Math.round((1 - y) * 100) });
  }, [hue, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onChange({ h: hue, s: Math.round(x * 100), l: Math.round((1 - y) * 100) });
  }, [hue, onChange]);

  const thumbX = (value.s / 100) * 100;
  const thumbY = ((100 - value.l) / 100) * 100;

  return (
    <div
      className="relative w-full h-40 rounded-lg cursor-crosshair border border-border overflow-hidden"
      style={{
        background: `
          linear-gradient(to bottom, transparent, black),
          linear-gradient(to right, white, hsl(${hue}, 100%, 50%))
        `,
      }}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
    >
      <div
        className="absolute w-4 h-4 rounded-full border-2 border-background shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `${thumbX}%`,
          top: `${thumbY}%`,
          backgroundColor: `hsl(${value.h}, ${value.s}%, ${value.l}%)`,
        }}
      />
    </div>
  );
}

/* ── Main Component ── */

export function HSLColorPicker({ label, value, onChange }: HSLColorPickerProps) {
  const { t } = useTranslation();
  const [hexInput, setHexInput] = useState('');
  const [rgbInput, setRgbInput] = useState({ r: '', g: '', b: '' });

  const hexColor = hslToHex(value.h, value.s, value.l);
  const rgb = hslToRgb(value.h, value.s, value.l);
  const hslString = `hsl(${value.h}, ${value.s}%, ${value.l}%)`;

  const handleHexCommit = (hex: string) => {
    const parsed = hexToHsl(hex);
    if (parsed) onChange(parsed);
  };

  const handleRgbCommit = (r: string, g: string, b: string) => {
    const parsed = rgbToHsl(parseInt(r), parseInt(g), parseInt(b));
    if (parsed) onChange(parsed);
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = hexToHsl(e.target.value);
    if (parsed) onChange(parsed);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <div className="flex items-center gap-2">
            {/* Native color picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 rounded-md border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                  style={{ backgroundColor: hslString }}
                  aria-label={t('branding.pickColor', 'Pick color')}
                />
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="end">
                <div className="space-y-3">
                  {/* Visual color panel */}
                  <ColorPanel hue={value.h} value={value} onChange={onChange} />

                  {/* Hue strip */}
                  <div className="space-y-1">
                    <div
                      className="h-3 rounded-md"
                      style={{
                        background: 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))'
                      }}
                    />
                    <Slider
                      value={[value.h]}
                      onValueChange={([v]) => onChange({ ...value, h: v })}
                      max={360} min={0} step={1}
                      className="cursor-pointer"
                    />
                  </div>

                  {/* Native picker fallback */}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={hexColor}
                      onChange={handleNativeColorChange}
                      className="h-8 w-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-xs text-muted-foreground">{t('branding.systemPicker', 'System picker')}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground font-mono">{hexColor}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input tabs: Hex / RGB / HSL sliders */}
        <Tabs defaultValue="sliders" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="sliders" className="flex-1">HSL</TabsTrigger>
            <TabsTrigger value="hex" className="flex-1">HEX</TabsTrigger>
            <TabsTrigger value="rgb" className="flex-1">RGB</TabsTrigger>
          </TabsList>

          {/* HSL Sliders */}
          <TabsContent value="sliders" className="space-y-4 pt-2">
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
              <Slider value={[value.h]} onValueChange={([v]) => onChange({ ...value, h: v })} max={360} min={0} step={1} className="cursor-pointer" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">{t('branding.saturation')}</Label>
                <span className="text-sm text-muted-foreground">{value.s}%</span>
              </div>
              <div
                className="h-3 rounded-md"
                style={{ background: `linear-gradient(to right, hsl(${value.h}, 0%, ${value.l}%), hsl(${value.h}, 100%, ${value.l}%))` }}
              />
              <Slider value={[value.s]} onValueChange={([v]) => onChange({ ...value, s: v })} max={100} min={0} step={1} className="cursor-pointer" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">{t('branding.lightness')}</Label>
                <span className="text-sm text-muted-foreground">{value.l}%</span>
              </div>
              <div
                className="h-3 rounded-md"
                style={{ background: `linear-gradient(to right, hsl(${value.h}, ${value.s}%, 0%), hsl(${value.h}, ${value.s}%, 50%), hsl(${value.h}, ${value.s}%, 100%))` }}
              />
              <Slider value={[value.l]} onValueChange={([v]) => onChange({ ...value, l: v })} max={100} min={0} step={1} className="cursor-pointer" />
            </div>
          </TabsContent>

          {/* HEX Input */}
          <TabsContent value="hex" className="pt-2">
            <div className="space-y-2">
              <Label className="text-sm">{t('branding.hexColor', 'Hex Color')}</Label>
              <div className="flex gap-2">
                <Input
                  value={hexInput || hexColor}
                  onChange={(e) => setHexInput(e.target.value)}
                  onBlur={() => {
                    handleHexCommit(hexInput || hexColor);
                    setHexInput('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleHexCommit(hexInput || hexColor);
                      setHexInput('');
                    }
                  }}
                  placeholder="#000000"
                  className="font-mono"
                  maxLength={7}
                />
                <div
                  className="h-9 w-9 rounded-md border border-border shrink-0"
                  style={{ backgroundColor: hslString }}
                />
              </div>
              <p className="text-2xs text-muted-foreground">
                {t('branding.hexHint', 'Enter a 6-digit hex code (e.g. #3B82F6)')}
              </p>
            </div>
          </TabsContent>

          {/* RGB Input */}
          <TabsContent value="rgb" className="pt-2">
            <div className="space-y-2">
              <Label className="text-sm">{t('branding.rgbColor', 'RGB Color')}</Label>
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-2xs text-muted-foreground">R</Label>
                  <Input
                    type="number" min={0} max={255}
                    value={rgbInput.r || rgb.r}
                    onChange={(e) => setRgbInput(prev => ({ ...prev, r: e.target.value }))}
                    onBlur={() => {
                      handleRgbCommit(rgbInput.r || String(rgb.r), rgbInput.g || String(rgb.g), rgbInput.b || String(rgb.b));
                      setRgbInput({ r: '', g: '', b: '' });
                    }}
                    className="font-mono"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-2xs text-muted-foreground">G</Label>
                  <Input
                    type="number" min={0} max={255}
                    value={rgbInput.g || rgb.g}
                    onChange={(e) => setRgbInput(prev => ({ ...prev, g: e.target.value }))}
                    onBlur={() => {
                      handleRgbCommit(rgbInput.r || String(rgb.r), rgbInput.g || String(rgb.g), rgbInput.b || String(rgb.b));
                      setRgbInput({ r: '', g: '', b: '' });
                    }}
                    className="font-mono"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-2xs text-muted-foreground">B</Label>
                  <Input
                    type="number" min={0} max={255}
                    value={rgbInput.b || rgb.b}
                    onChange={(e) => setRgbInput(prev => ({ ...prev, b: e.target.value }))}
                    onBlur={() => {
                      handleRgbCommit(rgbInput.r || String(rgb.r), rgbInput.g || String(rgb.g), rgbInput.b || String(rgb.b));
                      setRgbInput({ r: '', g: '', b: '' });
                    }}
                    className="font-mono"
                  />
                </div>
                <div
                  className="h-9 w-9 rounded-md border border-border shrink-0"
                  style={{ backgroundColor: hslString }}
                />
              </div>
              <p className="text-2xs text-muted-foreground">
                {t('branding.rgbHint', 'Enter values 0–255 for Red, Green, Blue')}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

