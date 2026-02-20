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
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (key, value) => { if (canUseStorage()) localStorage.setItem(key, JSON.stringify(value)); };

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
    write(`${KEYS.projectPrefix}${project.id}`, project);
    const list = this.getSavedProjectsList().filter((p) => p.id !== project.id);
    list.unshift({ id: project.id, name: project.name, created_at: project.created_at, updated_at: project.updated_at });
    write(KEYS.projectsList, list);
  },
  loadProject: (id) => read(`${KEYS.projectPrefix}${id}`, null),
  getSavedProjectsList: () => read(KEYS.projectsList, []),
  deleteProject(id) {
    if (!canUseStorage()) return;
    localStorage.removeItem(`${KEYS.projectPrefix}${id}`);
    const list = this.getSavedProjectsList().filter((p) => p.id !== id);
    write(KEYS.projectsList, list);
  },
};

export default storageService;
