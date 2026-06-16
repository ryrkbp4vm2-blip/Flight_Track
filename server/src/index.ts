import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import compression from "compression";
import { config } from "./config.js";
import { startPolling, getMil, getHealth } from "./milCache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Built static assets live in web/dist (one level up from server/).
const webDist = path.resolve(__dirname, "../../web/dist");

const app = express();
app.use(compression());

// --- API ------------------------------------------------------------------

app.get("/api/mil", (_req, res) => {
  const health = getHealth();
  if (health.ageMs !== null) res.setHeader("X-Data-Age-Ms", String(health.ageMs));
  res.setHeader("X-Data-Sample", health.sample ? "1" : "0");
  // Always go to network for live data; never let a SW or proxy cache it.
  res.setHeader("Cache-Control", "no-store");
  res.json(getMil());
});

app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(getHealth());
});

// --- Static PWA + SPA fallback -------------------------------------------

if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  // SPA fallback for client-side routes (but never for /api/*).
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res
      .status(200)
      .type("text/plain")
      .send(
        "Military Flight Tracker API is running.\n" +
          "Build the web app (npm run build) to serve the PWA from here.\n" +
          "Live data: /api/mil   Health: /api/health\n",
      );
  });
}

startPolling();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[server] listening on http://localhost:${config.port}  ` +
      `(upstream=${config.upstreamUrl}, poll=${config.pollIntervalMs}ms, ` +
      `sample=${config.useSampleData ? "on" : "off"})`,
  );
});
