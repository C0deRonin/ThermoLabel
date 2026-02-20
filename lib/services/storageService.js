import apiService from "@/lib/services/apiService";

const KEYS = {
  classes: "thermolabel:classes",
  palette: "thermolabel:palette",
  analytics: "thermolabel:analytics",
  theme: "thermolabel:theme",
  projectsList: "thermolabel:projects:list",
  projectPrefix: "thermolabel:project:",
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

const toLocalProject = (project) => ({
  ...project,
  image_data: bytesToBase64(project?.image_data),
  image_encoding: "base64-u8",
});

const fromLocalProject = (project) => fromBackendProject(project);

const getLocalProjectsList = () => read(KEYS.projectsList, []);
const setLocalProjectsList = (list) => write(KEYS.projectsList, list);

const saveProjectLocal = (project, { includeImage = true } = {}) => {
  const localProject = includeImage
    ? toLocalProject(project)
    : {
        ...project,
        image_data: "",
        image_encoding: "base64-u8",
      };
  write(`${KEYS.projectPrefix}${project.id}`, localProject);
  const list = getLocalProjectsList().filter((p) => p.id !== project.id);
  list.unshift({
    id: project.id,
    name: project.name,
    created_at: project.created_at,
    updated_at: project.updated_at,
  });
  setLocalProjectsList(list);
};

const loadProjectLocal = (id) => fromLocalProject(read(`${KEYS.projectPrefix}${id}`, null));

const saveProjectMetaLocal = (project) => {
  const metaProject = {
    ...project,
    image_data: "",
    image_encoding: "base64-u8",
  };
  write(`${KEYS.projectPrefix}${project.id}`, metaProject);
  const list = getLocalProjectsList().filter((p) => p.id !== project.id);
  list.unshift({
    id: project.id,
    name: project.name,
    created_at: project.created_at,
    updated_at: project.updated_at,
  });
  setLocalProjectsList(list);
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
      try {
        // Keep local index/cache lightweight after API save to avoid quota errors on large images.
        saveProjectLocal(project, { includeImage: false });
      } catch {
        // API save already succeeded; ignore local cache errors.
      }
      return { ok: true, source: "api" };
    } catch {
      try {
        saveProjectLocal(project);
        return { ok: true, source: "local" };
      } catch (e) {
        try {
          // Last-resort fallback: keep at least project metadata visible in the UI list.
          saveProjectMetaLocal(project);
          return { ok: true, source: "local-meta" };
        } catch {
          // no-op, report original storage failure below
        }
        const isQuota = e?.name === "QuotaExceededError" || /quota/i.test(String(e?.message || ""));
        return { ok: false, reason: isQuota ? "quota" : e?.message || "storage" };
      }
    }
  },

  async loadProject(id) {
    try {
      const p = await apiService.getProject(id);
      const decoded = fromBackendProject(p);
      if (decoded) saveProjectLocal(decoded);
      return decoded;
    } catch {
      return loadProjectLocal(id);
    }
  },

  async getSavedProjectsList() {
    try {
      const projects = await apiService.getProjects();
      if (Array.isArray(projects) && projects.length > 0) {
        setLocalProjectsList(projects);
      }
      return Array.isArray(projects) ? projects : [];
    } catch {
      return getLocalProjectsList();
    }
  },

  async deleteProject(id) {
    try {
      await apiService.deleteProject(id);
    } catch {
      // no-op
    }
    if (canUseStorage()) {
      localStorage.removeItem(`${KEYS.projectPrefix}${id}`);
      setLocalProjectsList(getLocalProjectsList().filter((p) => p.id !== id));
    }
  },
};

export default storageService;
