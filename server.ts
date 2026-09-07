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

  // Body parser for API endpoints
  app.use(express.json());

  // Healthcheck endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const LEADERBOARD_FILE = path.join(process.cwd(), "data", "leaderboard.json");

  function readLeaderboardData(): any[] {
    try {
      if (fs.existsSync(LEADERBOARD_FILE)) {
        const raw = fs.readFileSync(LEADERBOARD_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Could not read leaderboard file:", e);
    }
    return [];
  }

  function writeLeaderboardData(data: any[]) {
    try {
      const dir = path.dirname(LEADERBOARD_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write leaderboard data:", e);
    }
  }

  // GET /api/leaderboard - Returns real registered website users only (owner permanently excluded)
  app.get("/api/leaderboard", (req, res) => {
    const rawPlayers = readLeaderboardData();
    const players = rawPlayers.filter(
      (p: any) =>
        !p.isOwner &&
        (!p.email || p.email.toLowerCase() !== "c65043679@gmail.com") &&
        p.displayName !== "Gordon Freeman"
    );
    res.json({ players });
  });

  // POST /api/leaderboard - Upserts real players (owner is permanently excluded from competition standings)
  app.post("/api/leaderboard", (req, res) => {
    const body = req.body;
    if (!body || !body.uid) {
      return res.status(400).json({ error: "Missing uid in request body" });
    }

    const currentPlayers = readLeaderboardData();
    const isOwner =
      (body.email && body.email.toLowerCase() === "c65043679@gmail.com") ||
      body.isOwner === true ||
      body.displayName === "Gordon Freeman";

    if (isOwner) {
      // Owner is permanently excluded from competition standings
      const purged = currentPlayers.filter(
        (p: any) =>
          !p.isOwner &&
          (!p.email || p.email.toLowerCase() !== "c65043679@gmail.com") &&
          p.displayName !== "Gordon Freeman"
      );
      if (purged.length !== currentPlayers.length) {
        writeLeaderboardData(purged);
      }
      return res.json({
        success: true,
        isOwner: true,
        excluded: true,
        message: "Owner account is permanently hidden from leaderboard competition",
        players: purged
      });
    }

    const finalName = body.displayName || "Combine Soldier";
    const isPoisonZombie =
      finalName.toLowerCase().trim() === "poison zombie" ||
      finalName.toLowerCase().trim() === "poision zombie";

    const totalScore = isPoisonZombie
      ? 5000
      : typeof body.totalScore === "number"
      ? body.totalScore
      : (body.achievementXp || 0) + (body.gamePoints || 0);
    const gamePoints = isPoisonZombie
      ? 1000
      : typeof body.gamePoints === "number"
      ? body.gamePoints
      : 0;
    const achievementXp = isPoisonZombie
      ? 4000
      : typeof body.achievementXp === "number"
      ? body.achievementXp
      : 0;
    const gamesPlayed = isPoisonZombie
      ? 0
      : typeof body.gamesPlayed === "number"
      ? body.gamesPlayed
      : 0;
    const achievementsCount = isPoisonZombie
      ? 0
      : typeof body.achievementsCount === "number"
      ? body.achievementsCount
      : 0;

    const playerRecord = {
      uid: body.uid,
      displayName: finalName,
      email: body.email || null,
      photoURL: body.photoURL || null,
      equippedAvatar: body.equippedAvatar || "initiate_core",
      totalScore,
      gamePoints,
      achievementXp,
      gamesPlayed,
      achievementsCount,
      title: isPoisonZombie ? "Recruit" : body.title || "Nexus Member",
      avatarBg: body.avatarBg || "bg-gradient-to-br from-indigo-500 to-purple-600",
      isOwner: false,
      updatedAt: new Date().toISOString()
    };

    const existingIndex = currentPlayers.findIndex(
      (p: any) => p.uid === body.uid || (body.email && p.email === body.email)
    );
    if (existingIndex >= 0) {
      currentPlayers[existingIndex] = {
        ...currentPlayers[existingIndex],
        ...playerRecord
      };
    } else {
      currentPlayers.push(playerRecord);
    }

    // Filter out any potential owner entries just in case
    const cleaned = currentPlayers.filter(
      (p: any) =>
        !p.isOwner &&
        (!p.email || p.email.toLowerCase() !== "c65043679@gmail.com") &&
        p.displayName !== "Gordon Freeman"
    );

    writeLeaderboardData(cleaned);
    res.json({ success: true, player: playerRecord, players: cleaned });
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
