import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth routes
  registerAuthRoutes(app);

  app.get(api.products.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userProducts = await storage.getProducts(userId);
      res.json(userProducts);
    } catch (e) {
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  app.post(api.products.track.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.products.track.input.parse(req.body);
      const product = await storage.trackProduct(userId, input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to track product" });
    }
  });

  app.post(api.products.trackMultiple.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.products.trackMultiple.input.parse(req.body);
      const products = await storage.trackMultipleProducts(userId, input);
      res.status(201).json(products);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to track multiple products" });
    }
  });

  app.delete(api.products.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteProduct(userId, Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(404).json({ message: "Not found" });
    }
  });

  app.patch(api.products.toggleActive.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.products.toggleActive.input.parse(req.body);
      const product = await storage.toggleActive(userId, Number(req.params.id), input.isActive);
      res.status(200).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      res.status(404).json({ message: "Not found" });
    }
  });

  return httpServer;
}
