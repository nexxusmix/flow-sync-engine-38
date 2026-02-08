export const BANNER_STYLES = [
  { 
    id: 'texture_pattern', 
    label: 'Textura Pattern', 
    prompt: 'Abstract geometric texture pattern with subtle film grain, repeating shapes, mathematical precision' 
  },
  { 
    id: 'solid_gradient', 
    label: 'Gradiente', 
    prompt: 'Smooth cinematic gradient background transitioning from deep black to dark cyan, soft color blend' 
  },
  { 
    id: '3d_abstract', 
    label: '3D Abstrato', 
    prompt: '3D abstract floating shapes with metallic and glass materials, depth of field, volumetric lighting, octane render style' 
  },
  { 
    id: 'minimal_lines', 
    label: 'Linhas Minimalistas', 
    prompt: 'Minimal elegant line art with geometric patterns on dark background, thin strokes, architectural precision' 
  },
  { 
    id: 'noise_grain', 
    label: 'Ruído Film', 
    prompt: 'Film grain noise texture with analog photography aesthetic, subtle color cast, 35mm film grain' 
  },
  { 
    id: 'dark_cinematic', 
    label: 'Cinematográfico', 
    prompt: 'Dark cinematic atmosphere with fog, volumetric light rays, moody ambiance, anamorphic lens flare' 
  },
] as const;

export type BannerStyleId = typeof BANNER_STYLES[number]['id'];
