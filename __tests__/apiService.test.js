import apiService from "@/lib/services/apiService";

describe("apiService proxy routing", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("routes project save through same-origin /api/proxy", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    await apiService.saveProject({ id: "p1" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/proxy/projects",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("routes classes read through same-origin /api/proxy", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ classes: [] }),
    });

    await apiService.getClasses();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/proxy/settings/classes",
      expect.any(Object)
    );
  });
});
