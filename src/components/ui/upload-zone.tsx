import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onImageUpload: (file: File) => void;
  uploadedImage?: string;
  onRemoveImage?: () => void;
  className?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onImageUpload,
  uploadedImage,
  onRemoveImage,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageUpload(imageFile);
    }
  }, [onImageUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  if (uploadedImage) {
    return (
      <div className={cn("relative group", className)}>
        <img
          src={uploadedImage}
          alt="Uploaded"
          className="w-full h-full object-cover rounded-lg shadow-card"
        />
        {onRemoveImage && (
          <button
            onClick={onRemoveImage}
            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-soft"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg bg-gradient-subtle transition-all duration-300 cursor-pointer group",
        isDragOver ? "border-primary bg-accent/50 scale-[1.02]" : "border-border hover:border-primary/50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 p-4 bg-gradient-primary rounded-full shadow-soft group-hover:shadow-lg transition-shadow">
          <Upload className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          Upload Your Photo
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Drag and drop your image here, or click to browse. We'll analyze your skin tone and suggest perfect color matches.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>PNG, JPG up to 10MB</span>
        </div>
      </div>
    </div>
  );
};