// pages/index.js
// Главная страница приложения ThermoLabel

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { THEME_COLORS, DEFAULT_CLASSES, TOOLS, TABS } from "@/lib/constants";
import {
  generateThermalDemo,
  loadImageAsGrayscale,
  parseFlirData,
} from "@/lib/services/imageService";
import { applyPalette } from "@/lib/services/paletteService";
import {
  rawToTemp,
  tempToRaw,
  getAreaStats,
} from "@/lib/services/temperatureService";
import {
  pointInPolygon,
  polygonBounds,
} from "@/lib/services/geometryService";
import {
  exportYOLO,
  exportCOCO,
  exportPascalVOC,
  downloadFile,
} from "@/lib/services/exportService";
import { HistoryManager } from "@/lib/services/historyService";
import {
  detectAnomalousAnnotations,
  getDatasetStatistics,
} from "@/lib/services/analyticsService";
import storageService from "@/lib/services/storageService";
import apiService from "@/lib/services/apiService";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n";
import ToolPanel from "@/components/ToolPanel";
import AnnotationPanel from "@/components/AnnotationPanel";
import Analytics from "@/components/Analytics";
import ClassManager from "@/components/ClassManager";
import ProjectsMenu from "@/components/ProjectsMenu";
import ImageLoadModal from "@/components/ImageLoadModal";
import DatabaseDumpModal from "@/components/DatabaseDumpModal";

export default function Home({ theme, onThemeChange }) {
  // Canvas refs
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const heatmapRef = useRef(null);
  const fileInputRef = useRef(null);
  const rawDataRef = useRef(null);
  const historyRef = useRef(new HistoryManager());

  // State
  const [W, setW] = useState(1280);
  const [H, setH] = useState(720);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [palette, setPalette] = useState("original");
  const [tool, setTool] = useState(TOOLS.bbox);
  const [annotations, setAnnotations] = useState([]);
  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [selClass, setSelClass] = useState(DEFAULT_CLASSES[0]);
  const [selAnn, setSelAnn] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [tab, setTab] = useState(TABS.ANNOTATE);
  const [loaded, setLoaded] = useState(false);
  const [imgName, setImgName] = useState("thermal_demo.jpg");
  const [showHeat, setShowHeat] = useState(false);
  const [threshold, setThreshold] = useState(40);
  const [zoom, setZoom] = useState(1);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [polyPts, setPolyPts] = useState([]);
  const [mousePos, setMousePos] = useState(null);
  const [drawStart, setDrawStart] = useState(null);
  const [drawCur, setDrawCur] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#ff00ff");
  const [stats, setStats] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDumpModal, setShowDumpModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [savedExportFormats, setSavedExportFormats] = useState([]);
  const projectNameInputRef = useRef(null);

  const unsavedRef = useRef(false);
  const justLoadedRef = useRef(false);

  // Helper function for translations
  const t = useCallback((key) => translations[language]?.[key] ?? key, [language]);

  // Save project functionality (имя берётся из projectName, сохраняется в БД и в дампе)
  const saveProject = useCallback(async () => {
    const name = (projectName || currentProject?.name || "").trim() || `Проект ${new Date().toLocaleDateString()}`;
    const project = {
      id: currentProject?.id || Date.now().toString(),
      name,
      image_data: rawDataRef.current,
      image_width: W,
      image_height: H,
      palette,
      annotations,
      classes,
      created_at: currentProject?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = await storageService.saveProject(project);
    if (!result?.ok) {
      if (result?.reason === "quota") {
        alert("Не удалось сохранить проект: превышен лимит хранилища браузера");
      } else {
        alert("Не удалось сохранить проект");
      }
      return;
    }
    setCurrentProject(project);
    setProjectName(project.name);
    unsavedRef.current = false;
    alert(`${t('project_saved')}: ${project.name}`);
  }, [W, H, palette, annotations, classes, currentProject, projectName, t]);

  // Load project from menu (имя из БД/дампа подставляется в projectName)
  const handleProjectOpen = (project) => {
    if (project.image_data && project.image_data.length > 0) {
      justLoadedRef.current = true;
      rawDataRef.current = project.image_data;
      setW(project.image_width || 640);
      setH(project.image_height || 480);
      setPalette(project.palette || 'original');
      setAnnotations(project.annotations || []);
      setClasses(project.classes || DEFAULT_CLASSES);
      setCurrentProject(project);
      setProjectName(project.name || "");
      setLoaded(true);
      alert(`${t('project_loaded')}: ${project.name}`);
    }
  };

  // Отслеживание несохранённых изменений для предупреждения при закрытии вкладки
  useEffect(() => {
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      unsavedRef.current = false;
      return;
    }
    const hasContent = annotations.length > 0 || loaded;
    if (hasContent) unsavedRef.current = true;
  }, [annotations, classes, loaded]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (unsavedRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const displayProjectName = (projectName || currentProject?.name || "").trim() || t("unnamed_project");
  const applyProjectNameEdit = (value) => {
    const name = (value || "").trim() || t("unnamed_project");
    setProjectName(name);
    if (currentProject) setCurrentProject((prev) => (prev ? { ...prev, name } : null));
    setEditingProjectName(false);
  };
  useEffect(() => {
    if (editingProjectName && projectNameInputRef.current) projectNameInputRef.current.focus();
  }, [editingProjectName]);

  // Create new project - clear all data
  const handleNewProject = async () => {
    setCurrentProject(null);
    setProjectName(`${t('new_project')} ${new Date().toLocaleDateString()}`);
    setAnnotations([]);
    setClasses(DEFAULT_CLASSES);
    setSelClass(DEFAULT_CLASSES[0]);
    setSelAnn(null);
    setPalette('original');
    setPolyPts([]);
    setUndoStack([]);
    setRedoStack([]);
    setImgName('thermal_demo.jpg');
    rawDataRef.current = generateThermalDemo(W, H);
    setLoaded(false);
    setTimeout(() => setLoaded(true), 10);

    const newProject = {
      id: Date.now().toString(),
      name: `${t('new_project')} ${new Date().toLocaleDateString()}`,
      image_data: rawDataRef.current,
      image_width: W,
      image_height: H,
      palette: "original",
      annotations: [],
      classes: DEFAULT_CLASSES,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saveResult = await storageService.saveProject(newProject);
    if (saveResult?.ok) {
      setCurrentProject(newProject);
      setProjectName(newProject.name);
      unsavedRef.current = false;
      alert(`${t('project_created')}: ${newProject.name}`);
    } else {
      alert(`${t('project_created')}: ${t('new_project')}. ${t('error')}: save failed`);
    }
  };

  // Load image with palette mode selection
  const handleImageLoad = (imageData) => {
    rawDataRef.current = imageData.data;
    setW(imageData.width);
    setH(imageData.height);
    setImgName(imageData.name);
    setLoaded(true);
    setAnnotations([]);
    setShowImageModal(false);
    
    if (imageData.mode === 'with-palette') {
      // Image was already converted to grayscale
      setPalette('iron');
    } else {
      setPalette('original');
    }
  };

  // Export handler: скачивание + сохранение в БД (если проект сохранён)
  const handleExport = async (format) => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    let content, filename, mime;

    try {
      if (format === 'yolo') {
        content = exportYOLO(annotations, W, H, classes);
        filename = `annotations_${ts}.txt`;
        mime = 'text/plain';
      } else if (format === 'coco') {
        const data = exportCOCO(annotations, W, H, classes);
        content = JSON.stringify(data, null, 2);
        filename = `coco_${ts}.json`;
        mime = 'application/json';
      } else if (format === 'voc') {
        content = exportPascalVOC(annotations, W, H, classes);
        filename = `pascal_voc_${ts}.xml`;
        mime = 'application/xml';
      }

      if (!rawDataRef.current?.length || annotations.length === 0) {
        alert('Нельзя скачать: отсутствует изображение или аннотации');
        return;
      }

      if (content) {
        let savedToDb = false;
        if (currentProject?.id) {
          const saved = await storageService.saveProjectExport(currentProject.id, format, content);
          savedToDb = saved?.ok;
          if (savedToDb) setSavedExportFormats((prev) => (prev.includes(format) ? prev : [...prev, format]));
          if (!saved?.ok) console.warn('Export save to DB failed:', saved?.reason);
        }
        downloadFile(content, filename);
        alert(savedToDb ? t('export_saved_to_db') : t('export_download_only'));
      }
    } catch (error) {
      console.error(`Export error: ${error.message}`);
      alert(`${t('error')}: ${error.message}`);
    }
  };

  const handleDownloadExportFromDb = async (format) => {
    if (!currentProject?.id) return;
    try {
      const { blob, filename } = await apiService.downloadProjectExport(currentProject.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`${t('error')}: ${e?.message || "Скачивание из БД не удалось"}`);
    }
  };

  // Загрузка списка экспортов из БД при смене проекта
  useEffect(() => {
    if (!currentProject?.id) {
      setSavedExportFormats([]);
      return;
    }
    (async () => {
      try {
        const list = await apiService.getProjectExports(currentProject.id);
        setSavedExportFormats(Array.isArray(list) ? list.map((e) => e.format) : []);
      } catch {
        setSavedExportFormats([]);
      }
    })();
  }, [currentProject?.id]);

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      const savedClasses = await storageService.getClasses();
      const savedPalette = storageService.getPalette();

      if (savedClasses.length > 0) {
        setClasses(savedClasses);
        setSelClass(savedClasses[0]);
      }
      if (savedPalette) {
        setPalette(savedPalette);
      }
    })();
  }, []);

  // Save state on changes
  useEffect(() => {
    void storageService.setClasses(classes);
  }, [classes]);

  useEffect(() => {
    storageService.setPalette(palette);
  }, [palette]);
  useEffect(() => {
    const initialW = Math.max(960, Math.min(1600, Math.floor(window.innerWidth * 0.65)));
    const initialH = Math.max(540, Math.min(1000, Math.floor(window.innerHeight * 0.75)));
    setW(initialW);
    setH(initialH);
    rawDataRef.current = generateThermalDemo(initialW, initialH);
    setLoaded(true);
  }, []);

  // Render main image
  const renderImage = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !rawDataRef.current) return;
    const ctx = c.getContext("2d");
    const colored = applyPalette(rawDataRef.current, palette);
    const imgData = new ImageData(W, H);
    imgData.data.set(colored);
    ctx.putImageData(imgData, 0, 0);
  }, [palette, W, H]);

  useEffect(() => {
    if (loaded) renderImage();
  }, [loaded, renderImage]);

  // Render heatmap
  useEffect(() => {
    const c = heatmapRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    if (!showHeat || !annotations.length) return;

    const grid = new Float32Array(W * H);
    for (const ann of annotations) {
      if (ann.type !== "bbox") continue;
      const cx = ann.x + ann.w / 2;
      const cy = ann.y + ann.h / 2;
      const r = Math.max(ann.w, ann.h) / 2;

      for (
        let py = Math.max(0, Math.floor(ann.y));
        py < Math.min(H, Math.ceil(ann.y + ann.h));
        py++
      ) {
        for (
          let px = Math.max(0, Math.floor(ann.x));
          px < Math.min(W, Math.ceil(ann.x + ann.w));
          px++
        ) {
          const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
          grid[py * W + px] +=
            Math.max(0, 1 - d / r) * (ann.tempStats.mean / 100);
        }
      }
    }

    const imgData = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const v = Math.min(1, grid[i]);
      imgData.data[i * 4] = Math.round(v * 255);
      imgData.data[i * 4 + 1] = Math.round((1 - v) * 80);
      imgData.data[i * 4 + 2] = 0;
      imgData.data[i * 4 + 3] = Math.round(v * 150);
    }
    ctx.putImageData(imgData, 0, 0);
  }, [showHeat, annotations, W, H]);

  // Render overlay with annotations
  const renderOverlay = useCallback(() => {
    const c = overlayRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    // Threshold highlight
    if (tool === TOOLS.threshold && rawDataRef.current) {
      const tr = tempToRaw(threshold);
      const imgData = ctx.createImageData(W, H);
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const v = rawDataRef.current[(py * W + px) * 4];
          if (v >= tr) {
            const i = (py * W + px) * 4;
            imgData.data[i] = 255;
            imgData.data[i + 3] = 120;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Draw annotations
    annotations.forEach((ann, i) => {
      const isSel = selAnn === i;
      ctx.strokeStyle = ann.cls.color;
      ctx.lineWidth = isSel ? 2.5 : 1.5;

      if (ann.type === "bbox") {
        ctx.fillStyle = ann.cls.color + (isSel ? "2a" : "15");
        ctx.fillRect(ann.x, ann.y, ann.w, ann.h);
        ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);

        if (isSel) {
          [
            [ann.x, ann.y],
            [ann.x + ann.w, ann.y],
            [ann.x, ann.y + ann.h],
            [ann.x + ann.w, ann.y + ann.h],
          ].forEach(([hx, hy]) => {
            ctx.fillStyle = "#fff";
            ctx.fillRect(hx - 4, hy - 4, 8, 8);
            ctx.strokeStyle = ann.cls.color;
            ctx.strokeRect(hx - 4, hy - 4, 8, 8);
          });
        }
      } else if (ann.type === "polygon" && ann.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        ann.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = ann.cls.color + (isSel ? "2a" : "15");
        ctx.fill();
        ctx.stroke();
        ann.points.forEach((p) => {
          ctx.fillStyle = ann.cls.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      const lx = ann.type === "bbox" ? ann.x : ann.points?.[0]?.x ?? 0;
      const ly = ann.type === "bbox" ? ann.y : ann.points?.[0]?.y ?? 0;
      ctx.font = "bold 10px 'JetBrains Mono',monospace";
      const label = `#${i + 1} ${ann.cls.name} ${ann.tempStats.mean.toFixed(
        1
      )}°`;
      const tw = ctx.measureText(label).width;
      const lTop = Math.max(16, ly);
      ctx.fillStyle = ann.cls.color + "cc";
      ctx.beginPath();
      ctx.roundRect(lx, lTop - 16, tw + 8, 16, 3);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.fillText(label, lx + 4, lTop - 4);
    });

    // In-progress bbox
    if (isDrawing && drawStart && drawCur) {
      const x = Math.min(drawStart.x, drawCur.x);
      const y = Math.min(drawStart.y, drawCur.y);
      const w = Math.abs(drawCur.x - drawStart.x);
      const h = Math.abs(drawCur.y - drawStart.y);
      ctx.strokeStyle = selClass.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.fillStyle = selClass.color + "22";
      ctx.fillRect(x, y, w, h);
    }

    // In-progress polygon
    if (tool === TOOLS.polygon && polyPts.length > 0) {
      ctx.strokeStyle = selClass.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(polyPts[0].x, polyPts[0].y);
      polyPts.forEach((p) => ctx.lineTo(p.x, p.y));
      if (mousePos) ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();

      polyPts.forEach((p, pi) => {
        ctx.fillStyle = pi === 0 ? "#ffffff" : selClass.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pi === 0 ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = selClass.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }, [
    annotations,
    selAnn,
    isDrawing,
    drawStart,
    drawCur,
    polyPts,
    mousePos,
    tool,
    selClass,
    threshold,
    W,
    H,
  ]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  useEffect(() => {
    if (loaded && tab === TABS.ANNOTATE) {
      renderImage();
      requestAnimationFrame(renderOverlay);
    }
  }, [tab, loaded, renderImage, renderOverlay]);

  // Get mouse position
  const getPos = useCallback(
    (e) => {
      const c = overlayRef.current;
      if (!c) return { x: 0, y: 0 };
      const r = c.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) * W) / r.width,
        y: ((e.clientY - r.top) * H) / r.height,
      };
    },
    [W, H]
  );

  // Add annotation
  const addAnnotation = useCallback((ann) => {
    setUndoStack((p) => [...p, annotations]);
    setRedoStack([]);
    setAnnotations((p) => [...p, ann]);
  }, [annotations]);

  // Finish polygon
  const finishPolygon = useCallback(() => {
    if (polyPts.length < 3) {
      setPolyPts([]);
      return;
    }
    const bounds = polygonBounds(polyPts);
    const stats = getAreaStats(rawDataRef.current, W, bounds.x, bounds.y, bounds.w, bounds.h);
    addAnnotation({
      id: Date.now(),
      type: "polygon",
      points: [...polyPts],
      cls: selClass,
      tempStats: stats,
      ...bounds,
    });
    setPolyPts([]);
  }, [polyPts, selClass, W, addAnnotation]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    const pos = getPos(e);

    if (tool === TOOLS.polygon) {
      if (polyPts.length > 2) {
        const dx = pos.x - polyPts[0].x;
        const dy = pos.y - polyPts[0].y;
        if (Math.sqrt(dx * dx + dy * dy) < 14) {
          finishPolygon();
          return;
        }
      }
      setPolyPts((p) => [...p, pos]);
      return;
    }

    if (tool === TOOLS.threshold) return;

    // Check existing annotations
    for (let i = annotations.length - 1; i >= 0; i--) {
      const a = annotations[i];
      const hit =
        a.type === "bbox"
          ? pos.x >= a.x && pos.x <= a.x + a.w && pos.y >= a.y && pos.y <= a.y + a.h
          : pointInPolygon(a.points || [], pos.x, pos.y);
      if (hit) {
        setSelAnn(selAnn === i ? null : i);
        return;
      }
    }

    setSelAnn(null);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawCur(pos);
  };

  const handleMouseMove = (e) => {
    const pos = getPos(e);
    if (rawDataRef.current) {
      const px = Math.max(0, Math.min(W - 1, Math.floor(pos.x)));
      const py = Math.max(0, Math.min(H - 1, Math.floor(pos.y)));
      setHovered({
        ...pos,
        temp: rawToTemp(rawDataRef.current[(py * W + px) * 4]),
      });
    }
    setMousePos(pos);
    if (isDrawing) setDrawCur(pos);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawStart || !drawCur) {
      setIsDrawing(false);
      return;
    }

    const x = Math.min(drawStart.x, drawCur.x);
    const y = Math.min(drawStart.y, drawCur.y);
    const w = Math.abs(drawCur.x - drawStart.x);
    const h = Math.abs(drawCur.y - drawStart.y);

    if (w < 8 || h < 8) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCur(null);
      return;
    }

    const stats = getAreaStats(rawDataRef.current, W, x, y, w, h);
    addAnnotation({
      id: Date.now(),
      type: "bbox",
      x,
      y,
      w,
      h,
      cls: selClass,
      tempStats: stats,
    });

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCur(null);
  };

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImgName(file.name);

    // Check for FLIR format
    if (
      file.name.endsWith(".fff") ||
      file.name.endsWith(".seq") ||
      file.name.endsWith(".raw")
    ) {
      const result = await parseFlirData(file);
      if (!result.success) {
        alert(
          "FLIR format requires backend processing. Using demo data instead."
        );
        rawDataRef.current = generateThermalDemo(W, H);
        setLoaded(false);
        setTimeout(() => setLoaded(true), 10);
        return;
      }
    }

    try {
      const { raw, width, height } = await loadImageAsGrayscale(file);
      setW(width);
      setH(height);
      rawDataRef.current = raw;
      setAnnotations([]);
      setSelAnn(null);
      setLoaded(false);
      setTimeout(() => setLoaded(true), 10);
    } catch (err) {
      alert("Failed to load image: " + err.message);
    }
  };

  // Apply threshold
  const applyThreshold = () => {
    if (!rawDataRef.current) return;

    const tr = tempToRaw(threshold);
    const visited = new Uint8Array(W * H);
    const newAnns = [];

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        if (visited[idx] || rawDataRef.current[idx * 4] < tr) continue;

        const queue = [{ x, y }];
        visited[idx] = 1;
        let minX = x,
          maxX = x,
          minY = y,
          maxY = y;

        while (queue.length) {
          const { x: cx, y: cy } = queue.shift();
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;

            const ni = ny * W + nx;
            if (visited[ni] || rawDataRef.current[ni * 4] < tr) continue;

            visited[ni] = 1;
            queue.push({ x: nx, y: ny });
          }
        }

        if (maxX - minX < 5 || maxY - minY < 5) continue;

        const stats = getAreaStats(
          rawDataRef.current,
          W,
          minX,
          minY,
          maxX - minX,
          maxY - minY
        );
        newAnns.push({
          id: Date.now() + newAnns.length,
          type: "bbox",
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          cls: selClass,
          tempStats: stats,
        });
      }
    }

    if (newAnns.length) {
      setUndoStack((p) => [...p, annotations]);
      setRedoStack([]);
      setAnnotations((p) => [...p, ...newAnns.slice(0, 25)]);
    }
  };

  // Old export functions removed - use handleExport() instead

  useEffect(() => {
    // Load on mount is handled in the state initialization above
  }, []);

  // Update statistics
  useEffect(() => {
    setStats(getDatasetStatistics(annotations, classes));
  }, [annotations, classes]);

  // Styles
  const cs = THEME_COLORS;

  const handleCanvasWheel = useCallback((e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((z) => Math.max(0.4, Math.min(2.5, +(z + delta).toFixed(2))));
  }, []);

  const canvasS = {
    display: "block",
    maxWidth: "100%",
    maxHeight: "calc(100vh - 100px)",
  };

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono','Courier New',monospace",
        background: cs.bg,
        height: "100vh",
        width: "100vw",
        color: cs.text,
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: cs.panel,
          borderBottom: `1px solid ${cs.border}`,
          padding: "9px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg,#ff3030,#ff9900)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            🌡
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: "#cce8ff",
                letterSpacing: 1,
              }}
            >
              Infralabel
            </div>
            <div
              style={{
                fontSize: 8,
                color: cs.dim,
                letterSpacing: 2.5,
              }}
            >
              THERMAL ANNOTATION
            </div>
          </div>
          <div
            style={{ width: 1, height: 24, background: cs.border, margin: "0 4px" }}
          />
          <span style={{ fontSize: 9, color: cs.dim }}>{imgName}</span>
          <span
            style={{
              fontSize: 8,
              color: cs.dim,
              background: cs.surface || cs.panel,
              padding: "2px 6px",
              borderRadius: 4,
              border: `1px solid ${cs.border}`,
            }}
          >
            {W}×{H}
          </span>
          <div
            style={{ width: 1, height: 24, background: cs.border, margin: "0 4px" }}
          />
          {editingProjectName ? (
            <input
              ref={projectNameInputRef}
              id="project-name-edit"
              name="projectName"
              type="text"
              defaultValue={displayProjectName}
              autoComplete="off"
              onBlur={(e) => applyProjectNameEdit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.target.blur();
                }
                if (e.key === "Escape") {
                  setEditingProjectName(false);
                }
              }}
              style={{
                fontSize: 11,
                color: cs.text || "#eee",
                background: cs.surface || "#2a2a2a",
                border: `1px solid ${cs.accent || "#4488ff"}`,
                borderRadius: 4,
                padding: "2px 8px",
                minWidth: 140,
                maxWidth: 220,
                fontFamily: "inherit",
              }}
              title={t("rename_project")}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingProjectName(true)}
              title={t("rename_project")}
              style={{
                fontSize: 11,
                color: cs.text || "#eee",
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: 4,
                padding: "2px 6px",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 4,
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayProjectName}
              </span>
              <span style={{ flexShrink: 0, opacity: 0.7 }}>✎</span>
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {[
            [TABS.ANNOTATE, "Аннотация"],
            [TABS.ANALYTICS, "Аналитика"],
            [TABS.CLASSES, "Классы"],
          ].map(([t, l]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "4px 12px",
                border: "1px solid",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 10,
                borderRadius: 5,
                transition: "all 0.12s",
                borderColor: tab === t ? cs.accent : cs.border,
                background: tab === t ? cs.accent + "14" : "transparent",
                color: tab === t ? cs.accent : cs.dim,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (undoStack.length) {
                setRedoStack((r) => [...r, annotations]);
                setAnnotations(undoStack[undoStack.length - 1]);
                setUndoStack((s) => s.slice(0, -1));
                setSelAnn(null);
              }
            }}
            disabled={!undoStack.length}
            style={{
              padding: "5px 9px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              borderRadius: 5,
              transition: "all 0.12s",
              borderColor: undoStack.length ? cs.accent : cs.border,
              background: undoStack.length ? cs.accent + "14" : "transparent",
              color: undoStack.length ? cs.accent : cs.dim,
              opacity: undoStack.length ? 1 : 0.3,
              fontSize: 12,
              padding: "3px 7px",
            }}
            title="Отменить"
          >
            ↩
          </button>
          <button
            onClick={() => {
              if (redoStack.length) {
                setUndoStack((u) => [...u, annotations]);
                setAnnotations(redoStack[redoStack.length - 1]);
                setRedoStack((r) => r.slice(0, -1));
                setSelAnn(null);
              }
            }}
            disabled={!redoStack.length}
            style={{
              padding: "5px 9px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              borderRadius: 5,
              transition: "all 0.12s",
              borderColor: redoStack.length ? cs.accent : cs.border,
              background: redoStack.length ? cs.accent + "14" : "transparent",
              color: redoStack.length ? cs.accent : cs.dim,
              opacity: redoStack.length ? 1 : 0.3,
              fontSize: 12,
              padding: "3px 7px",
            }}
            title="Вернуть ввод"
          >
            ↪
          </button>
          <button
            onClick={saveProject}
            style={{
              padding: "5px 9px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              borderRadius: 5,
              transition: "all 0.12s",
              borderColor: cs.border,
              background: "transparent",
              color: cs.dim,
              borderColor: "#00cc66",
              background: "#00cc6614",
              color: "#00cc66",
            }}
          >
            💾 {t('save_project')}
          </button>
          <button
            onClick={() => handleExport('yolo')}
            style={{
              padding: "5px 9px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              borderRadius: 5,
              transition: "all 0.12s",
              borderColor: cs.border,
              background: "transparent",
              color: cs.dim,
            }}
            title={savedExportFormats.includes("yolo") ? `${t("export_in_db")}. ${t("export_download_from_db")}` : ""}
          >
            ↓ YOLO{savedExportFormats.includes("yolo") ? " ✓" : ""}
          </button>
          <button
            onClick={() => handleExport('coco')}
            style={{
              padding: "5px 9px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              borderRadius: 5,
              transition: "all 0.12s",
              borderColor: cs.border,
              background: "transparent",
              color: cs.dim,
            }}
            title={savedExportFormats.includes("coco") ? `${t("export_in_db")}. ${t("export_download_from_db")}` : ""}
          >
            ↓ COCO{savedExportFormats.includes("coco") ? " ✓" : ""}
          </button>
          <button
            onClick={() => handleExport('voc')}
            style={{
              padding: "5px 9px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              borderRadius: 5,
              transition: "all 0.12s",
              borderColor: cs.border,
              background: "transparent",
              color: cs.dim,
            }}
            title={savedExportFormats.includes("voc") ? `${t("export_in_db")}. ${t("export_download_from_db")}` : ""}
          >
            ↓ Pascal VOC{savedExportFormats.includes("voc") ? " ✓" : ""}
          </button>
          {currentProject?.id && savedExportFormats.length > 0 && (
            <span style={{ fontSize: 9, color: cs.dim, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              {t("export_in_db")}:
              {savedExportFormats.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleDownloadExportFromDb(fmt)}
                  style={{
                    padding: "2px 6px",
                    fontSize: 9,
                    border: "1px solid " + cs.border,
                    borderRadius: 3,
                    background: "transparent",
                    color: cs.dim,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {fmt === "yolo" ? "YOLO" : fmt === "coco" ? "COCO" : "VOC"} {t("export_download_from_db")}
                </button>
              ))}
            </span>
          )}
          <button
            onClick={() => setShowImageModal(true)}
            style={{
              padding: "5px 9px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              borderRadius: 5,
              transition: "all 0.12s",
              borderColor: "#4488ff",
              background: "#4488ff14",
              color: "#4488ff",
            }}
          >
            + {t('load_image')}
          </button>
          <ProjectsMenu 
            onProjectOpen={handleProjectOpen}
            onProjectCreate={handleNewProject}
          />
          <button
            onClick={() => setShowDumpModal(true)}
            style={{
              padding: "5px 9px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              borderRadius: 5,
              transition: "all 0.12s",
              borderColor: cs.border,
              background: "transparent",
              color: cs.dim,
            }}
            title={t("dump_modal_title")}
          >
            📦 {t("dump_btn")}
          </button>
          <button
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            style={{
              padding: "5px 9px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 11,
              borderRadius: 5,
              transition: "all 0.12s",
              borderColor: cs.border,
              background: "transparent",
              color: cs.dim,
            }}
            title={t('theme')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: "4px 6px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              borderRadius: 5,
              borderColor: cs.border,
              background: "transparent",
              color: cs.dim,
            }}
          >
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </div>
      </div>

      {/* Image Load Modal */}
      <ImageLoadModal
        isOpen={showImageModal}
        onLoad={handleImageLoad}
        onCancel={() => setShowImageModal(false)}
      />

      {/* Database dump export/import modal */}
      <DatabaseDumpModal
        isOpen={showDumpModal}
        onClose={() => setShowDumpModal(false)}
        t={t}
      />

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Left Panel */}
        <ToolPanel
          tool={tool}
          setTool={setTool}
          palette={palette}
          setPalette={setPalette}
          classes={classes}
          selClass={selClass}
          setSelClass={setSelClass}
          hovered={hovered}
          raw={rawDataRef.current}
          threshold={threshold}
          setThreshold={setThreshold}
          applyThreshold={applyThreshold}
          polyPts={polyPts}
          setPolyPts={setPolyPts}
          finishPolygon={finishPolygon}
        />

        {/* Main Canvas Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: cs.bg,
            overflow: "hidden",
            position: "relative",
            minWidth: 0,
          }}
        >
          {tab === TABS.ANNOTATE && (
            <>
              <div
                onWheel={handleCanvasWheel}
                style={{
                  position: "relative",
                  borderRadius: 5,
                  overflow: "hidden",
                  border: `1px solid ${cs.border}`,
                  boxShadow: "0 0 80px rgba(255,153,0,0.03)",
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.18s",
                }}
              >
                <canvas ref={canvasRef} width={W} height={H} style={canvasS} />
                <canvas
                  ref={heatmapRef}
                  width={W}
                  height={H}
                  style={{
                    ...canvasS,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                />
                <canvas
                  ref={overlayRef}
                  width={W}
                  height={H}
                  style={{
                    ...canvasS,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    cursor: "crosshair",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    setHovered(null);
                    setMousePos(null);
                  }}
                  onDoubleClick={() =>
                    tool === TOOLS.polygon &&
                    polyPts.length > 2 &&
                    finishPolygon()
                  }
                />
              </div>

              {/* Controls */}
              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  background: "color-mix(in srgb, var(--color-surface) 85%, transparent)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 8,
                  padding: "5px 14px",
                  border: `1px solid ${cs.border}`,
                }}
              >
                <span style={{ fontSize: 9, color: cs.dim }}>
                  {annotations.length} аннотаций
                </span>
                <div
                  style={{ width: 1, height: 12, background: cs.border }}
                />
                <button
                  onClick={() =>
                    setZoom((z) =>
                      Math.min(2.5, +(z + 0.25).toFixed(2))
                    )
                  }
                  style={{
                    padding: "2px 7px",
                    border: "1px solid",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    borderRadius: 5,
                    transition: "all 0.12s",
                    borderColor: cs.border,
                    background: "transparent",
                    color: cs.dim,
                  }}
                >
                  +
                </button>
                <span
                  style={{
                    fontSize: 9,
                    color: cs.dim,
                    minWidth: 34,
                    textAlign: "center",
                  }}
                >
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() =>
                    setZoom((z) =>
                      Math.max(0.4, +(z - 0.25).toFixed(2))
                    )
                  }
                  style={{
                    padding: "2px 7px",
                    border: "1px solid",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    borderRadius: 5,
                    transition: "all 0.12s",
                    borderColor: cs.border,
                    background: "transparent",
                    color: cs.dim,
                  }}
                >
                  -
                </button>
                <div
                  style={{ width: 1, height: 12, background: cs.border }}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 9,
                    color: showHeat ? cs.accent : cs.dim,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showHeat}
                    onChange={(e) => setShowHeat(e.target.checked)}
                    style={{
                      accentColor: cs.accent,
                      width: 11,
                      height: 11,
                    }}
                  />
                  Тепловая карта
                </label>
              </div>
            </>
          )}

          {tab === TABS.ANALYTICS && (
            <Analytics
              annotations={annotations}
              classes={classes}
              W={W}
              H={H}
            />
          )}

          {tab === TABS.CLASSES && (
            <ClassManager
              classes={classes}
              setClasses={setClasses}
              annotations={annotations}
              newName={newName}
              setNewName={setNewName}
              newColor={newColor}
              setNewColor={setNewColor}
            />
          )}
        </div>

        {/* Right Panel */}
        <AnnotationPanel
          annotations={annotations}
          selAnn={selAnn}
          setSelAnn={setSelAnn}
          setAnnotations={setAnnotations}
          setUndoStack={setUndoStack}
          setRedoStack={setRedoStack}
        />
      </div>
    </div>
  );
}
