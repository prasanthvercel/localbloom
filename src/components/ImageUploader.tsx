
'use client';

import { Upload, X, Loader2, Crop } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';


interface ImageUploaderProps {
  value: File | string | null;
  onChange: (file: File | null) => void;
  className?: string;
  aspectRatio?: number;
}

export function ImageUploader({ value, onChange, className, aspectRatio }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<CropType>();
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperImgSrc, setCropperImgSrc] = useState<string>('');
  
  const imgRef = useRef<HTMLImageElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsCompressing(true);
      
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        };
        const compressedFile = await imageCompression(file, options);
        
        setCrop(undefined); 
        setCompletedCrop(undefined);

        if (aspectRatio) {
            const cropperUrl = URL.createObjectURL(compressedFile);
            setCropperImgSrc(cropperUrl);
            setIsCropperOpen(true);
        } else {
            onChange(compressedFile);
        }

      } catch (error) {
        console.error('Image compression failed:', error);
        onChange(file); // Fallback to original file
      } finally {
        setIsCompressing(false);
      }
    }
  }, [onChange, aspectRatio]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });
  
  useEffect(() => {
    let objectUrl: string | null = null;
    if (typeof value === 'string') {
      setPreview(value);
    } else if (value instanceof File) {
        objectUrl = URL.createObjectURL(value);
        setPreview(objectUrl);
    } else {
        setPreview(null);
    }
    
    return () => {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
  }, [value]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspectRatio) {
      const { width, height } = e.currentTarget;
      const newCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, width, height),
        width,
        height
      );
      setCrop(newCrop);
      setCompletedCrop(newCrop);
    }
  }

  const handleCropConfirm = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped-image.jpeg', { type: 'image/jpeg' });
          onChange(croppedFile);
          setIsCropperOpen(false);
        }
      },
      'image/jpeg',
      0.9
    );
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(null);
  }

  const handleOpenCropper = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (preview) {
        setCropperImgSrc(preview);
        setIsCropperOpen(true);
    }
  }

  useEffect(() => {
    // When the dialog is closed, revoke the object URL to prevent memory leaks
    if (!isCropperOpen) {
      if (cropperImgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(cropperImgSrc);
      }
      setCropperImgSrc('');
    }
  }, [isCropperOpen, cropperImgSrc]);

  return (
    <>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex items-center justify-center w-full rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors',
          className,
          isDragActive && 'border-primary'
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
              {aspectRatio && (
                <div className="absolute bottom-2 right-2 z-10">
                    <Button variant="secondary" size="sm" onClick={handleOpenCropper}>
                        <Crop className="h-4 w-4 mr-2" />
                        Crop Image
                    </Button>
                </div>
              )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-center p-4">
            <Upload className="h-8 w-8" />
            <p className="text-sm font-semibold">Drop an image here, or click to select</p>
          </div>
        )}
      </div>

      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Crop your image</DialogTitle>
                <DialogDescription>
                    Adjust the selection to crop the image. Click "Confirm Crop" to save.
                </DialogDescription>
            </DialogHeader>
            {cropperImgSrc && (
                <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                minWidth={100}
                >
                <img ref={imgRef} src={cropperImgSrc} alt="Crop preview" onLoad={onImageLoad} className="w-full" key={cropperImgSrc} />
                </ReactCrop>
            )}
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsCropperOpen(false)}>Cancel</Button>
                <Button onClick={handleCropConfirm}>Confirm Crop</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
