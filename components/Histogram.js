// components/Histogram.js
// Компонент для отображения гистограммы температур

import { useRef, useEffect } from "react";
import { calculateHistogram } from "@/lib/services/temperatureService";
import { PALETTES } from "@/lib/services/paletteService";

export default function Histogram({ raw }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!raw || !ref.current) return;

    const c = ref.current;
    const ctx = c.getContext("2d");
    const bins = calculateHistogram(raw);
    const maxB = Math.max(...bins);

    ctx.fillStyle = "#050608";
    ctx.fillRect(0, 0, c.width, c.height);

    bins.forEach((v, i) => {
      const t = i / 64;
      const fi = t * (PALETTES.iron.length - 1);
      const ci = Math.floor(fi);
      const ct = fi - ci;
      const c0 = PALETTES.iron[ci];
      const c1 = PALETTES.iron[Math.min(ci + 1, PALETTES.iron.length - 1)];

      ctx.fillStyle = `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * ct)},${Math.round(
        c0[1] + (c1[1] - c0[1]) * ct
      )},${Math.round(c0[2] + (c1[2] - c0[2]) * ct)})`;

      const bh = (v / maxB) * (c.height - 2);
      ctx.fillRect(i * (c.width / 64), c.height - bh, c.width / 64 - 0.5, bh);
    });

    ctx.fillStyle = "#2a3a44";
    ctx.font = "7px monospace";
    ctx.fillText("-20°", 2, c.height - 1);
    ctx.fillText("120°", c.width - 22, c.height - 1);
  }, [raw]);

  return (
    <canvas
      ref={ref}
      width={180}
      height={44}
      style={{
        width: "100%",
        borderRadius: 3,
        display: "block",
      }}
    />
  );
}
