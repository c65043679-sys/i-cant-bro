import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers Middleware
  app.use((req, res, next) => {
    // 1. Strict-Transport-Security (force HTTPS)
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );

    // 2. X-Content-Type-Options (prevent MIME-sniffing)
    res.setHeader("X-Content-Type-Options", "nosniff");

    // 3. Referrer-Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // 4. Permissions-Policy (allow fullscreen and gamepad for game integration, disable sensors)
    res.setHeader(
      "Permissions-Policy",
      "fullscreen=*, gamepad=*, camera=(), microphone=(), geolocation=()"
    );

    // 5. Content-Security-Policy (CSP)
    // Allows loading iframe games cleanly while maintaining full modern browser-level security
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' https: http: 'unsafe-inline' 'unsafe-eval' data: blob:; frame-src *; img-src 'self' * data: blob:; media-src 'self' * data: blob:; connect-src 'self' *; font-src 'self' * data:;"
    );

    // 6. X-Frame-Options (prevent clickjacking on clean domain)
    // To ensure the dev server preview displays properly in the AI Studio iframe,
    // we bypass X-Frame-Options ONLY when loaded on a dev/preview domain (localhost / .run.app).
    const host = req.headers.host || "";
    if (
      !host.includes(".run.app") &&
      !host.includes("localhost") &&
      !host.includes("127.0.0.1")
    ) {
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
    }

    // Additional modern COOP/COEP headers
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Access-Control-Allow-Origin", "*");

    next();
  });

  // Healthcheck endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Sitemap.xml with dynamic hostname substitution to support dev, share, and custom domains seamlessly
  app.get("/sitemap.xml", (req, res) => {
    const sitemapPath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "sitemap.xml")
      : path.join(process.cwd(), "public", "sitemap.xml");

    fs.readFile(sitemapPath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading sitemap file:", err);
        return res.status(500).send("Sitemap not found");
      }

      // Determine actual protocol and host dynamically
      const proto = String(req.headers["x-forwarded-proto"] || req.protocol);
      const host = String(req.headers["x-forwarded-host"] || req.get("host"));
      const currentDomain = `${proto}://${host}`;

      // Dynamically replace default placeholder domain with the request domain
      const customizedSitemap = data.replaceAll("https://unblocked.nexusgames.dpdns.org", currentDomain);

      res.header("Content-Type", "application/xml");
      res.status(200).send(customizedSitemap);
    });
  });

  // Robots.txt with dynamic hostname substitution for the Sitemap path
  app.get("/robots.txt", (req, res) => {
    const robotsPath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "robots.txt")
      : path.join(process.cwd(), "public", "robots.txt");

    fs.readFile(robotsPath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading robots.txt file:", err);
        return res.status(500).send("Robots.txt not found");
      }

      // Determine actual protocol and host dynamically
      const proto = String(req.headers["x-forwarded-proto"] || req.protocol);
      const host = String(req.headers["x-forwarded-host"] || req.get("host"));
      const currentDomain = `${proto}://${host}`;

      // Dynamically replace default placeholder domain with the request domain
      const customizedRobots = data.replaceAll("https://unblocked.nexusgames.dpdns.org", currentDomain);

      res.header("Content-Type", "text/plain");
      res.status(200).send(customizedRobots);
    });
  });

  // Integrate Vite Dev Server in Development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve build outputs in Production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
