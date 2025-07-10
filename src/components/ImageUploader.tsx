
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
    // This effect handles setting the initial preview from a URL string
    // or clearing the preview if the value is reset from the parent form.
    if (typeof value === 'string') {
      setPreview(value);
    } else if (value === null) {
      setPreview(null);
    }
    // We don't handle File objects here to avoid re-generating the blob URL on every render.
    // The preview for a new file is set in onDrop.
  }, [value]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsCompressing(true);
      setPreview(null); // Clear previous preview
      if (preview) {
        // Revoke the old object URL to prevent memory leaks
        URL.revokeObjectURL(preview);
      }
      
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: false,
        };
        console.log('Original image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        const compressedFile = await imageCompression(file, options);
        console.log('Compressed image size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
        
        // Create a new preview URL from the compressed file
        const newPreview = URL.createObjectURL(compressedFile);
        setPreview(newPreview);
        
        // Pass the compressed file to the parent form
        onChange(compressedFile);
      } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback to the original file if compression fails
        onChange(file);
      } finally {
        setIsCompressing(false);
      }
    }
  }, [onChange, preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    onChange(null);
  }

  // Cleanup effect to revoke object URL when component unmounts
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

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
            <Image src={preview} alt="Image preview" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover rounded-md" data-ai-hint="product photo" />
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
