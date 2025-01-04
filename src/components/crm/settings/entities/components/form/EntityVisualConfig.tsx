import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Cog, Palette } from "lucide-react";

const ICON_OPTIONS = [
  { value: 'database', label: 'Database', icon: Database },
  { value: 'cog', label: 'Settings', icon: Cog },
  { value: 'palette', label: 'Palette', icon: Palette },
];

const COLOR_OPTIONS = [
  { value: '#4A90E2', label: 'Blue' },
  { value: '#9b87f5', label: 'Purple' },
  { value: '#7E69AB', label: 'Dark Purple' },
  { value: '#F97316', label: 'Orange' },
  { value: '#0EA5E9', label: 'Ocean Blue' },
  { value: '#D946EF', label: 'Magenta' },
];

interface EntityVisualConfigProps {
  selectedIcon: string;
  selectedColor: string;
  onIconChange: (value: string) => void;
  onColorChange: (value: string) => void;
}

export function EntityVisualConfig({
  selectedIcon,
  selectedColor,
  onIconChange,
  onColorChange,
}: EntityVisualConfigProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Ícone</Label>
        <Select value={selectedIcon} onValueChange={onIconChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ICON_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Cor</Label>
        <Select value={selectedColor} onValueChange={onColorChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLOR_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-4 w-4 rounded-full" 
                    style={{ backgroundColor: option.value }}
                  />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}