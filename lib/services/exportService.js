const safeLabel = (a) => a?.cls?.name || a?.label || "object";
const normalizeClasses = (classes) => (Array.isArray(classes) ? classes : Array.isArray(classes?.classes) ? classes.classes : []);
const getClassId = (name, classes) => {
  const cls = normalizeClasses(classes);
  return Math.max(0, cls.findIndex((c) => c.name === name || c.id === name));
};

export function exportYOLO(annotations, W, H, classes = []) {
  return (annotations || [])
    .filter((a) => a.type === "bbox")
    .map((a) => {
      const width = a.w ?? a.width;
      const height = a.h ?? a.height;
      const x = a.x + width / 2;
      const y = a.y + height / 2;
      const c = getClassId(safeLabel(a), classes);
      return `${c} ${(x / W).toFixed(6)} ${(y / H).toFixed(6)} ${(width / W).toFixed(6)} ${(height / H).toFixed(6)}`;
    })
    .join("\n");
}

export function exportCOCO(annotations, W, H, classes = []) {
  const cls = normalizeClasses(classes);
  return {
    images: [{ id: 1, file_name: "image", width: W, height: H }],
    categories: cls.map((c, i) => ({ id: c.id ?? i + 1, name: c.name })),
    annotations: (annotations || []).map((a, i) => {
      if (a.type === "polygon") {
        return { id: i + 1, image_id: 1, category_id: getClassId(safeLabel(a), classes) + 1, segmentation: [a.points.flatMap((p) => [p.x, p.y])], area: 0, bbox: [0, 0, 0, 0], iscrowd: 0 };
      }
      const width = a.w ?? a.width;
      const height = a.h ?? a.height;
      return { id: i + 1, image_id: 1, category_id: getClassId(safeLabel(a), classes) + 1, bbox: [a.x, a.y, width, height], area: width * height, iscrowd: 0 };
    }),
  };
}

export function exportPascalVOC(annotations, W, H) {
  const objects = (annotations || [])
    .filter((a) => a.type === "bbox")
    .map((a) => {
      const width = a.w ?? a.width;
      const height = a.h ?? a.height;
      return `<object><name>${safeLabel(a)}</name><bndbox><xmin>${Math.round(a.x)}</xmin><ymin>${Math.round(a.y)}</ymin><xmax>${Math.round(a.x + width)}</xmax><ymax>${Math.round(a.y + height)}</ymax></bndbox></object>`;
    })
    .join("");

  return `<?xml version="1.0"?><annotation><size><width>${W}</width><height>${H}</height><depth>3</depth></size>${objects}</annotation>`;
}

export function downloadFile(content, filename, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement("a");
  const hasObjectUrl = typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
  link.href = hasObjectUrl ? URL.createObjectURL(blob) : `data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (hasObjectUrl && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(link.href);
}
