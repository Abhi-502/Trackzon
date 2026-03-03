# 🚀 Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Email (Required for notifications)

1. **Create a `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

2. **Get Gmail App Password**:
   - Go to your Google Account: https://myaccount.google.com/security
   - Enable 2-Factor Authentication if not already enabled
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and generate a password
   - Copy the 16-character password

3. **Edit `.env` file**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-here
DEFAULT_NOTIFICATION_EMAIL=your-email@gmail.com
```

## Step 3: Setup Database
```bash
npm run db:push
```

## Step 4: Run the Application
```bash
npm run dev
```

Visit: http://localhost:5000

## ✅ Testing the Price Checker

Once the app is running, the price checker will automatically:
- ✅ Start when the server starts
- ✅ Check prices every minute
- ✅ Send email notifications on price drops

### Manual Testing

1. **Add a product** from Amazon or Flipkart
2. **Wait 1 minute** for the first check
3. **Check server logs** to see:
   ```
   🚀 Starting scheduled price check...
   📦 Found X active products to check
   🔍 Checking product: Product Name (ID: 1)
   💰 Price check - Last: ₹1000, Current: ₹950
   🎉 PRICE DROP DETECTED! Saved: ₹50
   📧 Email notification sent
   ✅ Price check completed successfully
   ```

### Admin Endpoints (for manual testing)

After logging in, you can test these endpoints with curl or Postman:

1. **Manual Price Check**:
```bash
curl -X POST http://localhost:5000/api/admin/check-prices \
  -H "Cookie: your-session-cookie"
```

2. **Scheduler Status**:
```bash
curl http://localhost:5000/api/admin/scheduler-status \
  -H "Cookie: your-session-cookie"
```

3. **Test Email**:
```bash
curl -X POST http://localhost:5000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"email": "your-email@gmail.com"}'
```

## 📝 Common Issues

### Email Not Sending?
- ✅ Check Gmail App Password is correct (not your regular password)
- ✅ Make sure 2FA is enabled on your Google Account
- ✅ Check server logs for error messages
- ✅ Try the test email endpoint

### Price Not Updating?
- ✅ Wait at least 1 minute after adding a product
- ✅ Check if product is active (not expired)
- ✅ Check server logs for scraping errors
- ✅ Some websites block scraping - test with different products

### Scheduler Not Running?
- ✅ Look for "Price checker scheduler started" in startup logs
- ✅ Use the status endpoint to verify
- ✅ Check for any startup errors

## 🎯 What Happens Every Minute?

```
Minute 0: Scheduler runs
  ↓
Check all active products
  ↓
Scrape current price from website
  ↓
Compare with last price
  ↓
If price dropped → Send email + Update database
If same → Just update database
If increased → Update database
  ↓
Wait for next minute
```

## 📧 Email Notification Preview

When a price drops, users receive a beautiful HTML email with:
- 🎉 Price drop alert header
- 📸 Product image
- 💰 Old price vs New price comparison
- 💵 Savings amount
- 🔗 "Buy Now" button
- 📊 Clean, professional design

## 🔄 Modifying Check Frequency

Edit `server/services/priceChecker.ts`:

```typescript
// Every minute (current)
this.cronJob = cron.schedule('* * * * *', ...)

// Every 5 minutes
this.cronJob = cron.schedule('*/5 * * * *', ...)

// Every 30 minutes
this.cronJob = cron.schedule('*/30 * * * *', ...)

// Every hour
this.cronJob = cron.schedule('0 * * * *', ...)

// Every 6 hours
this.cronJob = cron.schedule('0 */6 * * *', ...)
```

## 🎉 You're All Set!

The price tracker is now running every minute. Add some products and watch the magic happen! 🚀
