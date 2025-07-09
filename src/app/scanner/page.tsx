'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, ScanLine, Sparkles, Languages } from 'lucide-react';
import { analyzeProductImage } from '@/ai/flows/analyze-product-image-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// This is a placeholder for a real subscription check
const useSubscription = () => ({ isSubscribed: true, loading: false });

export default function ScannerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isSubscribed, loading: subscriptionLoading } = useSubscription();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ productName: string; description: string } | null>(null);
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    // Redirect if user is not subscribed
    if (!subscriptionLoading && !isSubscribed) {
      toast({
        variant: 'destructive',
        title: 'Subscription Required',
        description: 'You need an active subscription to use the product scanner.',
      });
      router.push('/');
    }

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    if (isSubscribed) {
        getCameraPermission();
    }
    
    // Cleanup function to stop video stream
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [isSubscribed, subscriptionLoading, router, toast]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    setAnalysisResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await analyzeProductImage({ photoDataUri, language });
      if (result.isFoodItem) {
        setAnalysisResult({
          productName: result.productName,
          description: result.description,
        });
        toast({
          title: 'Analysis Complete!',
          description: `Identified: ${result.productName}.`,
        });
      } else {
         toast({
            variant: 'destructive',
            title: 'Not a Food Item',
            description: 'The scanner is currently optimized for food items. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the image. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchForProduct = () => {
    if (analysisResult) {
        router.push(`/products?q=${encodeURIComponent(analysisResult.productName)}`);
    }
  }

  if (subscriptionLoading) {
    return (
         <div className="flex flex-col min-h-screen bg-secondary/30">
            <Header />
            <main className="flex-grow container mx-auto flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2"><ScanLine className="text-primary"/> Product Scanner</CardTitle>
            <CardDescription>
              Use your camera to scan a product and get instant details. Powered by AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <Camera className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  This feature needs camera access. Please update your browser permissions and refresh the page.
                </AlertDescription>
              </Alert>
            )}

            {hasCameraPermission && (
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
                        <Label htmlFor="language-select" className="flex items-center gap-2 text-muted-foreground"><Languages/> Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger id="language-select">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
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
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <><Camera className="mr-2 h-6 w-6" /> Scan Product</>
                      )}
                    </Button>
                </div>
              </div>
            )}

            {analysisResult && (
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Analysis Result</CardTitle>
                        <CardDescription>Product identified as: <span className="font-bold text-foreground">{analysisResult.productName}</span></CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{analysisResult.description}</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={searchForProduct} className="w-full">Search for this product</Button>
                    </CardFooter>
                </Card>
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
