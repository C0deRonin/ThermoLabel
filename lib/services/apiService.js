const API_PROXY_BASE = "/api/proxy";

async function request(path, options = {}) {
  const response = await fetch(`${API_PROXY_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

const apiService = {
  getProjects: () => request("/projects"),
  getProject: (id) => request(`/projects/${id}`),
  saveProject: (project) => request("/projects", { method: "POST", body: JSON.stringify(project) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),

  /** Список сохранённых в БД экспортов проекта: [{ format, created_at }] */
  getProjectExports: (projectId) => request(`/projects/${projectId}/exports`),

  /** Save YOLO/COCO/Pascal VOC export to DB. format: "yolo"|"coco"|"voc", content: string */
  async saveProjectExport(projectId, format, content) {
    return request(`/projects/${projectId}/exports`, {
      method: "POST",
      body: JSON.stringify({ format, content }),
    });
  },

  /** Скачать экспорт из БД. Возвращает { blob, filename }. */
  async downloadProjectExport(projectId, format) {
    const response = await fetch(`${API_PROXY_BASE}/projects/${projectId}/exports/${format}`);
    if (!response.ok) throw new Error(await response.text() || `Export download failed: ${response.status}`);
    const blob = await response.blob();
    const ext = { yolo: "txt", coco: "json", voc: "xml" }[format] || "bin";
    const disposition = response.headers.get("Content-Disposition");
    let filename = `export_${projectId}_${format}.${ext}`;
    if (disposition) {
      const m = disposition.match(/filename="?([^";]+)"?/);
      if (m) filename = m[1].trim();
    }
    return { blob, filename };
  },
  getClasses: async () => (await request("/settings/classes")).classes || [],
  saveClasses: (classes) => request("/settings/classes", { method: "PUT", body: JSON.stringify({ classes }) }),

  /** Export DB dump (SQL). dataOnly=true — только данные, для слияния дампов. */
  async exportDump(dataOnly = false) {
    const q = dataOnly ? "?data_only=true" : "";
    const response = await fetch(`${API_PROXY_BASE}/db/export${q}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Export failed: ${response.status}`);
    }
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    let filename = "thermolabel_dump.sql";
    if (disposition) {
      const m = disposition.match(/filename="?([^";]+)"?/);
      if (m) filename = m[1].trim();
    }
    return { blob, filename };
  },

  /** Import DB from SQL or .dump file. clearBefore=true — очистить таблицы перед импортом (для полного дампа). */
  async importDump(file, clearBefore = false) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clear_before", clearBefore ? "true" : "false");
    const response = await fetch(`${API_PROXY_BASE}/db/import`, {
      method: "POST",
      body: formData,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text || `Import failed: ${response.status}`);
    return text ? JSON.parse(text) : {};
  },
};

export default apiService;
