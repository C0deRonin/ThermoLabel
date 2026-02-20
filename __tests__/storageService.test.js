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

describe("storageService.saveProject", () => {
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

  it("returns ok=true when API save succeeds even if local cache write fails", async () => {
    apiService.saveProject.mockResolvedValue({ ok: true });

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    setItemSpy.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const result = await storageService.saveProject(project);

    expect(result.ok).toBe(true);
    expect(result.source).toBe("api");

    setItemSpy.mockRestore?.();
  });

  it("returns quota reason when API save fails and local save hits quota", async () => {
    apiService.saveProject.mockRejectedValue(new Error("backend down"));

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    setItemSpy.mockImplementation(() => {
      const err = new Error("storage quota exceeded");
      err.name = "QuotaExceededError";
      throw err;
    });

    const result = await storageService.saveProject(project);

    expect(result).toEqual({ ok: false, reason: "quota" });

    setItemSpy.mockRestore?.();
  });

  it("falls back to metadata-only local save when full local project save fails", async () => {
    apiService.saveProject.mockRejectedValue(new Error("backend down"));

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    setItemSpy
      .mockImplementationOnce(() => {
        const err = new Error("storage quota exceeded");
        err.name = "QuotaExceededError";
        throw err;
      })
      .mockImplementation(() => {});

    const result = await storageService.saveProject(project);

    expect(result.ok).toBe(true);
    expect(result.source).toBe("local-meta");

    setItemSpy.mockRestore?.();
  });
});
