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
      // fallback to local storage only
    }
  },

  async saveProject(project) {
    try {
      await apiService.saveProject(toBackendProject(project));
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e.message || "api" };
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

  async getSavedProjectsList() {
    try {
      return await apiService.getProjects();
    } catch {
      return [];
    }
  },

  async deleteProject(id) {
    try {
      await apiService.deleteProject(id);
    } catch {
      // no-op
    }
  },
};

export default storageService;
