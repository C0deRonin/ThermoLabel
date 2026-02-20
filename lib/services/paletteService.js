export const PALETTES = {
  original: [[0, 0, 0], [255, 255, 255]],
  iron: [[0,0,0],[28,0,58],[58,0,100],[100,0,120],[140,0,100],[180,20,60],[220,60,20],[255,120,0],[255,180,0],[255,230,50],[255,255,180],[255,255,255]],
  rainbow: [[0,0,139],[0,0,255],[0,100,255],[0,200,200],[0,255,100],[100,255,0],[200,255,0],[255,200,0],[255,100,0],[255,0,0],[200,0,0],[139,0,0]],
  grayscale: Array.from({ length: 12 }, (_, i) => { const v = Math.round(i * 23); return [v, v, v]; }),
  hotspot: [[0,0,50],[0,0,120],[0,60,200],[0,150,255],[0,255,200],[100,255,100],[200,255,0],[255,200,0],[255,100,0],[255,0,0],[200,0,50],[150,0,100]],
  arctic: [[10,10,80],[20,40,160],[30,100,220],[60,180,240],[120,220,255],[200,240,255],[255,255,255],[255,240,200],[255,200,120],[255,140,40],[220,60,0],[140,0,0]],
  viridis: [[68,1,84],[71,44,122],[59,81,139],[44,113,142],[33,144,141],[39,173,129],[92,200,99],[170,220,50],[253,231,37]],
};

export const getPalette = (name = "iron") => PALETTES[name] || PALETTES.iron;
export const getPalettes = () => Object.keys(PALETTES);
export const getPaletteNames = getPalettes;

export function applyPalette(input, palette = "iron") {
  if (typeof input === "number") {
    const p = Array.isArray(palette) ? palette : getPalette(palette);
    const idxFloat = (Math.max(0, Math.min(255, input)) / 255) * (p.length - 1);
    const idx = Math.floor(idxFloat);
    const t = idxFloat - idx;
    const c0 = p[idx];
    const c1 = p[Math.min(idx + 1, p.length - 1)];
    return {
      r: Math.round(c0[0] + (c1[0] - c0[0]) * t),
      g: Math.round(c0[1] + (c1[1] - c0[1]) * t),
      b: Math.round(c0[2] + (c1[2] - c0[2]) * t),
    };
  }

  const raw = input;
  if (!(raw instanceof Uint8ClampedArray)) return new Uint8ClampedArray();
  if (palette === "original") return raw;

  const p = Array.isArray(palette) ? palette : getPalette(palette);
  const result = new Uint8ClampedArray(raw.length);
  for (let i = 0; i < raw.length; i += 4) {
    const isGray = raw[i] === raw[i + 1] && raw[i + 1] === raw[i + 2];
    const gray = isGray ? raw[i] : Math.round(raw[i] * 0.299 + raw[i + 1] * 0.587 + raw[i + 2] * 0.114);
    const { r, g, b } = applyPalette(gray, p);
    result[i] = r; result[i + 1] = g; result[i + 2] = b; result[i + 3] = raw[i + 3] ?? 255;
  }
  return result;
}
