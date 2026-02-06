import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Serve from the dist root (no nested `public` folder required)
  const distPath = path.resolve(__dirname);
  if (!fs.existsSync(path.resolve(distPath, "index.html"))) {
    throw new Error(
      `Could not find the built client files in: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
