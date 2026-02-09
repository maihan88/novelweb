import { useState, useEffect } from 'react';
import { Vibrant } from 'node-vibrant/browser';

interface PaletteColors {
  vibrant?: string;
  lightVibrant?: string;
  darkVibrant?: string;
  muted?: string;
  lightMuted?: string;
  darkMuted?: string;
}

export const usePalette = (imageUrl: string) => {
  const [palette, setPalette] = useState<PaletteColors>({});

  useEffect(() => {
    if (!imageUrl) return;
    Vibrant.from(imageUrl)
      .getPalette()
      .then((p: any) => {
        setPalette({
          vibrant: p.Vibrant?.hex,
          lightVibrant: p.LightVibrant?.hex,
          darkVibrant: p.DarkVibrant?.hex,
          muted: p.Muted?.hex,
          lightMuted: p.LightMuted?.hex,
          darkMuted: p.DarkMuted?.hex,
        });
      })
      .catch((err: any) => {
        console.warn('Failed to extract colors', err);
      });
  }, [imageUrl]);

  return { data: palette };
};