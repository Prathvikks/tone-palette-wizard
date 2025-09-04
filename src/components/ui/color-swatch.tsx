import React from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ColorSwatchProps {
  color: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showHex?: boolean;
  className?: string;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  label,
  size = 'md',
  showHex = true,
  className
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn("flex flex-col items-center gap-2 group", className)}>
      <div
        className={cn(
          "rounded-lg shadow-color-swatch border-2 border-white/20 cursor-pointer transition-all hover:scale-110 hover:shadow-lg relative overflow-hidden",
          sizeClasses[size]
        )}
        style={{ backgroundColor: color }}
        onClick={copyToClipboard}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          {copied ? (
            <Check className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : (
            <Copy className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      
      {(label || showHex) && (
        <div className="text-center">
          {label && (
            <p className="text-xs font-medium text-foreground mb-1">{label}</p>
          )}
          {showHex && (
            <p className="text-xs text-muted-foreground font-mono">{color}</p>
          )}
        </div>
      )}
    </div>
  );
};