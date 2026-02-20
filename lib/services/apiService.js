const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
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
  getProjects: () => request("/api/projects"),
  getProject: (id) => request(`/api/projects/${id}`),
  saveProject: (project) => request("/api/projects", { method: "POST", body: JSON.stringify(project) }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: "DELETE" }),
  getClasses: async () => (await request("/api/settings/classes")).classes || [],
  saveClasses: (classes) => request("/api/settings/classes", { method: "PUT", body: JSON.stringify({ classes }) }),
};

export default apiService;
