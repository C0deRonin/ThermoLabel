import { resolveApiBase } from "@/lib/services/apiService";

describe("resolveApiBase", () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    }
  });

  it("uses NEXT_PUBLIC_API_URL when provided", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    expect(resolveApiBase()).toBe("https://api.example.com");
  });

  it("maps github codespaces frontend host to backend 8000 host", () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    const loc = {
      protocol: "https:",
      hostname: "fancy-space-abc123-3000.app.github.dev",
    };

    expect(resolveApiBase(loc)).toBe("https://fancy-space-abc123-8000.app.github.dev");
  });
});
