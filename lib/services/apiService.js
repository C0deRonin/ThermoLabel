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
  getClasses: async () => (await request("/settings/classes")).classes || [],
  saveClasses: (classes) => request("/settings/classes", { method: "PUT", body: JSON.stringify({ classes }) }),

  /** Export DB dump (SQL). Returns blob and suggested filename. */
  async exportDump() {
    const response = await fetch(`${API_PROXY_BASE}/db/export`);
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

  /** Import DB from SQL or .dump file. */
  async importDump(file) {
    const formData = new FormData();
    formData.append("file", file);
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
