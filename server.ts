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
  const BROADCAST_FILE = path.join(process.cwd(), "data", "broadcast.json");
  const PARTY_FILE = path.join(process.cwd(), "data", "party.json");
  const EFFECTS_FILE = path.join(process.cwd(), "data", "effects.json");

  function readJsonFile<T>(filePath: string, fallback: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`Could not read ${filePath}:`, e);
    }
    return fallback;
  }

  function writeJsonFile(filePath: string, data: any) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error(`Failed to write ${filePath}:`, e);
    }
  }

  // Real-time Server-Sent Events (SSE) clients
  const sseClients = new Set<express.Response>();

  function sendSseEvent(type: string, data: any) {
    const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }

  // Periodic heartbeat every 25 seconds for proxies (Cloudflare, nginx)
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(": keepalive\n\n");
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }, 25000);

  // GET /api/live-stream - Server-Sent Events stream for instant real-time broadcasts
  app.get("/api/live-stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }

    const broadcast = readJsonFile(BROADCAST_FILE, { message: "", updatedAt: "", updatedBy: "" });
    const party = readJsonFile(PARTY_FILE, { mode: "", timestamp: 0, triggeredBy: "" });
    const effects = readJsonFile(EFFECTS_FILE, { godModeAura: false, matrixRain: false });

    // Send initial state snapshot to newly connected client
    res.write(`data: ${JSON.stringify({ type: "init", broadcast, party, effects })}\n\n`);

    sseClients.add(res);

    req.on("close", () => {
      sseClients.delete(res);
    });
  });

  // GET /api/broadcast
  app.get("/api/broadcast", (req, res) => {
    const data = readJsonFile(BROADCAST_FILE, { message: "", updatedAt: "", updatedBy: "" });
    res.json(data);
  });

  // POST /api/broadcast - Publishes live announcement notice
  app.post("/api/broadcast", (req, res) => {
    const { message, updatedBy } = req.body || {};
    const broadcastData = {
      message: typeof message === "string" ? message.trim() : "",
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || "alexsarsero@gmail.com"
    };
    writeJsonFile(BROADCAST_FILE, broadcastData);
    sendSseEvent("broadcast", broadcastData);
    res.json({ success: true, ...broadcastData });
  });

  // DELETE /api/broadcast - Clears announcement notice
  app.delete("/api/broadcast", (req, res) => {
    const broadcastData = {
      message: "",
      updatedAt: new Date().toISOString(),
      updatedBy: "alexsarsero@gmail.com"
    };
    writeJsonFile(BROADCAST_FILE, broadcastData);
    sendSseEvent("broadcast", broadcastData);
    res.json({ success: true, message: "" });
  });

  // GET /api/party - Get latest celebration trigger
  app.get("/api/party", (req, res) => {
    const partyData = readJsonFile(PARTY_FILE, { mode: "", timestamp: 0, triggeredBy: "" });
    res.json(partyData);
  });

  // POST /api/party - Broadcast celebration fireworks / confetti to all visitors
  app.post("/api/party", (req, res) => {
    const { mode, triggeredBy } = req.body || {};
    const partyData = {
      mode: mode === "cannon" ? "cannon" : "fireworks",
      timestamp: Date.now(),
      triggeredBy: triggeredBy || "alexsarsero@gmail.com"
    };
    writeJsonFile(PARTY_FILE, partyData);
    sendSseEvent("party", partyData);
    res.json({ success: true, ...partyData });
  });

  // GET /api/effects - Get visual shader/aura effects
  app.get("/api/effects", (req, res) => {
    const effectsData = readJsonFile(EFFECTS_FILE, { godModeAura: false, matrixRain: false });
    res.json(effectsData);
  });

  // POST /api/effects - Set visual shader/aura effects
  app.post("/api/effects", (req, res) => {
    const current = readJsonFile(EFFECTS_FILE, { godModeAura: false, matrixRain: false });
    const { godModeAura, matrixRain } = req.body || {};
    const updated = {
      godModeAura: typeof godModeAura === "boolean" ? godModeAura : current.godModeAura,
      matrixRain: typeof matrixRain === "boolean" ? matrixRain : current.matrixRain,
      updatedAt: new Date().toISOString()
    };
    writeJsonFile(EFFECTS_FILE, updated);
    sendSseEvent("effects", updated);
    res.json({ success: true, ...updated });
  });

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

  // Helper to check if player is an owner or deleted owner account
  function isOwnerRecord(p: any): boolean {
    if (!p) return false;
    const email = (p.email || "").toLowerCase().trim();
    return (
      p.isOwner === true ||
      email === "alexsarsero@gmail.com" ||
      email === "c65043679@gmail.com" ||
      p.displayName === "Gordon Freeman"
    );
  }

  // GET /api/leaderboard - Returns real registered website users only (owner permanently excluded)
  app.get("/api/leaderboard", (req, res) => {
    const rawPlayers = readLeaderboardData();
    const players = rawPlayers
      .filter((p: any) => !isOwnerRecord(p))
      .map((p: any) => {
        if ((p.displayName || "").toLowerCase().trim() === "manhack") {
          return {
            ...p,
            totalScore: 0,
            gamePoints: 0,
            achievementXp: 0,
            gamesPlayed: 0,
            achievementsCount: 0,
            title: "Recruit"
          };
        }
        return p;
      });
    res.json({ players });
  });

  // POST /api/leaderboard/reset-player - Resets target player account XP and points
  app.post("/api/leaderboard/reset-player", (req, res) => {
    const { targetName } = req.body || {};
    const nameToReset = (targetName || "Manhack").toLowerCase().trim();
    const currentPlayers = readLeaderboardData();
    let updated = false;

    const modified = currentPlayers.map((p: any) => {
      const pName = (p.displayName || "").toLowerCase().trim();
      if (pName === nameToReset) {
        updated = true;
        return {
          ...p,
          totalScore: 0,
          gamePoints: 0,
          achievementXp: 0,
          gamesPlayed: 0,
          achievementsCount: 0,
          title: "Recruit",
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    if (updated) {
      writeLeaderboardData(modified);
    }
    res.json({ success: true, updated, players: modified.filter((p: any) => !isOwnerRecord(p)) });
  });

  // POST /api/leaderboard - Upserts real players (owner is permanently excluded from competition standings)
  app.post("/api/leaderboard", (req, res) => {
    const body = req.body;
    if (!body || !body.uid) {
      return res.status(400).json({ error: "Missing uid in request body" });
    }

    const currentPlayers = readLeaderboardData();
    const isOwner = isOwnerRecord(body);

    if (isOwner) {
      // Owner is permanently excluded from competition standings
      const purged = currentPlayers.filter((p: any) => !isOwnerRecord(p));
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
    const isManhack = finalName.toLowerCase().trim() === "manhack";
    const isPoisonZombie =
      finalName.toLowerCase().trim() === "poison zombie" ||
      finalName.toLowerCase().trim() === "poision zombie";

    const totalScore = isManhack
      ? 0
      : isPoisonZombie
      ? 5000
      : typeof body.totalScore === "number"
      ? body.totalScore
      : (body.achievementXp || 0) + (body.gamePoints || 0);
    const gamePoints = isManhack
      ? 0
      : isPoisonZombie
      ? 1000
      : typeof body.gamePoints === "number"
      ? body.gamePoints
      : 0;
    const achievementXp = isManhack
      ? 0
      : isPoisonZombie
      ? 4000
      : typeof body.achievementXp === "number"
      ? body.achievementXp
      : 0;
    const gamesPlayed = isManhack
      ? 0
      : isPoisonZombie
      ? 0
      : typeof body.gamesPlayed === "number"
      ? body.gamesPlayed
      : 0;
    const achievementsCount = isManhack
      ? 0
      : isPoisonZombie
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
      title: isManhack ? "Recruit" : isPoisonZombie ? "Recruit" : body.title || "Nexus Member",
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
    const cleaned = currentPlayers.filter((p: any) => !isOwnerRecord(p));

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
