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
};

export default apiService;
