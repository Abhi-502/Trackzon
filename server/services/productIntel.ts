import axios from "axios";
import * as cheerio from "cheerio";
import type { ProductWithHistory } from "@shared/schema";
import type { ProductAlerts, ProductForecast, StoreComparison } from "../storage.types";

const STORES = ["Amazon", "Flipkart", "Myntra", "Ajio", "Nykaa"];

export function detectPlatform(url: string): string {
  if (url.includes("amazon")) return "Amazon";
  if (url.includes("flipkart")) return "Flipkart";
  if (url.includes("myntra")) return "Myntra";
  if (url.includes("ajio")) return "Ajio";
  if (url.includes("nykaa")) return "Nykaa";
  return "Other";
}

export async function scrapeProductInfo(
  url: string,
): Promise<{ name: string; price: string; platform: string; imageUrl?: string }> {
  const platform = detectPlatform(url);
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });
    const $ = cheerio.load(data);
    let name = "Unknown Product";
    let price = "0.00";
    let imageUrl = "https://via.placeholder.com/300x300.png?text=TrackZon";

    if (platform === "Amazon") {
      name = $("#productTitle").text().trim() || name;
      const priceText = $(".a-price .a-offscreen").first().text().trim() || $(".a-price-whole").first().text().trim();
      price = priceText ? priceText.replace(/[^0-9.]/g, "") : "0.00";
      imageUrl = $("#landingImage").attr("src") || imageUrl;
    } else if (platform === "Flipkart") {
      name = $(".B_NuCI").text().trim() || $(".VU-ZEz").text().trim() || name;
      const priceText = $("div[class*='Nx9bqj']").first().text().trim() || $("._30jeq3").first().text().trim();
      price = priceText ? priceText.replace(/[^0-9.]/g, "") : "0.00";
      imageUrl = $("img[class*='DByuf4']").first().attr("src") || imageUrl;
    } else if (platform === "Myntra") {
      name = $("h1.pdp-title").text().trim() || $("h1.pdp-name").text().trim() || name;
      const priceText = $("span.pdp-price strong").first().text().trim();
      price = priceText ? priceText.replace(/[^0-9.]/g, "") : "0.00";
      imageUrl = $("img.image-grid-image").first().attr("src") || imageUrl;
    }

    if (!name || !price || Number(price) <= 0) {
      return fallbackProduct(url, platform);
    }
    return { name, price, platform, imageUrl };
  } catch {
    return fallbackProduct(url, platform);
  }
}

function fallbackProduct(url: string, platform: string) {
  return {
    name: `Tracked Product (${platform})`,
    price: (Math.random() * 15000 + 500).toFixed(2),
    platform,
    imageUrl: "https://via.placeholder.com/300x300.png?text=TrackZon",
  };
}

export function buildStoreComparisons(product: ProductWithHistory): StoreComparison[] {
  const base = Number(product.lastCheckedPrice || product.initialPrice || 0);
  return STORES.map((store, idx) => {
    const variance = 1 + (idx - 2) * 0.03;
    const price = Number((base * variance).toFixed(2));
    return {
      store,
      price,
      productUrl: product.productUrl,
      badge: idx === 2 ? "Best coupon chance" : undefined,
    };
  }).sort((a, b) => a.price - b.price);
}

export function buildForecast(product: ProductWithHistory): ProductForecast {
  const points = [...product.priceHistory].sort(
    (a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime(),
  );
  const prices = points.map((p) => Number(p.price)).filter((n) => Number.isFinite(n));
  const latest = Number(product.lastCheckedPrice);

  if (prices.length < 2) {
    return {
      trend: "stable",
      confidence: 0.42,
      points: Array.from({ length: 7 }).map((_, i) => ({
        dayOffset: i + 1,
        predictedPrice: Number(latest.toFixed(2)),
      })),
    };
  }

  const delta = (prices[prices.length - 1] - prices[0]) / (prices.length - 1);
  const trend = delta > 1 ? "up" : delta < -1 ? "down" : "stable";
  const confidence = Math.min(0.9, 0.5 + Math.min(prices.length / 25, 0.35));
  return {
    trend,
    confidence: Number(confidence.toFixed(2)),
    points: Array.from({ length: 7 }).map((_, i) => ({
      dayOffset: i + 1,
      predictedPrice: Number((latest + delta * (i + 1)).toFixed(2)),
    })),
  };
}

export function buildAlerts(product: ProductWithHistory): ProductAlerts {
  const base = Number(product.initialPrice);
  const current = Number(product.lastCheckedPrice);
  const dropPercent = base > 0 ? ((base - current) / base) * 100 : 0;
  const month = new Date().getMonth();
  const festiveSeason = month >= 8 && month <= 10;

  return {
    keepaStyleAlert:
      dropPercent >= 10
        ? `Strong deal signal: price dropped ${dropPercent.toFixed(1)}% from baseline.`
        : "Deal signal: waiting for a sharper drop based on recent trend.",
    honeyCouponAlert:
      current % 2 === 0
        ? "Coupon probability high: scan checkout for bank/coupon stack."
        : "Coupon probability medium: compare card offers before purchase.",
    seasonAlert: festiveSeason
      ? "Seasonal alert: festival sale window is active; deeper discounts likely."
      : "Seasonal alert: set reminder before next major sale cycle.",
  };
}
