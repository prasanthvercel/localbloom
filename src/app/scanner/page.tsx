
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, ScanLine, Sparkles, Languages, HeartPulse, Apple, Check, X, Upload } from 'lucide-react';
import { analyzeProductImage, type AnalyzeProductImageOutput } from '@/ai/flows/analyze-product-image-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { SubscriptionPromptDialog } from '@/components/scanner/SubscriptionPromptDialog';
import { Separator } from '@/components/ui/separator';
import { AddToDietDialog } from '@/components/scanner/AddToDietDialog';

export default function ScannerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [remainingScans, setRemainingScans] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<{ title: string; description: string } | null>(null);
  
  const [captureState, setCaptureState] = useState<'idle' | 'captured'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<AnalyzeProductImageOutput | null>(null);
  const [language, setLanguage] = useState('English');
  
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [itemToLog, setItemToLog] = useState<{name: string, nutrition: AnalyzeProductImageOutput['nutrition']} | null>(null);


  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
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
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
             setCameraError({ title: 'Camera Access Denied', description: 'Please allow camera access in your browser settings to use this feature.' });
          } else if (error.name !== 'NotFoundError') { // Don't show an error if camera is just not found
             setCameraError({ title: 'Camera Error', description: `An unexpected error occurred: ${error.message}` });
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
        
      const { data: profile } = await supabase.from('profiles').select('subscription_tier, scan_count, last_scan_date').eq('id', user.id).single();
      
      const isSubscribed = profile?.subscription_tier && profile.subscription_tier !== 'free';

      if (isSubscribed) {
        setRemainingScans(Infinity); // Subscribed users have unlimited scans
      } else {
        // FOR TESTING: Set to 0 to force subscription prompt.
        setRemainingScans(0);
      }
      setIsInitializing(false);
    };

    initializeScanner();
    
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [supabase, router]);

  const analyzeImage = async (photoDataUri: string) => {
    if (!user) return;
    
    if (remainingScans <= 0) {
      setShowSubscriptionPrompt(true);
      setCaptureState('idle'); // Go back to camera view
      setCapturedImage(null);
      return;
    }

    setIsLoading(true);

    try {
      const result = await analyzeProductImage({ photoDataUri, language, userId: user.id });
      setAnalysisResult(result);

      if (result.productName) {
        setRemainingScans(prev => Math.max(0, prev - 1));
        toast({ title: 'Analysis Complete!', description: `Identified: ${result.productName}.` });
        if (result.isFoodItem && result.nutrition) {
            setItemToLog({ name: result.productName, nutrition: result.nutrition });
        }
      } else {
         toast({ variant: 'destructive', title: 'Analysis Failed', description: "We couldn't identify the item in the image. Please try a clearer picture." });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Analysis Failed', description: error instanceof Error ? error.message : 'Could not analyze the image. Please try again.' });
    } finally {
      setIsLoading(false);
      setCaptureState('idle');
      setCapturedImage(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setAnalysisResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const photoDataUri = canvas.toDataURL('image/jpeg');
        setCapturedImage(photoDataUri);
        setCaptureState('captured');
    }
  };
  
  const handleRetake = () => {
    setCapturedImage(null);
    setCaptureState('idle');
  };

  const handleConfirmAndAnalyze = () => {
    if (capturedImage) {
        analyzeImage(capturedImage);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoDataUri = e.target?.result as string;
            setCapturedImage(photoDataUri);
            setCaptureState('captured');
            setAnalysisResult(null);
        };
        reader.readAsDataURL(file);
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
          {captureState === 'captured' && capturedImage ? (
             <Image src={capturedImage} alt="Captured product" fill className="object-cover" />
          ) : (
            <>
              {hasCameraPermission ? (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                    <Upload className="h-16 w-16 mb-4" />
                    <p className="font-semibold text-lg">Upload an Image</p>
                    <p className="text-sm">No camera detected. Please upload a file.</p>
                </div>
              )}
            </>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-lg font-semibold">Analyzing Image...</p>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
         <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
        />

        {captureState === 'idle' ? (
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
            {hasCameraPermission ? (
                <Button onClick={handleCapture} disabled={isLoading || !user} className="w-full sm:w-1/2 h-16 text-lg sm:self-end">
                  <Camera className="mr-2 h-6 w-6" /> Capture Image
                </Button>
            ) : (
                 <Button onClick={handleUploadClick} disabled={isLoading || !user} className="w-full sm:w-1/2 h-16 text-lg sm:self-end">
                    <Upload className="mr-2 h-6 w-6" /> Upload Image
                </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button onClick={handleRetake} variant="outline" size="lg" className="w-full sm:w-auto">
                <X className="mr-2 h-5 w-5"/> {hasCameraPermission ? 'Retake' : 'Choose another image'}
             </Button>
             <Button onClick={handleConfirmAndAnalyze} size="lg" className="w-full sm:w-auto">
                <Check className="mr-2 h-5 w-5"/> Analyze with AI
             </Button>
          </div>
        )}
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
                Point your camera at an item and capture an image to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderContent()}

              {analysisResult && analysisResult.productName && (
                  <Card className="bg-muted/50">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Analysis Result</CardTitle>
                          <CardDescription>Product identified as: <span className="font-bold text-foreground">{analysisResult.productName}</span></CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm">{analysisResult.description}</p>
                        
                        {analysisResult.isFoodItem && analysisResult.nutrition && (
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

                        {analysisResult.isFoodItem && analysisResult.personalizedAdvice && (
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
                            <h3 className="text-lg font-semibold leading-none tracking-tight">Available in the Marketplace</h3>
                             {analysisResult.isFoodItem && user?.user_metadata?.role === 'customer' && analysisResult.nutrition && (
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
