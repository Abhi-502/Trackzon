import { type Express, type Request, type Response } from "express";
import { type Server } from "http";
import { storage, storageEngine } from "./storage";
import { z } from "zod";
import { priceCheckerService } from "./services/priceChecker";
import { emailService } from "./services/email";
import { api } from "@shared/routes";

export async function registerRoutes(httpServer: Server, app: Express) {
  const getUserId = (req: Request): string => {
    const user = (req as any).user as { id?: string; email?: string } | undefined;
    return user?.id || user?.email || "anonymous";
  };

  // -------------------------
  // Products routes
  // -------------------------
  app.get(api.products.list.path, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const products = await storage.getProducts(userId);
      res.json(products);
    } catch {
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  app.post(api.products.track.path, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const input = api.products.track.input.parse(req.body);
      const product = await storage.trackProduct(userId, input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to track product" });
    }
  });

  app.post(api.products.trackMultiple.path, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const input = api.products.trackMultiple.input.parse(req.body);
      const products = await storage.trackMultipleProducts(userId, input);
      res.status(201).json(products);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to track multiple products" });
    }
  });

  app.delete(api.products.delete.path, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      await storage.deleteProduct(userId, Number(req.params.id));
      res.status(204).end();
    } catch {
      res.status(404).json({ message: "Not found" });
    }
  });

  app.patch(api.products.toggleActive.path, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const input = api.products.toggleActive.input.parse(req.body);
      const product = await storage.toggleActive(userId, Number(req.params.id), input.isActive);
      res.status(200).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(404).json({ message: "Not found" });
    }
  });

  app.get("/api/insights/compare/:id", async (req: Request, res: Response) => {
    const comparisons = await storage.getStoreComparisons(Number(req.params.id));
    res.json({ comparisons });
  });

  app.get("/api/insights/forecast/:id", async (req: Request, res: Response) => {
    const forecast = await storage.getProductForecast(Number(req.params.id));
    res.json(forecast);
  });

  app.get("/api/insights/alerts/:id", async (req: Request, res: Response) => {
    const alerts = await storage.getProductAlerts(Number(req.params.id));
    res.json(alerts);
  });

  app.get("/api/analytics/traffic", async (_req: Request, res: Response) => {
    const stats = await storage.getPublicTrafficStats();
    res.json({ ...stats, storage: storageEngine });
  });

  app.get("/api/faqs", (_req: Request, res: Response) => {
    res.json([
      {
        question: "How is this different from Keepa/Honey?",
        answer:
          "TrackZon combines price history, coupon probability, seasonal alerts, and cross-store comparison in one dashboard.",
      },
      {
        question: "Does forecast guarantee future price?",
        answer:
          "No. Forecast is an AI-style trend projection based on tracked historical prices and should be used as guidance only.",
      },
      {
        question: "Can multiple users use the same deployment?",
        answer:
          "Yes. Each account has isolated product tracking and authenticated API access.",
      },
      {
        question: "Can I use MongoDB Atlas?",
        answer: "Yes. Set DATA_STORE=mongodb and configure MONGODB_URI in your environment.",
      },
    ]);
  });

  // -------------------------
  // Admin/Test routes
  // -------------------------
  app.post('/api/admin/check-prices', async (_req, res) => {
    priceCheckerService.triggerManualCheck().catch(console.error);
    res.json({ message: 'Price check started', status: priceCheckerService.getStatus() });
  });

  app.get('/api/admin/scheduler-status', async (_req, res) => {
    res.json(priceCheckerService.getStatus());
  });

  app.post('/api/admin/test-email', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const sent = await emailService.sendTestEmail(email);
    res.json({ success: sent });
  });

  return httpServer;
}
