import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

const MEGAN_BASE_URL = "https://apis.megan.qzz.io/api/v2";

async function proxyMegan(path: string, params?: Record<string, string>) {
  const apiKey = process.env.MEGAN_API_KEY;
  if (!apiKey) throw new Error("Megan Movies API is not configured");

  const url = new URL(`${MEGAN_BASE_URL}/${path.replace(/^\//, "")}`);
  url.searchParams.set("api_key", apiKey);
  Object.entries(params || {}).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error("Megan Movies API request failed") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return payload;
}

function sendProxyError(res: express.Response, error: unknown) {
  const status = typeof error === "object" && error && "status" in error && typeof error.status === "number"
    ? error.status
    : 502;
  const message = error instanceof Error ? error.message : "Upstream request failed";
  res.status(status).json({ error: message });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });

  app.get("/api/movies/home", async (_req, res) => {
    try {
      res.json(await proxyMegan("movies/home"));
    } catch (error) {
      sendProxyError(res, error);
    }
  });

  app.get("/api/movies/details/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    if (!/^\d+$/.test(id) || !["movie", "tv"].includes(type)) {
      res.status(400).json({ error: "Invalid title reference" });
      return;
    }

    try {
      res.json(await proxyMegan(`movies/${type}/${id}`));
    } catch (error) {
      sendProxyError(res, error);
    }
  });

  app.get("/api/movies/stream/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const { season, episode } = req.query;
    if (!/^\d+$/.test(id) || !["movie", "tv"].includes(type)) {
      res.status(400).json({ error: "Invalid title reference" });
      return;
    }
    if (type === "tv" && (!/^[1-9]\d*$/.test(String(season || "")) || !/^[1-9]\d*$/.test(String(episode || "")))) {
      res.status(400).json({ error: "TV streams require positive season and episode numbers" });
      return;
    }

    try {
      const params: Record<string, string> = { subjectId: id };
      if (type === "tv") {
        params.se = String(season);
        params.ep = String(episode);
      }
      res.json(await proxyMegan("moviebox/stream", params));
    } catch (error) {
      sendProxyError(res, error);
    }
  });

  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
