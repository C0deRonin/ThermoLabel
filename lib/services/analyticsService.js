export function calculateImageFingerprint(data, width, height) {
  const size = 8;
  const fp = [];
  for (let gy = 0; gy < size; gy++) {
    for (let gx = 0; gx < size; gx++) {
      const startX = Math.floor((gx / size) * width);
      const endX = Math.floor(((gx + 1) / size) * width);
      const startY = Math.floor((gy / size) * height);
      const endY = Math.floor(((gy + 1) / size) * height);
      let sum = 0; let count = 0;
      for (let y = startY; y < endY; y++) for (let x = startX; x < endX; x++) { sum += data[y * width + x]; count++; }
      fp.push(count ? sum / count : 0);
    }
  }
  return fp;
}

export function calculateSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff += Math.abs(a[i] - b[i]);
  return Math.max(0, 1 - diff / (a.length * 255));
}

export function findDuplicates(images, threshold = 0.95) {
  const out = [];
  for (let i = 0; i < images.length; i++) {
    const fp1 = calculateImageFingerprint(images[i].data, images[i].width, images[i].height);
    for (let j = i + 1; j < images.length; j++) {
      const fp2 = calculateImageFingerprint(images[j].data, images[j].width, images[j].height);
      const sim = calculateSimilarity(fp1, fp2);
      if (sim >= threshold) out.push([images[i].id, images[j].id, sim]);
    }
  }
  return out;
}

export function findSimilarImages(referenceImage, images, limit = 5) {
  const fpRef = calculateImageFingerprint(referenceImage.data, referenceImage.width, referenceImage.height);
  return images
    .map((img) => ({ ...img, similarity: calculateSimilarity(fpRef, calculateImageFingerprint(img.data, img.width, img.height)) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

export function detectAnomalousAnnotations(annotations = []) {
  if (!annotations.length) return [];
  const temps = annotations.map((a) => a.temp ?? a.tempStats?.mean ?? 0);
  const mean = temps.reduce((a, b) => a + b, 0) / temps.length;
  const variance = temps.reduce((a, t) => a + (t - mean) ** 2, 0) / temps.length;
  const std = Math.sqrt(variance);
  return annotations.filter((a) => Math.abs((a.temp ?? a.tempStats?.mean ?? 0) - mean) > std * 2);
}

export function getDatasetStatistics(datasetOrAnnotations, maybeClasses) {
  const annotations = Array.isArray(datasetOrAnnotations) ? datasetOrAnnotations : datasetOrAnnotations?.annotations || [];
  const classes = maybeClasses || datasetOrAnnotations?.classes || [];
  const classDistribution = classes.map((c) => ({
    classId: c.id,
    name: c.name,
    count: annotations.filter((a) => (a.cls?.id ?? a.classId) === c.id || (a.label ?? a.cls?.name) === c.name).length,
  }));
  return {
    totalAnnotations: annotations.length,
    totalClasses: classes.length,
    avgAnnotationsPerClass: classes.length ? annotations.length / classes.length : 0,
    classDistribution,
  };
}
