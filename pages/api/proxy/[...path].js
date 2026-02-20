export const config = {
  api: {
    bodyParser: false,
  },
};

function resolveBackendBase() {
  if (process.env.BACKEND_INTERNAL_URL) {
    return process.env.BACKEND_INTERNAL_URL;
  }

  if (process.env.NODE_ENV === "production" || process.env.RUNNING_IN_DOCKER === "1") {
    return "http://backend:8000";
  }

  return "http://localhost:8000";
}

async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
    const path = Array.isArray(req.query.path) ? req.query.path.join("/") : "";
    const query = new URLSearchParams(req.query);
    query.delete("path");
    const qs = query.toString();
    const target = `${resolveBackendBase()}/api/${path}${qs ? `?${qs}` : ""}`;

    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers["content-length"];

    const method = req.method || "GET";
    const init = { method, headers };

    if (!["GET", "HEAD"].includes(method)) {
      const body = await readRawBody(req);
      if (body.length > 0) init.body = body;
    }

    const upstream = await fetch(target, init);
    const text = await upstream.text();

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-encoding") return;
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });
    res.send(text);
  } catch (error) {
    res.status(502).json({ detail: `Proxy error: ${error.message}` });
  }
}
