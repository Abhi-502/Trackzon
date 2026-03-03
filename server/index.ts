// server/index.ts
import 'dotenv/config'; // Load .env variables
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { priceCheckerService } from "./services/priceChecker";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./auth-utils";
import { storage } from "./storage";

const app = express();
const httpServer = createServer(app);
const jwtSecret = process.env.JWT_SECRET;
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

// Extend IncomingMessage to store raw body
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  provider: "google" | "credentials";
};

// Parse JSON and store raw body
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: false }));
app.use("/api/auth", authRateLimit);

// Logging utility
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// -------------------------
// Google OAuth Login
// -------------------------
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (bearer) return bearer;

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const tokenCookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("auth_token="));

  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null;
}

async function handleGoogleLogin(req: Request, res: Response) {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'ID Token is required' });
  if (!jwtSecret) return res.status(500).json({ message: "JWT secret is not configured" });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new Error('Invalid Google payload');

    const email = payload.email.toLowerCase();
    let userRecord = await storage.findUserByEmail(email);
    if (!userRecord) {
      const [firstName, ...rest] = (payload.name || "").trim().split(" ");
      userRecord = await storage.createUser({
        email,
        firstName: firstName || null,
        lastName: rest.join(" ") || null,
        profileImageUrl: payload.picture || null,
        authProvider: "google",
      });
    } else {
      await storage.touchUserLogin(userRecord.id);
    }

    const user: AuthUser = {
      id: userRecord.id,
      email: userRecord.email,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      profileImageUrl: userRecord.profileImageUrl,
      provider: "google",
    };
    const token = jwt.sign(user, jwtSecret, { expiresIn: "8h" });

    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({ token, user });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(401).json({ message: 'Invalid Google ID token' });
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
  if (!jwtSecret) return res.status(500).json({ message: "JWT secret is not configured" });
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid registration payload" });
  const { email, password, firstName, lastName } = parsed.data;
  const existing = await storage.findUserByEmail(email.toLowerCase());
  if (existing) return res.status(409).json({ message: "User already exists" });

  const passwordHash = hashPassword(password);
  const userRecord = await storage.createUser({
    email: email.toLowerCase(),
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    passwordHash,
    authProvider: "credentials",
  });
  const user: AuthUser = {
    id: userRecord.id,
    email: userRecord.email,
    firstName: userRecord.firstName,
    lastName: userRecord.lastName,
    profileImageUrl: userRecord.profileImageUrl,
    provider: "credentials",
  };
  const token = jwt.sign(user, jwtSecret, { expiresIn: "8h" });
  res.cookie("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
  return res.status(201).json({ token, user });
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  if (!jwtSecret) return res.status(500).json({ message: "JWT secret is not configured" });
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid login payload" });
  const { email, password } = parsed.data;
  const userRecord = await storage.findUserByEmail(email.toLowerCase());
  if (!userRecord || !userRecord.passwordHash) return res.status(401).json({ message: "Invalid credentials" });
  if (!verifyPassword(password, userRecord.passwordHash)) return res.status(401).json({ message: "Invalid credentials" });

  await storage.touchUserLogin(userRecord.id);
  const user: AuthUser = {
    id: userRecord.id,
    email: userRecord.email,
    firstName: userRecord.firstName,
    lastName: userRecord.lastName,
    profileImageUrl: userRecord.profileImageUrl,
    provider: "credentials",
  };
  const token = jwt.sign(user, jwtSecret, { expiresIn: "8h" });
  res.cookie("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
  return res.status(200).json({ token, user });
});

app.post("/api/login", handleGoogleLogin);
app.post("/api/login-google", handleGoogleLogin);
app.post("/api/logout", (_req: Request, res: Response) => {
  res.clearCookie("auth_token", { path: "/" });
  res.status(204).end();
});

// -------------------------
// Auth middleware for /api
// -------------------------
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (
    req.path === "/login" ||
    req.path === "/login-google" ||
    req.path === "/logout" ||
    req.path === "/auth/login" ||
    req.path === "/auth/register" ||
    req.path === "/faqs" ||
    req.path === "/analytics/traffic"
  ) {
    return next();
  }
  if (!jwtSecret) return res.status(500).json({ message: "JWT secret is not configured" });

  const token = getTokenFromRequest(req);

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    (req as any).user = decoded; // Attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// Apply middleware globally to /api routes
app.use('/api', authMiddleware);
app.get("/api/auth/user", (req: Request, res: Response) => {
  return res.json((req as any).user);
});

// -------------------------
// Request logging middleware
// -------------------------
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      log(logLine);
    }
  });

  next();
});

// -------------------------
// Main bootstrap
// -------------------------
(async () => {
  // Register routes
  await registerRoutes(httpServer, app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Start the server
  const port = parseInt(process.env.PORT || "5003", 10);
  const host = process.env.HOST || "0.0.0.0";

  httpServer.listen({ port, host }, () => {
    log(`Server running on http://${host}:${port}`);
    priceCheckerService.start();
    log("Price checker scheduler initialized", "scheduler");
  });
})();
