export const THEME_COLORS = {
  bg: "var(--color-background)",
  panel: "var(--color-surface)",
  border: "var(--color-border)",
  text: "var(--color-text)",
  dim: "var(--color-text-secondary)",
  accent: "var(--color-primary)",
};

export const DEFAULT_CLASSES = [
  { id: 1, name: "Перегрев", color: "#ff3030", tempMin: 45, tempMax: 120 },
  { id: 2, name: "Аномалия", color: "#ff9900", tempMin: 35, tempMax: 45 },
  { id: 3, name: "Норма", color: "#00cc66", tempMin: 20, tempMax: 35 },
  { id: 4, name: "Холодная зона", color: "#4488ff", tempMin: -20, tempMax: 20 },
  { id: 5, name: "Объект", color: "#cc44ff", tempMin: -20, tempMax: 120 },
];

export const TOOLS = { bbox: "bbox", polygon: "polygon", threshold: "threshold" };
export const TABS = { ANNOTATE: "annotate", ANALYTICS: "analytics", CLASSES: "classes" };
