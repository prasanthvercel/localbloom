'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, ScanLine, Sparkles, Languages, Info } from 'lucide-react';
import { analyzeProductImage } from '@/ai/flows/analyze-product-image-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { SubscriptionPromptDialog } from '@/components/scanner/SubscriptionPromptDialog';
import Link from 'next/link';

export default function ScannerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [remainingScans, setRemainingScans] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsage, setIsCheckingUsage] = useState(true);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<{ title: string; description: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ productName: string; description: string } | null>(null);
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError({ title: 'Camera Not Supported', description: 'Your browser does not support camera access.' });
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
        if (error instanceof DOMException) {
          if (error.name === 'NotFoundError') {
            setCameraError({ title: 'Camera Not Found', description: 'No camera was found on your device.' });
          } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setCameraError({ title: 'Camera Access Denied', description: 'Please allow camera access in your browser settings.' });
          } else {
            setCameraError({ title: 'Camera Error', description: `Could not access the camera: ${error.message}` });
          }
        } else {
          setCameraError({ title: 'Unexpected Error', description: 'An error occurred accessing the camera.' });
        }
      }
    };

    const checkUserAndUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await getCameraPermission();
        const { data: profile } = await supabase.from('profiles').select('scan_count, last_scan_date').eq('id', user.id).single();
        
        if (profile) {
          const today = new Date();
          const lastScan = profile.last_scan_date ? new Date(profile.last_scan_date) : null;
          let currentScanCount = profile.scan_count || 0;

          if (lastScan && (lastScan.getMonth() !== today.getMonth() || lastScan.getFullYear() !== today.getFullYear())) {
            currentScanCount = 0;
          }
          setRemainingScans(Math.max(0, 3 - currentScanCount));
        } else {
          setRemainingScans(3);
        }
      }
      setIsCheckingUsage(false);
    };

    checkUserAndUsage();
    
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [supabase]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;
    
    if (remainingScans <= 0) {
      setShowSubscriptionPrompt(true);
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await analyzeProductImage({ photoDataUri, language, userId: user.id });
      if (result.isFoodItem) {
        setAnalysisResult({ productName: result.productName, description: result.description });
        setRemainingScans(prev => Math.max(0, prev - 1));
        toast({ title: 'Analysis Complete!', description: `Identified: ${result.productName}.` });
      } else {
         toast({ variant: 'destructive', title: 'Not a Food Item', description: 'The scanner is optimized for food items. Please try again.' });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: error instanceof Error ? error.message : 'Could not analyze the image. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const searchForProduct = () => {
    if (analysisResult) {
        router.push(`/products?q=${encodeURIComponent(analysisResult.productName)}`);
    }
  }

  const renderContent = () => {
    if (isCheckingUsage) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!user) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Please Log In</AlertTitle>
          <AlertDescription>
            You need to be logged in to use the product scanner. <Link href="/login" className="font-bold underline">Login here</Link>.
          </AlertDescription>
        </Alert>
      );
    }

    if (hasCameraPermission === false && cameraError) {
      return (
        <Alert variant="destructive">
          <Camera className="h-4 w-4" />
          <AlertTitle>{cameraError.title}</AlertTitle>
          <AlertDescription>{cameraError.description}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-lg font-semibold">Analyzing Image...</p>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-1/2 space-y-2">
            <Label htmlFor="language-select" className="flex items-center gap-2 text-muted-foreground"><Languages /> Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language-select"><SelectValue placeholder="Select language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="German">German</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={captureAndAnalyze} disabled={isLoading} className="w-full sm:w-1/2 h-16 text-lg sm:self-end">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Camera className="mr-2 h-6 w-6" /> Scan Product</>}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <SubscriptionPromptDialog isOpen={showSubscriptionPrompt} setIsOpen={setShowSubscriptionPrompt} />
      <div className="flex flex-col min-h-screen bg-secondary/30">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2"><ScanLine className="text-primary"/> Product Scanner</CardTitle>
              <CardDescription>
                You have <span className="font-bold text-primary">{remainingScans}</span> free scan(s) remaining this month.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderContent()}

              {analysisResult && (
                  <Card className="bg-muted/50">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Analysis Result</CardTitle>
                          <CardDescription>Product identified as: <span className="font-bold text-foreground">{analysisResult.productName}</span></CardDescription>
                      </CardHeader>
                      <CardContent><p className="text-sm">{analysisResult.description}</p></CardContent>
                      <CardFooter><Button onClick={searchForProduct} className="w-full">Search for this product</Button></CardFooter>
                  </Card>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
