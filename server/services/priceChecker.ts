import cron from 'node-cron';
import { storage } from '../storage';
import { emailService } from './email';
import axios from 'axios';
import * as cheerio from 'cheerio';

class PriceCheckerService {
  private isRunning = false;
  private cronJob: cron.ScheduledTask | null = null;

  // Scrape product price from URL
  private async scrapePrice(url: string, platform: string): Promise<{ price: string; name?: string }> {
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(data);
      let price = '0.00';
      let name = '';

      if (platform === 'Amazon') {
        // Try multiple Amazon price selectors
        const priceSelectors = [
          '.a-price-whole',
          '#priceblock_ourprice',
          '#priceblock_dealprice',
          '.a-price .a-offscreen',
          '#price_inside_buybox',
          'span.a-price.a-text-price span.a-offscreen',
        ];

        for (const selector of priceSelectors) {
          const priceText = $(selector).first().text().trim();
          if (priceText) {
            price = priceText.replace(/[^0-9.]/g, '');
            if (price && parseFloat(price) > 0) break;
          }
        }

        name = $('#productTitle').text().trim();
      } else if (platform === 'Flipkart') {
        // Try multiple Flipkart price selectors
        const priceSelectors = [
          '._30jeq3._16Jk6d',
          'div[class*="Nx9bqj"]',
          '._16Jk6d',
          '._30jeq3',
        ];

        for (const selector of priceSelectors) {
          const priceText = $(selector).first().text().trim();
          if (priceText) {
            price = priceText.replace(/[^0-9.]/g, '');
            if (price && parseFloat(price) > 0) break;
          }
        }

        name = $('.B_NuCI').text().trim() || $('.VU-Tmb').text().trim();
      }

      if (!price || parseFloat(price) === 0) {
        throw new Error('Price not found');
      }

      return { price, name };
    } catch (error) {
      console.error(`Scraping failed for ${url}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  // Check a single product and send notification if price dropped
  private async checkProduct(product: any): Promise<void> {
    try {
      console.log(`🔍 Checking product: ${product.productName} (ID: ${product.id})`);

      // Check if tracking has expired
      const now = new Date();
      const endDate = new Date(product.trackingEndDate);
      if (now > endDate) {
        console.log(`⏰ Tracking expired for product ID ${product.id}. Deactivating...`);
        await storage.toggleActive(product.userId, product.id, false);
        return;
      }

      // Scrape current price
      const { price: currentPrice } = await this.scrapePrice(product.productUrl, product.platform);
      const currentPriceNum = parseFloat(currentPrice);
      const lastPriceNum = parseFloat(product.lastCheckedPrice);

      console.log(`💰 Price check - Last: ₹${lastPriceNum}, Current: ₹${currentPriceNum}`);

      // Always update price history for tracking
      await storage.updateProductPrice(product.id, currentPriceNum);

      // Check if price dropped
      if (currentPriceNum < lastPriceNum) {
        const savings = (lastPriceNum - currentPriceNum).toFixed(2);
        console.log(`🎉 PRICE DROP DETECTED! Saved: ₹${savings}`);

        // Get user email (you'll need to add this to your schema)
        // For now, we'll use a default or you can add an email field to products
        const userEmail = process.env.DEFAULT_NOTIFICATION_EMAIL || 'user@example.com';

        // Send email notification
        const emailSent = await emailService.sendPriceDropAlert({
          to: userEmail,
          productName: product.productName,
          productUrl: product.productUrl,
          oldPrice: lastPriceNum.toFixed(2),
          newPrice: currentPriceNum.toFixed(2),
          savings: savings,
          imageUrl: product.imageUrl,
        });

        if (emailSent) {
          console.log(`📧 Email notification sent for product ID ${product.id}`);
        }
      } else if (currentPriceNum > lastPriceNum) {
        console.log(`📈 Price increased by ₹${(currentPriceNum - lastPriceNum).toFixed(2)}`);
      } else {
        console.log(`➡️ Price unchanged`);
      }
    } catch (error) {
      console.error(`❌ Error checking product ${product.id}:`, error instanceof Error ? error.message : error);
    }
  }

  // Main check function that runs on schedule
  private async checkAllProducts(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Price check already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('\n🚀 Starting scheduled price check...');
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);

    try {
      const activeProducts = await storage.getAllActiveProducts();
      console.log(`📦 Found ${activeProducts.length} active products to check`);

      if (activeProducts.length === 0) {
        console.log('No active products to check');
        return;
      }

      // Check each product (with a small delay between checks to avoid rate limiting)
      for (let i = 0; i < activeProducts.length; i++) {
        const product = activeProducts[i];
        await this.checkProduct(product);

        // Add delay between requests to avoid rate limiting
        if (i < activeProducts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
      }

      console.log('✅ Price check completed successfully\n');
    } catch (error) {
      console.error('❌ Error during scheduled price check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Start the scheduler
  start(): void {
    if (this.cronJob) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    // Run every minute: '* * * * *'
    // For testing every 10 seconds: '*/10 * * * * *'
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkAllProducts();
    });

    console.log('🟢 Price checker scheduler started - Running every minute');
    console.log('📊 Will check all active products for price changes');

    // Optional: Run immediately on start (comment out if you don't want this)
    // this.checkAllProducts();
  }

  // Stop the scheduler
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🔴 Price checker scheduler stopped');
    }
  }

  // Manual trigger for testing
  async triggerManualCheck(): Promise<void> {
    console.log('🔧 Manual price check triggered');
    await this.checkAllProducts();
  }

  // Get scheduler status
  getStatus(): { running: boolean; checking: boolean } {
    return {
      running: this.cronJob !== null,
      checking: this.isRunning,
    };
  }
}

export const priceCheckerService = new PriceCheckerService();
