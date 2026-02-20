const KEYS = {
  classes: "thermolabel:classes",
  palette: "thermolabel:palette",
  analytics: "thermolabel:analytics",
  theme: "thermolabel:theme",
  projectsList: "thermolabel:projects:list",
  projectPrefix: "thermolabel:project:",
  legacyProjectPrefix: "thermolabel_project_",
};

const canUseStorage = () =>
  typeof window !== "undefined" && !!window.localStorage;

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

const serializeProject = (project) => {
  if (!(project?.image_data instanceof Uint8ClampedArray)) return project;
  return {
    ...project,
    image_data: bytesToBase64(project.image_data),
    image_encoding: "base64-u8",
  };
};

const deserializeProject = (project) => {
  if (!project) return null;
  if (
    project.image_encoding === "base64-u8" &&
    typeof project.image_data === "string"
  ) {
    return { ...project, image_data: base64ToBytes(project.image_data) };
  }
  return project;
};

const removeProjectById = (projectId) => {
  localStorage.removeItem(`${KEYS.projectPrefix}${projectId}`);
  localStorage.removeItem(`${KEYS.legacyProjectPrefix}${projectId}`);
};

const readProjectById = (projectId) => {
  const modern = read(`${KEYS.projectPrefix}${projectId}`, null);
  if (modern) return modern;
  return read(`${KEYS.legacyProjectPrefix}${projectId}`, null);
};

const trimOldProjectsUntilFits = (serializedProject) => {
  let list = read(KEYS.projectsList, []);

  while (list.length > 0) {
    const oldest = list[list.length - 1];
    try {
      removeProjectById(oldest.id);
      list = list.slice(0, -1);
      write(KEYS.projectsList, list);
      write(`${KEYS.projectPrefix}${serializedProject.id}`, serializedProject);
      return true;
    } catch {
      continue;
    }
  }

  return false;
};

const storageService = {
  getClasses: () => read(KEYS.classes, []),
  setClasses: (v) => write(KEYS.classes, v),
  getPalette: () => read(KEYS.palette, null),
  setPalette: (v) => write(KEYS.palette, v),
  getAnalytics: () => read(KEYS.analytics, {}),
  setAnalytics: (v) => write(KEYS.analytics, v),
  getTheme: () => read(KEYS.theme, "dark"),
  setTheme: (v) => write(KEYS.theme, v),

  saveProject(project) {
    if (!canUseStorage()) return { ok: false, reason: "no-storage" };

    const serializedProject = serializeProject(project);

    try {
      write(`${KEYS.projectPrefix}${project.id}`, serializedProject);
      localStorage.removeItem(`${KEYS.legacyProjectPrefix}${project.id}`);
    } catch (e) {
      if (
        e?.name !== "QuotaExceededError" &&
        e?.name !== "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        throw e;
      }
      const recovered = trimOldProjectsUntilFits(serializedProject);
      if (!recovered) {
        return { ok: false, reason: "quota" };
      }
    }

    const list = this.getSavedProjectsList().filter((p) => p.id !== project.id);
    list.unshift({
      id: project.id,
      name: project.name,
      created_at: project.created_at,
      updated_at: project.updated_at,
    });
    write(KEYS.projectsList, list);

    return { ok: true };
  },

  loadProject(id) {
    return deserializeProject(readProjectById(id));
  },

  getSavedProjectsList: () => read(KEYS.projectsList, []),

  deleteProject(id) {
    if (!canUseStorage()) return;
    removeProjectById(id);
    const list = this.getSavedProjectsList().filter((p) => p.id !== id);
    write(KEYS.projectsList, list);
  },
};

export default storageService;
