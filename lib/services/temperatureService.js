export const rawToTemp = (raw) => -20 + (Math.max(0, Math.min(255, raw)) / 255) * 140;
export const tempToRaw = (temp) => Math.max(0, Math.min(255, ((temp + 20) / 140) * 255));

export function getAreaStats(rawOrPixels, width, x, y, w, h) {
  if (Array.isArray(rawOrPixels)) {
    if (!rawOrPixels.length) return { mean: 0, min: 0, max: 0 };
    const sum = rawOrPixels.reduce((a, b) => a + b, 0);
    return { mean: sum / rawOrPixels.length, min: Math.min(...rawOrPixels), max: Math.max(...rawOrPixels) };
  }

  const raw = rawOrPixels;
  if (!raw || !raw.length || !width) return { mean: 0, min: 0, max: 0 };
  let sum = 0; let min = 255; let max = 0; let count = 0;
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(width - 1, Math.floor(x + w));
  const height = Math.floor(raw.length / 4 / width);
  const y1 = Math.min(height - 1, Math.floor(y + h));

  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const v = raw[(py * width + px) * 4];
      sum += v; min = Math.min(min, v); max = Math.max(max, v); count++;
    }
  }

  if (!count) return { mean: 0, min: 0, max: 0 };
  return { mean: rawToTemp(sum / count), min: rawToTemp(min), max: rawToTemp(max) };
}

export function calculateHistogram(pixels) {
  const bins = new Array(64).fill(0);
  for (const px of pixels || []) bins[Math.min(63, Math.floor(px / 4))]++;
  return bins;
}
