import storageService from "@/lib/services/storageService";
import apiService from "@/lib/services/apiService";

jest.mock("@/lib/services/apiService", () => ({
  __esModule: true,
  default: {
    saveProject: jest.fn(),
    getProject: jest.fn(),
    getProjects: jest.fn(),
    deleteProject: jest.fn(),
    getClasses: jest.fn(),
    saveClasses: jest.fn(),
  },
}));

describe("storageService with postgres-only project persistence", () => {
  const project = {
    id: "p-1",
    name: "P1",
    image_data: new Uint8ClampedArray([0, 1, 2, 255]),
    image_width: 1,
    image_height: 1,
    palette: "iron",
    annotations: [],
    classes: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("saveProject returns api error when backend save fails", async () => {
    apiService.saveProject.mockRejectedValue(new Error("backend down"));

    const result = await storageService.saveProject(project);

    expect(result).toEqual({ ok: false, reason: "backend down" });
  });

  it("loadProject returns null when backend is unavailable", async () => {
    apiService.getProject.mockRejectedValue(new Error("network"));

    const result = await storageService.loadProject("p-1");

    expect(result).toBeNull();
  });

  it("getSavedProjectsList returns [] when backend is unavailable", async () => {
    apiService.getProjects.mockRejectedValue(new Error("network"));

    const result = await storageService.getSavedProjectsList();

    expect(result).toEqual([]);
  });

  it("saveProject does not persist project payload into localStorage fallback keys", async () => {
    apiService.saveProject.mockResolvedValue({ ok: true });

    await storageService.saveProject(project);

    expect(localStorage.getItem("thermolabel:project:p-1")).toBeNull();
    expect(localStorage.getItem("thermolabel:projects:list")).toBeNull();
  });

  it("getClasses falls back to locally cached classes when API is unavailable", async () => {
    apiService.getClasses.mockRejectedValue(new Error("network"));
    localStorage.setItem("thermolabel:classes", JSON.stringify([{ name: "Local" }]));

    const classes = await storageService.getClasses();

    expect(classes).toEqual([{ name: "Local" }]);
  });
});
