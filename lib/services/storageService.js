import apiService from "@/lib/services/apiService";

const KEYS = {
  classes: "thermolabel:classes",
  palette: "thermolabel:palette",
  analytics: "thermolabel:analytics",
  theme: "thermolabel:theme",
};

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const read = (key, fallback) => {
  if (!canUseStorage()) return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
};

const bytesToBase64 = (bytes) => {
  if (!(bytes instanceof Uint8ClampedArray)) return "";
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const base64ToBytes = (base64) => {
  const binary = atob(base64 || "");
  const out = new Uint8ClampedArray(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
};

const toBackendProject = (project) => ({
  ...project,
  image_data: bytesToBase64(project?.image_data),
  image_encoding: "base64-u8",
});

const fromBackendProject = (project) => {
  if (!project) return null;
  if (project.image_encoding === "base64-bin" || project.image_encoding === "base64-u8") {
    return { ...project, image_data: base64ToBytes(project.image_data || "") };
  }
  return project;
};

const storageService = {
  getClassesLocal: () => read(KEYS.classes, []),
  setClassesLocal: (v) => write(KEYS.classes, v),
  getPalette: () => read(KEYS.palette, null),
  setPalette: (v) => write(KEYS.palette, v),
  getAnalytics: () => read(KEYS.analytics, {}),
  setAnalytics: (v) => write(KEYS.analytics, v),
  getTheme: () => read(KEYS.theme, "dark"),
  setTheme: (v) => write(KEYS.theme, v),

  async getClasses() {
    try {
      const classes = await apiService.getClasses();
      write(KEYS.classes, classes);
      return classes;
    } catch {
      return this.getClassesLocal();
    }
  },

  async setClasses(classes) {
    write(KEYS.classes, classes);
    try {
      await apiService.saveClasses(classes);
    } catch {
      // keep local classes state to avoid unhandled runtime errors when backend is temporarily unavailable
    }
  },

  async saveProject(project) {
    try {
      await apiService.saveProject(toBackendProject(project));
      return { ok: true, source: "api" };
    } catch (e) {
      return { ok: false, reason: e?.message || "api" };
    }
  },

  async loadProject(id) {
    try {
      const p = await apiService.getProject(id);
      return fromBackendProject(p);
    } catch {
      return null;
    }
  },

  /** Список проектов из БД (API). При ошибке сети/сервера пробрасывает исключение. */
  async getSavedProjectsList() {
    const raw = await apiService.getProjects();
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && Array.isArray(raw.projects)) return raw.projects;
    if (raw && typeof raw === "object" && Array.isArray(raw.items)) return raw.items;
    if (raw && typeof raw === "object" && Array.isArray(raw.data)) return raw.data;
    return [];
  },

  async deleteProject(id) {
    try {
      await apiService.deleteProject(id);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },

  /** Сохранить экспорт YOLO/COCO/VOC в БД. format: "yolo"|"coco"|"voc" */
  async saveProjectExport(projectId, format, content) {
    try {
      await apiService.saveProjectExport(projectId, format, content);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e?.message };
    }
  },
};

export default storageService;
