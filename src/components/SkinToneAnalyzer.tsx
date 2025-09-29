import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadZone } from '@/components/ui/upload-zone';
import { ColorSwatch } from '@/components/ui/color-swatch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { extractDominantColors, analyzeSkinTone, detectFaceRegion, detectFaceInImage, type SkinToneAnalysis } from '@/lib/color-analysis';
import { Palette, Sparkles, Shirt, Zap, Crown, Watch } from 'lucide-react';

export const SkinToneAnalyzer: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SkinToneAnalysis | null>(null);
  const [error, setError] = useState<string>('');
  const [gender, setGender] = useState<'women' | 'men'>('women');

  const processImage = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      // Create image element
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Load image
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // First, detect if there's a human face in the image
      const faceDetected = await detectFaceInImage(img);
      
      if (!faceDetected) {
        throw new Error('Upload failed. Please provide an image with a clear human face.');
      }

      // Detect face region (simplified - using center portion)
      const faceImageData = detectFaceRegion(canvas);
      
      if (!faceImageData) {
        throw new Error('Could not detect face region in the image');
      }

      // Extract dominant colors
      const dominantColors = extractDominantColors(faceImageData, 14);
      
      if (dominantColors.length === 0) {
        throw new Error('Could not extract skin tone colors from the image');
      }

      // Analyze skin tone
      const skinAnalysis = analyzeSkinTone(dominantColors);
      setAnalysis(skinAnalysis);

    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    processImage(file);
  }, [processImage]);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage('');
    setAnalysis(null);
    setError('');
  }, []);

  const handleRetry = useCallback(() => {
    if (uploadedImage) {
      fetch(uploadedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'uploaded-image.jpg', { type: blob.type });
          processImage(file);
        })
        .catch(err => {
          console.error('Error retrying analysis:', err);
          setError('Failed to retry analysis');
        });
    }
  }, [uploadedImage, processImage]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-full shadow-soft">
              <Palette className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ChromaTone
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your AI personal styling assistant. Upload your photo to discover your skin tone and get expert outfit color palette recommendations.
          </p>
        </div>

        <div className="grid gap-8 max-w-6xl mx-auto">
          {/* Upload Section */}
          <Card className="shadow-card bg-gradient-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Upload Your Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UploadZone
                onImageUpload={handleImageUpload}
                uploadedImage={uploadedImage}
                onRemoveImage={handleRemoveImage}
                className="h-64"
              />
              
              {error && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm">{error}</p>
                  {uploadedImage && (
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Retry Analysis
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {isAnalyzing && (
            <Card className="shadow-card bg-gradient-card border-0">
              <CardContent className="py-12">
                <LoadingSpinner
                  size="lg"
                  text="Analyzing your skin tone..."
                  className="text-center"
                />
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {analysis && (
            <div className="grid gap-6">
              {/* Skin Tone Detection */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Skin Tone Detected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h3 className="text-xl font-bold">{analysis.skinToneLevel.name}</h3>
                      <p className="text-muted-foreground">
                        {analysis.skinToneLevel.hex} • Level {analysis.skinToneLevel.number}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Undertone:</strong> {analysis.undertone} ({analysis.skinToneType})
                      </p>
                    </div>
                    <ColorSwatch
                      color={analysis.skinToneLevel.hex}
                      size="lg"
                      showHex={false}
                    />
                  </div>
                </CardContent>
              </Card>


              {/* Gender-Specific Outfit Examples */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Example Outfit Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.genderSpecificOutfits && gender === 'women' && analysis.genderSpecificOutfits.women?.map((example, index) => (
                      <div key={index} className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-foreground font-medium">{example}</p>
                      </div>
                    ))}
                    {analysis.genderSpecificOutfits && gender === 'men' && analysis.genderSpecificOutfits.men?.map((example, index) => (
                      <div key={index} className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-foreground font-medium">{example}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gender Selection */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Style Recommendations For
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={gender} onValueChange={(value: 'women' | 'men') => setGender(value)} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="women" id="women" />
                      <Label htmlFor="women">Women</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="men" id="men" />
                      <Label htmlFor="men">Men</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Perfect Upper Wear Colors */}
              <Card className="shadow-card bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shirt className="h-5 w-5 text-primary" />
                    Perfect Upper Wear Colors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {analysis.upperWearColors.map((color, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: color.hex }}
                          />
                        </div>
                        <p className="text-sm font-medium">{color.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gender-Specific Accessory Recommendations */}
              <div className="grid md:grid-cols-2 gap-6">
                {analysis.genderSpecificRecommendations && (
                  <Card className="shadow-card bg-gradient-card border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {gender === 'women' ? <Crown className="h-5 w-5 text-primary" /> : <Watch className="h-5 w-5 text-primary" />}
                        Accessory Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {gender === 'women' && analysis.genderSpecificRecommendations.women && (
                        <>
                          <div>
                            <h4 className="font-medium mb-3 text-sm text-muted-foreground">💎 Jewelry</h4>
                            <div className="space-y-2">
                              {analysis.genderSpecificRecommendations.women.jewelry.map((item, index) => (
                                <div key={index} className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-sm">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-3 text-sm text-muted-foreground">👜 Handbags</h4>
                            <div className="space-y-2">
                              {analysis.genderSpecificRecommendations.women.handbags.map((item, index) => (
                                <div key={index} className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-sm">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-3 text-sm text-muted-foreground">👠 Shoes</h4>
                            <div className="space-y-2">
                              {analysis.genderSpecificRecommendations.women.shoes.map((item, index) => (
                                <div key={index} className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-sm">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {gender === 'men' && analysis.genderSpecificRecommendations.men && (
                        <>
                          <div>
                            <h4 className="font-medium mb-3 text-sm text-muted-foreground">⌚ Watches</h4>
                            <div className="space-y-2">
                              {analysis.genderSpecificRecommendations.men.watches.map((item, index) => (
                                <div key={index} className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-sm">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-3 text-sm text-muted-foreground">👞 Shoes</h4>
                            <div className="space-y-2">
                              {analysis.genderSpecificRecommendations.men.shoes.map((item, index) => (
                                <div key={index} className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-sm">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-3 text-sm text-muted-foreground">🎗️ Belts</h4>
                            <div className="space-y-2">
                              {analysis.genderSpecificRecommendations.men.belts.map((item, index) => (
                                <div key={index} className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-sm">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Makeup Colors - Optional (Women only) */}
                {analysis.recommendations && gender === 'women' && (
                  <Card className="shadow-card bg-gradient-card border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Optional Makeup & Beauty Colors
                      </CardTitle>
                    </CardHeader>
                   <CardContent className="space-y-6">
                     {/* Base Makeup */}
                     <div>
                       <h4 className="font-medium mb-3 text-sm text-muted-foreground">Foundation & Base</h4>
                       <div className="grid grid-cols-2 gap-3">
                         {analysis.recommendations.makeup.map((colorName, index) => (
                           <div key={index} className="p-2 bg-muted/50 rounded-lg text-center">
                             <p className="text-sm font-medium">{colorName}</p>
                           </div>
                         ))}
                       </div>
                     </div>

                     {/* Lip Colors */}
                     <div>
                       <h4 className="font-medium mb-3 text-sm text-muted-foreground">Lip Colors</h4>
                       <div className="grid grid-cols-2 gap-3">
                         {analysis.recommendations.lipColors.map((colorName, index) => (
                           <div key={index} className="p-2 bg-muted/50 rounded-lg text-center">
                             <p className="text-sm font-medium">{colorName}</p>
                           </div>
                         ))}
                       </div>
                     </div>

                     {/* Eyeshadow */}
                     <div>
                       <h4 className="font-medium mb-3 text-sm text-muted-foreground">Eyeshadow Palette</h4>
                       <div className="grid grid-cols-2 gap-3">
                         {analysis.recommendations.eyeshadow.map((colorName, index) => (
                           <div key={index} className="p-2 bg-muted/50 rounded-lg text-center">
                             <p className="text-sm font-medium">{colorName}</p>
                           </div>
                         ))}
                       </div>
                     </div>
                   </CardContent>
                </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};