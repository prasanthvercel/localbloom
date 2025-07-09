
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, ScanLine, Sparkles, Languages, HeartPulse, Apple } from 'lucide-react';
import { analyzeProductImage, type AnalyzeProductImageOutput } from '@/ai/flows/analyze-product-image-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { SubscriptionPromptDialog } from '@/components/scanner/SubscriptionPromptDialog';
import { Separator } from '@/components/ui/separator';
import { AddToDietDialog } from '@/components/scanner/AddToDietDialog';

const FREE_SCAN_LIMIT = 3;

export default function ScannerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [remainingScans, setRemainingScans] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<{ title: string; description: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeProductImageOutput | null>(null);
  const [language, setLanguage] = useState('English');
  
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [itemToLog, setItemToLog] = useState<{name: string, nutrition: AnalyzeProductImageOutput['nutrition']} | null>(null);


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

    const initializeScanner = async () => {
      setIsInitializing(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/scanner/gate');
        return;
      }
      
      setUser(user);
      
      await getCameraPermission();
        
      const { data: profile } = await supabase.from('profiles').select('scan_count, last_scan_date').eq('id', user.id).single();
      
      let currentScanCount = 0;
      if (profile) {
        const today = new Date();
        const lastScan = profile.last_scan_date ? new Date(profile.last_scan_date) : null;
        currentScanCount = profile.scan_count || 0;

        if (lastScan && (lastScan.getMonth() !== today.getMonth() || lastScan.getFullYear() !== today.getFullYear())) {
          currentScanCount = 0;
        }
      }
      setRemainingScans(0);

      setIsInitializing(false);
    };

    initializeScanner();
    
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [supabase, router]);

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
      setAnalysisResult(result);

      if (result.isFoodItem) {
        setRemainingScans(prev => Math.max(0, prev - 1));
        toast({ title: 'Analysis Complete!', description: `Identified: ${result.productName}.` });
        if (result.nutrition) {
            setItemToLog({ name: result.productName, nutrition: result.nutrition });
        }
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

  const renderContent = () => {
    if (isInitializing) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
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

          <Button onClick={captureAndAnalyze} disabled={isLoading || !user} className="w-full sm:w-1/2 h-16 text-lg sm:self-end">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Camera className="mr-2 h-6 w-6" /> Scan Product</>}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <SubscriptionPromptDialog isOpen={showSubscriptionPrompt} setIsOpen={setShowSubscriptionPrompt} />
      <AddToDietDialog
        isOpen={showLogDialog}
        setIsOpen={setShowLogDialog}
        foodName={itemToLog?.name || ''}
        nutrition={itemToLog?.nutrition || null}
      />
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

              {analysisResult && analysisResult.isFoodItem && (
                  <Card className="bg-muted/50">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Analysis Result</CardTitle>
                          <CardDescription>Product identified as: <span className="font-bold text-foreground">{analysisResult.productName}</span></CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm">{analysisResult.description}</p>
                        
                        {analysisResult.nutrition && (
                            <Alert>
                                <AlertTitle className="font-bold">Nutritional Information (per serving)</AlertTitle>
                                <AlertDescription>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <span>Calories: {analysisResult.nutrition.calories.toFixed(0)} kcal</span>
                                        <span>Protein: {analysisResult.nutrition.protein.toFixed(0)}g</span>
                                        <span>Carbs: {analysisResult.nutrition.carbs.toFixed(0)}g</span>
                                        <span>Fat: {analysisResult.nutrition.fat.toFixed(0)}g</span>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {analysisResult.personalizedAdvice && (
                            <Alert className="mt-4 border-primary/50 bg-primary/10">
                                <HeartPulse className="h-4 w-4 text-primary" />
                                <AlertTitle className="text-primary font-bold">Personalized Advice</AlertTitle>
                                <AlertDescription className="text-primary/90">
                                    {analysisResult.personalizedAdvice}
                                </AlertDescription>
                            </Alert>
                        )}
                      </CardContent>
                      
                       <Separator className="my-0" />
                       <div className="px-6 py-4 space-y-4">
                         <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <h3 className="text-lg font-semibold leading-none tracking-tight">Price Comparison</h3>
                             {user?.user_metadata?.role === 'customer' && analysisResult.nutrition && (
                                <Button variant="outline" size="sm" onClick={() => setShowLogDialog(true)}>
                                    <Apple className="mr-2 h-4 w-4" /> Add to Diet Log
                                </Button>
                             )}
                         </div>
                        {analysisResult.foundProducts.length > 0 ? (
                          <div className="space-y-3">
                            {analysisResult.foundProducts.map((product) => (
                              <Link href={`/products/${product.id}`} key={product.id} className="block group">
                                <div className="flex items-center gap-4 rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm">
                                  <Image 
                                    src={product.image || 'https://placehold.co/100x100.png'} 
                                    alt={product.name} 
                                    width={48} 
                                    height={48}
                                    className="rounded-md object-cover border"
                                    data-ai-hint="product photo"
                                  />
                                  <div className="flex-grow">
                                    <p className="font-semibold text-card-foreground group-hover:text-primary">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">{product.vendorName}</p>
                                  </div>
                                  <div className="text-lg font-bold text-primary">₹{product.price.toFixed(2)}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                              Could not find a matching product in the marketplace.
                          </p>
                        )}
                      </div>
                  </Card>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
