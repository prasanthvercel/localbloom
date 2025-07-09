
'use client';

import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

interface ImageUploaderProps {
  value: File | string | null;
  onChange: (file: File | null) => void;
  className?: string;
}

export function ImageUploader({ value, onChange, className }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (typeof value === 'string') {
      setPreview(value);
    } else if (value instanceof File) {
      const newPreview = URL.createObjectURL(value);
      setPreview(newPreview);
      return () => URL.revokeObjectURL(newPreview);
    } else {
      setPreview(null);
    }
  }, [value]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsCompressing(true);
      try {
        const options = {
          maxSizeMB: 1, // Max file size 1MB
          maxWidthOrHeight: 1024, // Max width/height 1024px
          useWebWorker: true,
        };
        console.log('Original image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        const compressedFile = await imageCompression(file, options);
        console.log('Compressed image size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
        onChange(compressedFile);
      } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback to the original file if compression fails
        onChange(file);
      } finally {
        setIsCompressing(false);
      }
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(null);
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex items-center justify-center w-full aspect-video rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors',
        isDragActive && 'border-primary',
        className
      )}
    >
      <input {...getInputProps()} />

      {isCompressing ? (
         <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-center p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-semibold">Optimizing image...</p>
        </div>
      ) : preview ? (
        <>
            <Image src={preview} alt="Image preview" fill className="object-cover rounded-md" data-ai-hint="product photo" />
            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={handleRemove}>
                <X className="h-4 w-4" />
            </Button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-center p-4">
          <Upload className="h-8 w-8" />
          <p className="text-sm font-semibold">Drop an image here, or click to select</p>
        </div>
      )}
    </div>
  );
}
