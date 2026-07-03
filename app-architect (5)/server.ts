import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for simple product scraping
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Simple fetch (might be blocked by bot protection on major sites)
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract general OpenGraph or standard meta tags
      let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
      let image = $('meta[property="og:image"]').attr('content') || '';
      
      // Look for first large image if og:image is missing
      if (!image) {
        $('img').each((i, el) => {
          const src = $(el).attr('src');
          if (src && !src.includes('icon') && !src.includes('logo')) {
             if (src.startsWith('http')) {
                 image = src;
                 return false; // break loop
             }
          }
        });
      }

      // Example specific logic for common Chinese sites if possible (often needs JS rendering, this is just best effort)
      if (url.includes('taobao.com') || url.includes('1688.com')) {
          // It's likely blocked or dynamic, so title might be generic.
          // Just pass whatever we found, or a fallback.
      }

      res.json({ 
        success: true, 
        data: {
          name: title.trim().substring(0, 100), // Trim to a reasonable length
          image: image,
          // Extracting colors reliably requires site-specific scraping or JS rendering.
          // Returning empty to let user fill or add mock if needed.
          colors: [] 
        }
      });

    } catch (error: any) {
      console.error("Scraping error:", error.message);
      res.status(500).json({ error: "Failed to fetch data from URL. The site might have bot protection." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
