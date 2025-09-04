// Color analysis utilities for skin tone and recommendations

export interface SkinToneAnalysis {
  dominantColors: string[];
  skinToneType: 'warm' | 'cool' | 'neutral';
  undertone: string;
  skinToneLevel: {
    name: string;
    hex: string;
    number: number;
  };
  outfitPalettes: {
    name: string;
    colors: string[];
  }[];
  outfitExamples: string[];
  recommendations: {
    clothing: string[];
    makeup: string[];
    lipColors: string[];
    eyeshadow: string[];
  };
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

// Convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

// K-means clustering for color extraction
export function extractDominantColors(imageData: ImageData, k: number = 14): string[] {
  const pixels: [number, number, number][] = [];
  
  // Sample pixels (every 4th pixel for performance)
  for (let i = 0; i < imageData.data.length; i += 16) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const alpha = imageData.data[i + 3];
    
    // Skip transparent pixels and very dark/light pixels
    if (alpha > 200 && r > 30 && g > 30 && b > 30 && 
        r < 250 && g < 250 && b < 250) {
      pixels.push([r, g, b]);
    }
  }

  if (pixels.length === 0) {
    return [];
  }

  // Simple k-means implementation
  const centroids: [number, number, number][] = [];
  
  // Initialize centroids randomly
  for (let i = 0; i < k; i++) {
    const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
    centroids.push([...randomPixel]);
  }

  // Iterate k-means
  for (let iter = 0; iter < 10; iter++) {
    const clusters: [number, number, number][][] = Array(k).fill(null).map(() => []);
    
    // Assign pixels to clusters
    pixels.forEach(pixel => {
      let minDistance = Infinity;
      let closestCluster = 0;
      
      centroids.forEach((centroid, index) => {
        const distance = Math.sqrt(
          Math.pow(pixel[0] - centroid[0], 2) +
          Math.pow(pixel[1] - centroid[1], 2) +
          Math.pow(pixel[2] - centroid[2], 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = index;
        }
      });
      
      clusters[closestCluster].push(pixel);
    });
    
    // Update centroids
    clusters.forEach((cluster, index) => {
      if (cluster.length > 0) {
        const avgR = cluster.reduce((sum, p) => sum + p[0], 0) / cluster.length;
        const avgG = cluster.reduce((sum, p) => sum + p[1], 0) / cluster.length;
        const avgB = cluster.reduce((sum, p) => sum + p[2], 0) / cluster.length;
        centroids[index] = [avgR, avgG, avgB];
      }
    });
  }

  return centroids.map(([r, g, b]) => rgbToHex(r, g, b));
}

// Skin tone scale (lightest to darkest)
const SKIN_TONE_SCALE = [
  { name: 'Porcelain', hex: '#f6ede4', number: 1 },
  { name: 'Ivory', hex: '#f3e7db', number: 2 },
  { name: 'Light Beige', hex: '#f7ead0', number: 3 },
  { name: 'Warm Beige', hex: '#eadaba', number: 4 },
  { name: 'Golden Beige', hex: '#d7bd96', number: 5 },
  { name: 'Tan', hex: '#a07e56', number: 6 },
  { name: 'Medium Brown', hex: '#825c43', number: 7 },
  { name: 'Deep Brown', hex: '#604134', number: 8 },
  { name: 'Dark Espresso', hex: '#3a312a', number: 9 },
  { name: 'Ebony', hex: '#292421', number: 10 }
];

// Analyze skin tone type based on dominant colors
export function analyzeSkinTone(dominantColors: string[]): SkinToneAnalysis {
  const colorHSLs = dominantColors.map(hex => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return rgbToHsl(r, g, b);
  });

  // Calculate average lightness to map to skin tone scale
  const avgLightness = colorHSLs.reduce((sum, [, , l]) => sum + l, 0) / colorHSLs.length;
  
  // Map to skin tone scale based on lightness
  let skinToneLevel;
  if (avgLightness >= 85) skinToneLevel = SKIN_TONE_SCALE[0]; // Porcelain
  else if (avgLightness >= 80) skinToneLevel = SKIN_TONE_SCALE[1]; // Ivory
  else if (avgLightness >= 75) skinToneLevel = SKIN_TONE_SCALE[2]; // Light Beige
  else if (avgLightness >= 70) skinToneLevel = SKIN_TONE_SCALE[3]; // Warm Beige
  else if (avgLightness >= 65) skinToneLevel = SKIN_TONE_SCALE[4]; // Golden Beige
  else if (avgLightness >= 55) skinToneLevel = SKIN_TONE_SCALE[5]; // Tan
  else if (avgLightness >= 45) skinToneLevel = SKIN_TONE_SCALE[6]; // Medium Brown
  else if (avgLightness >= 35) skinToneLevel = SKIN_TONE_SCALE[7]; // Deep Brown
  else if (avgLightness >= 25) skinToneLevel = SKIN_TONE_SCALE[8]; // Dark Espresso
  else skinToneLevel = SKIN_TONE_SCALE[9]; // Ebony

  // Determine undertone based on hue analysis
  const avgHue = colorHSLs.reduce((sum, [h]) => sum + h, 0) / colorHSLs.length;

  let skinToneType: 'warm' | 'cool' | 'neutral';
  let undertone: string;

  if (avgHue >= 20 && avgHue <= 50) {
    skinToneType = 'warm';
    undertone = 'Golden/Yellow';
  } else if (avgHue >= 300 || avgHue <= 20) {
    skinToneType = 'cool';
    undertone = 'Pink/Red';
  } else {
    skinToneType = 'neutral';
    undertone = 'Balanced';
  }

  // Generate recommendations based on skin tone
  const recommendations = generateRecommendations(skinToneType);
  const outfitPalettes = generateOutfitPalettes(skinToneType, skinToneLevel.number);
  const outfitExamples = generateOutfitExamples(skinToneType, skinToneLevel.number);

  return {
    dominantColors,
    skinToneType,
    undertone,
    skinToneLevel,
    outfitPalettes,
    outfitExamples,
    recommendations
  };
}

function generateRecommendations(skinToneType: 'warm' | 'cool' | 'neutral') {
  const recommendations = {
    warm: {
      clothing: ['#8B4513', '#CD853F', '#DEB887', '#F4A460', '#D2691E', '#FF8C00'],
      makeup: ['#CD853F', '#DEB887', '#F4A460', '#DDBF94'],
      lipColors: ['#CD5C5C', '#E9967A', '#FA8072', '#FF6347'],
      eyeshadow: ['#8B4513', '#CD853F', '#DEB887', '#D2691E']
    },
    cool: {
      clothing: ['#4682B4', '#6495ED', '#87CEEB', '#B0C4DE', '#778899', '#2F4F4F'],
      makeup: ['#F8F8FF', '#E6E6FA', '#D8BFD8', '#DDA0DD'],
      lipColors: ['#DC143C', '#B22222', '#8B0000', '#FF1493'],
      eyeshadow: ['#4682B4', '#6495ED', '#9370DB', '#8A2BE2']
    },
    neutral: {
      clothing: ['#696969', '#708090', '#778899', '#2F4F4F', '#556B2F', '#8B4513'],
      makeup: ['#F5F5DC', '#FFF8DC', '#FAEBD7', '#F0E68C'],
      lipColors: ['#CD5C5C', '#BC8F8F', '#F08080', '#E9967A'],
      eyeshadow: ['#CD853F', '#BC8F8F', '#D2B48C', '#DEB887']
    }
  };

  return recommendations[skinToneType];
}

function generateOutfitPalettes(skinToneType: 'warm' | 'cool' | 'neutral', skinLevel: number) {
  const basePalettes = {
    warm: [
      { name: 'Earth Tones', colors: ['#8B4513', '#D2691E', '#F4A460', '#DEB887', '#FFFFFF'] },
      { name: 'Autumn Spice', colors: ['#B22222', '#FF8C00', '#DAA520', '#CD853F', '#F5F5DC'] },
      { name: 'Golden Hour', colors: ['#FFD700', '#FF6347', '#CD853F', '#F4A460', '#FFFAF0'] },
      { name: 'Desert Sunset', colors: ['#FF4500', '#FF8C00', '#DEB887', '#F5DEB3', '#FFFFFF'] }
    ],
    cool: [
      { name: 'Ocean Blues', colors: ['#000080', '#4682B4', '#87CEEB', '#E0F6FF', '#FFFFFF'] },
      { name: 'Berry Elegance', colors: ['#8B008B', '#DC143C', '#FFB6C1', '#F8F8FF', '#000000'] },
      { name: 'Winter Frost', colors: ['#2F4F4F', '#708090', '#B0C4DE', '#F0F8FF', '#FFFFFF'] },
      { name: 'Jewel Tones', colors: ['#4B0082', '#008B8B', '#9370DB', '#E6E6FA', '#FFFFFF'] }
    ],
    neutral: [
      { name: 'Classic Neutrals', colors: ['#000000', '#696969', '#D3D3D3', '#F5F5F5', '#FFFFFF'] },
      { name: 'Sage & Stone', colors: ['#556B2F', '#808080', '#D2B48C', '#F5F5DC', '#FFFFFF'] },
      { name: 'Modern Minimalist', colors: ['#2F4F4F', '#778899', '#B0C4DE', '#F8F8FF', '#FFFFFF'] },
      { name: 'Warm Greys', colors: ['#8B4513', '#696969', '#BC8F8F', '#F5F5DC', '#FFFFFF'] }
    ]
  };

  // Adjust palettes based on skin level (lighter vs darker tones)
  let palettes = basePalettes[skinToneType];
  
  // For darker skin tones (7-10), add richer, more vibrant options
  if (skinLevel >= 7) {
    if (skinToneType === 'warm') {
      palettes.push({ name: 'Rich Jewels', colors: ['#800080', '#FF6347', '#DAA520', '#F4A460', '#FFFAF0'] });
    } else if (skinToneType === 'cool') {
      palettes.push({ name: 'Royal Blues', colors: ['#000080', '#8B008B', '#DC143C', '#FFB6C1', '#FFFFFF'] });
    }
  }
  
  return palettes.slice(0, 4); // Return 4 palettes
}

function generateOutfitExamples(skinToneType: 'warm' | 'cool' | 'neutral', skinLevel: number) {
  const examples = {
    warm: [
      "Terracotta blazer with cream trousers and gold accessories",
      "Olive green sweater with dark denim jeans and brown leather boots"
    ],
    cool: [
      "Navy blue blouse with grey tailored pants and silver jewelry", 
      "Emerald green dress with black heels and pearl accessories"
    ],
    neutral: [
      "Charcoal grey suit with white shirt and black leather shoes",
      "Sage green cardigan with beige chinos and tan loafers"
    ]
  };

  // Add darker skin tone specific examples
  if (skinLevel >= 7) {
    if (skinToneType === 'warm') {
      examples.warm.push("Bold orange top with dark chocolate brown pants and gold statement jewelry");
    } else if (skinToneType === 'cool') {
      examples.cool.push("Rich purple blouse with black trousers and silver metallic accessories");
    }
  }

  return examples[skinToneType].slice(0, 2);
}

// Detect face region in image (simplified approach)
export function detectFaceRegion(canvas: HTMLCanvasElement): ImageData | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // For now, we'll analyze the center portion of the image as a face region
  // In a real implementation, you'd use a face detection library
  const centerX = Math.floor(canvas.width * 0.3);
  const centerY = Math.floor(canvas.height * 0.2);
  const width = Math.floor(canvas.width * 0.4);
  const height = Math.floor(canvas.height * 0.6);

  return ctx.getImageData(centerX, centerY, width, height);
}