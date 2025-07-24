
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  placeholder?: string;
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#008000', '#000080'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#000000',
  onChange,
  placeholder = 'Escolha uma cor'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (color: string) => {
    if (onChange) {
      onChange(color);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          style={{ backgroundColor: value }}
        >
          <Palette className="w-4 h-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Cor personalizada
            </label>
            <Input
              type="color"
              value={value}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-10"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Cores predefinidas
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;
