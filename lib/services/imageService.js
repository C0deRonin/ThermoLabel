export function generateThermalDemo(W, H) {
  const data = new Uint8ClampedArray(W * H * 4);
  const nr = (s) => { const v = Math.sin(s) * 43758.5453; return v - Math.floor(v); };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let v = 75 + Math.sin(x * 0.018) * 28 + Math.cos(y * 0.013) * 22 + Math.sin((x + y) * 0.009) * 15;
      const spots = [[0.72,0.22,130,0.7],[0.38,0.58,95,0.55],[0.55,0.35,70,0.8]];
      for (const [sx, sy, amp, dec] of spots) {
        const dx = x - W * sx; const dy = y - H * sy;
        v += Math.max(0, amp - Math.sqrt(dx * dx + dy * dy) * dec);
      }
      v += (nr(x * 73 + y * 37) - 0.5) * 8;
      v = Math.max(0, Math.min(255, v));
      data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
    }
  }
  return data;
}

export function loadImageAsGrayscale(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const raw = new Uint8ClampedArray(imageData.data.length);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const gray = Math.round(imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114);
          raw[i] = gray; raw[i + 1] = gray; raw[i + 2] = gray; raw[i + 3] = imageData.data[i + 3];
        }
        resolve({ raw, width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function parseFlirData() {
  return { success: false };
}
