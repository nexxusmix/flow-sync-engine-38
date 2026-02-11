import { useState, useEffect } from 'react';
import { Palette, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BrandKit, ColorItem, FontItem } from '@/types/marketing';

const AVAILABLE_FONTS = [
  'Host Grotesk', 'Inter', 'Roboto', 'Montserrat', 'Poppins',
  'Open Sans', 'Lato', 'Playfair Display', 'Bebas Neue', 'Oswald',
  'Raleway', 'Merriweather', 'DM Sans', 'Space Grotesk', 'Satoshi',
];

export interface BrandKitSnapshot {
  brand_kit_id: string | null;
  brand_kit_name: string;
  logo_url: string | null;
  show_logo: boolean;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  font_heading: string;
  font_body: string;
}

interface BrandKitSelectorProps {
  brandKits: BrandKit[];
  selectedBrandKitId: string | null;
  snapshot: BrandKitSnapshot;
  onSnapshotChange: (snapshot: BrandKitSnapshot) => void;
  onBrandKitChange: (kitId: string | null) => void;
}

function getDefaultSnapshot(): BrandKitSnapshot {
  return {
    brand_kit_id: null,
    brand_kit_name: 'Padrão Workspace',
    logo_url: null,
    show_logo: true,
    primary_color: '#6366f1',
    secondary_color: '#ec4899',
    background_color: '#0f0f11',
    font_heading: 'Host Grotesk',
    font_body: 'Host Grotesk',
  };
}

export function snapshotFromBrandKit(kit: BrandKit | null): BrandKitSnapshot {
  if (!kit) return getDefaultSnapshot();

  const colors = kit.colors || [];
  const fonts = kit.fonts || [];

  const findColor = (usage: string, fallback: string) => {
    const c = colors.find(c => c.usage?.toLowerCase().includes(usage));
    return c?.hex || fallback;
  };

  const findFont = (usage: string, fallback: string) => {
    const f = fonts.find(f => f.usage?.toLowerCase().includes(usage));
    return f?.name || fallback;
  };

  return {
    brand_kit_id: kit.id,
    brand_kit_name: kit.name,
    logo_url: kit.logo_url || null,
    show_logo: true,
    primary_color: findColor('primary', colors[0]?.hex || '#6366f1'),
    secondary_color: findColor('second', colors[1]?.hex || '#ec4899'),
    background_color: findColor('background', colors[2]?.hex || '#0f0f11'),
    font_heading: findFont('heading', fonts[0]?.name || 'Host Grotesk'),
    font_body: findFont('body', fonts[1]?.name || fonts[0]?.name || 'Host Grotesk'),
  };
}

export function BrandKitSelector({
  brandKits,
  selectedBrandKitId,
  snapshot,
  onSnapshotChange,
  onBrandKitChange,
}: BrandKitSelectorProps) {

  const handleSelectKit = (kitId: string) => {
    if (kitId === 'none') {
      onBrandKitChange(null);
      onSnapshotChange(getDefaultSnapshot());
      return;
    }
    const kit = brandKits.find(k => k.id === kitId) || null;
    onBrandKitChange(kitId);
    onSnapshotChange(snapshotFromBrandKit(kit));
  };

  const handleRestore = () => {
    if (selectedBrandKitId) {
      const kit = brandKits.find(k => k.id === selectedBrandKitId) || null;
      onSnapshotChange(snapshotFromBrandKit(kit));
    } else {
      onSnapshotChange(getDefaultSnapshot());
    }
  };

  const update = (partial: Partial<BrandKitSnapshot>) => {
    onSnapshotChange({ ...snapshot, ...partial });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Brand Kit</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={handleRestore}>
          <RotateCcw className="w-3 h-3 mr-1" />
          Restaurar
        </Button>
      </div>

      {/* Kit Selector */}
      <Select value={selectedBrandKitId || 'none'} onValueChange={handleSelectKit}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Selecionar Brand Kit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Padrão Workspace</SelectItem>
          {brandKits.map(kit => (
            <SelectItem key={kit.id} value={kit.id}>{kit.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Applied Brand Preview */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
        <Badge variant="outline" className="text-[9px]">
          {snapshot.brand_kit_name}
        </Badge>

        {/* Colors */}
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Cores</Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground">Primária</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={snapshot.primary_color}
                  onChange={(e) => update({ primary_color: e.target.value })}
                  className="w-6 h-6 rounded border border-border cursor-pointer"
                />
                <span className="text-[9px] text-muted-foreground font-mono">
                  {snapshot.primary_color}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground">Secundária</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={snapshot.secondary_color}
                  onChange={(e) => update({ secondary_color: e.target.value })}
                  className="w-6 h-6 rounded border border-border cursor-pointer"
                />
                <span className="text-[9px] text-muted-foreground font-mono">
                  {snapshot.secondary_color}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground">Fundo</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={snapshot.background_color}
                  onChange={(e) => update({ background_color: e.target.value })}
                  className="w-6 h-6 rounded border border-border cursor-pointer"
                />
                <span className="text-[9px] text-muted-foreground font-mono">
                  {snapshot.background_color}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fonts */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Fonte Título</Label>
            <Select value={snapshot.font_heading} onValueChange={(v) => update({ font_heading: v })}>
              <SelectTrigger className="h-7 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FONTS.map(f => (
                  <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Fonte Corpo</Label>
            <Select value={snapshot.font_body} onValueChange={(v) => update({ font_body: v })}>
              <SelectTrigger className="h-7 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FONTS.map(f => (
                  <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logo Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {snapshot.show_logo ? (
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <Label className="text-[10px]">Incluir Logo</Label>
          </div>
          <Switch
            checked={snapshot.show_logo}
            onCheckedChange={(v) => update({ show_logo: v })}
            className="scale-75"
          />
        </div>

        {snapshot.logo_url && snapshot.show_logo && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
            <img src={snapshot.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded" />
            <span className="text-[10px] text-muted-foreground truncate">{snapshot.logo_url}</span>
          </div>
        )}
      </div>
    </div>
  );
}
