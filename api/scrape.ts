import * as cheerio from "cheerio";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

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

    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let image = $('meta[property="og:image"]').attr('content') || '';
    
    if (!image) {
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('icon') && !src.includes('logo')) {
           if (src.startsWith('http')) {
               image = src;
               return false;
           }
        }
      });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        name: title.trim().substring(0, 100),
        image: image,
        colors: [] 
      }
    });

  } catch (error) {
    console.error("Scraping error:", error.message);
    res.status(500).json({ error: "Failed to fetch data from URL. The site might have bot protection." });
  }
}
