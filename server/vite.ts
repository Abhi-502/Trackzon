// server/vite.ts
import { type Express } from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { type Server } from "http";
import viteConfig from "../vite.config";

export async function setupVite(server: Server, app: Express) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { server, path: "/vite-hmr" } },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // SPA catch-all route using regex
  app.get(/.*/, async (req, res, next) => {
    try {
      const clientTemplate = path.resolve(import.meta.dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const page = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}