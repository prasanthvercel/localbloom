
'use client';

import { Upload, X, Loader2, Crop } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';

interface ImageUploaderProps {
  value: File | string | null;
  onChange: (file: File | null) => void;
  className?: string;
  aspectRatio?: number;
}

export function ImageUploader({ value, onChange, className, aspectRatio }: ImageUploaderProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<CropType>();
  const [isCompressing, setIsCompressing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsCompressing(true);
      if (imgSrc) {
        URL.revokeObjectURL(imgSrc);
      }
      
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        };
        console.log('Original image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        const compressedFile = await imageCompression(file, options);
        console.log('Compressed image size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
        
        const newPreview = URL.createObjectURL(compressedFile);
        setImgSrc(newPreview);

        if (aspectRatio) {
          setShowCropper(true);
        } else {
          onChange(compressedFile);
        }

      } catch (error) {
        console.error('Image compression failed:', error);
        onChange(file);
      } finally {
        setIsCompressing(false);
      }
    }
  }, [onChange, imgSrc, aspectRatio]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });
  
  useEffect(() => {
    if (typeof value === 'string' && !value.startsWith('blob:')) {
      setImgSrc(value);
    } else if (value === null) {
      setImgSrc(null);
    } else if (value instanceof File) {
        const url = URL.createObjectURL(value);
        setImgSrc(url);
        return () => URL.revokeObjectURL(url);
    }
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
    const canvas = previewCanvasRef.current;
    if (!image || !canvas || !completedCrop) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped-image.jpeg', { type: 'image/jpeg' });
          onChange(croppedFile);
          setShowCropper(false);
          // Create a new URL for the cropped image to display it
          if (imgSrc) URL.revokeObjectURL(imgSrc);
          setImgSrc(URL.createObjectURL(croppedFile));
        }
      },
      'image/jpeg',
      0.9
    );
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (imgSrc) {
      URL.revokeObjectURL(imgSrc);
    }
    onChange(null);
    setShowCropper(false);
    setImgSrc(null);
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (imgSrc && imgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc);
      }
    };
  }, [imgSrc]);

  return (
    <>
    <div
      {...getRootProps()}
      className={cn(
        'relative flex items-center justify-center w-full rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors aspect-square',
        className,
        isDragActive && 'border-primary',
        showCropper && 'aspect-auto'
      )}
    >
      <input {...getInputProps()} />

      {isCompressing ? (
         <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-center p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-semibold">Optimizing image...</p>
        </div>
      ) : showCropper && imgSrc ? (
        <div className="w-full">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={100}
            >
              <img ref={imgRef} src={imgSrc} alt="Crop preview" onLoad={onImageLoad} className="w-full" />
            </ReactCrop>
        </div>
      ) : imgSrc ? (
        <>
            <Image src={imgSrc} alt="Image preview" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover rounded-md" data-ai-hint="product photo" />
            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-10" onClick={handleRemove}>
                <X className="h-4 w-4" />
            </Button>
            {aspectRatio && (
              <Button variant="secondary" size="sm" className="absolute bottom-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); setShowCropper(true); }}>
                  <Crop className="h-4 w-4 mr-2" />
                  Crop Image
              </Button>
            )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-center p-4">
          <Upload className="h-8 w-8" />
          <p className="text-sm font-semibold">Drop an image here, or click to select</p>
        </div>
      )}
    </div>
    {showCropper && imgSrc && (
        <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowCropper(false)}>Cancel</Button>
            <Button onClick={handleCropConfirm}>Confirm Crop</Button>
        </div>
    )}
    <canvas ref={previewCanvasRef} className="hidden" />
    </>
  );
}
