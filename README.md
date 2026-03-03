# 🛒 TrackZon - E-commerce Price Tracker

A full-stack price tracking application that monitors product prices across Amazon, Flipkart, and Myntra. Get instant email notifications when prices drop!

## ✨ Features

- 🔐 **User Authentication** - Secure login/registration system
- 📊 **Price Tracking** - Track unlimited products from multiple e-commerce platforms
- 📧 **Email Notifications** - Automatic alerts when prices drop
- 📈 **Price History** - View complete price history for tracked products
- ⏰ **Automated Checking** - Prices checked every minute automatically
- 🎯 **Multi-Platform Support** - Amazon, Flipkart, and more
- 📱 **Responsive UI** - Beautiful interface built with React + Tailwind CSS

## 🚀 Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Wouter (routing)
- React Query (data fetching)
- Shadcn/ui (components)

### Backend
- Node.js + Express
- PostgreSQL + Drizzle ORM
- Node-cron (scheduling)
- Nodemailer (email notifications)
- Cheerio + Axios (web scraping)

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Gmail account (for email notifications)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Amazon-UI-Clone
```

2. **Install dependencies**
```bash
npm install
npm install node-cron nodemailer @types/node-cron @types/nodemailer
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/trackzon

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Default notification email
DEFAULT_NOTIFICATION_EMAIL=user@example.com

# Server
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-secret-key
```

4. **Configure Gmail for Email Notifications**

To send email notifications, you need to set up a Gmail App Password:

   a. Enable 2-Factor Authentication on your Google Account
   
   b. Go to https://myaccount.google.com/apppasswords
   
   c. Generate a new app password for "Mail"
   
   d. Use this 16-character password in your `.env` file as `EMAIL_PASSWORD`

5. **Set up the database**
```bash
npm run db:push
```

6. **Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## 📖 Usage

### For Users

1. **Sign In** - Click "Sign In" on the homepage
2. **Add Products** - Paste product URLs from Amazon or Flipkart
3. **Track Prices** - The system automatically checks prices every minute
4. **Get Notified** - Receive email alerts when prices drop

### Admin/Testing Endpoints

Once authenticated, you can access these admin endpoints:

- **Manual Price Check**: `POST /api/admin/check-prices`
  - Manually trigger a price check for all active products
  
- **Scheduler Status**: `GET /api/admin/scheduler-status`
  - Check if the scheduler is running
  
- **Test Email**: `POST /api/admin/test-email`
  - Send a test email notification
  ```json
  {
    "email": "test@example.com"
  }
  ```

## 🔄 How Price Checking Works

1. **Scheduler runs every minute** (configurable in `server/services/priceChecker.ts`)
2. Fetches all active products from the database
3. Scrapes current price from each product URL
4. Compares with the last checked price
5. If price drops:
   - Updates the database
   - Sends email notification to user
6. If tracking expired (>30 days), automatically deactivates the product

## 🛠️ Configuration

### Changing Check Frequency

Edit `server/services/priceChecker.ts`:

```typescript
// Run every minute (default)
this.cronJob = cron.schedule('* * * * *', async () => {
  await this.checkAllProducts();
});

// Run every 5 minutes
this.cronJob = cron.schedule('*/5 * * * *', async () => {
  await this.checkAllProducts();
});

// Run every hour
this.cronJob = cron.schedule('0 * * * *', async () => {
  await this.checkAllProducts();
});
```

Cron format: `minute hour day month weekday`

## 📁 Project Structure

```
Amazon-UI-Clone/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── services/           # Business logic
│   │   ├── priceChecker.ts # Scheduler service
│   │   └── email.ts        # Email service
│   ├── routes.ts           # API routes
│   └── storage.ts          # Database operations
├── shared/                 # Shared types/schemas
└── package.json
```

## 🐛 Troubleshooting

### Email Not Sending

1. Verify Gmail App Password is correct
2. Check `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
3. Test with: `POST /api/admin/test-email`

### Prices Not Updating

1. Check scheduler status: `GET /api/admin/scheduler-status`
2. Manually trigger: `POST /api/admin/check-prices`
3. Check server logs for scraping errors

### Scraping Failures

If scraping fails frequently:
- Amazon/Flipkart may be blocking requests
- Increase delay between requests in `priceChecker.ts`
- Consider using a proxy service
- Update selectors if website HTML changed

## 📊 Database Schema

### Products Table
- `id` - Primary key
- `userId` - User who added the product
- `productUrl` - URL to track
- `productName` - Product name
- `platform` - Amazon/Flipkart/etc.
- `initialPrice` - First tracked price
- `lastCheckedPrice` - Most recent price
- `trackingStartDate` - When tracking started
- `trackingEndDate` - When tracking expires (30 days)
- `isActive` - Whether tracking is active

### Price History Table
- `id` - Primary key
- `productId` - Foreign key to products
- `price` - Recorded price
- `checkedAt` - Timestamp

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use a production PostgreSQL database
3. Configure environment variables
4. Build the frontend: `npm run build`
5. Start the server: `npm start`

## 🤝 Contributing

Feel free to submit issues and pull requests!

## 📄 License

MIT License

## 🎯 Future Enhancements

- [ ] CSV upload for bulk URL tracking
- [ ] Price history charts with Chart.js
- [ ] Telegram bot integration
- [ ] Support for more e-commerce platforms
- [ ] User-specific email preferences
- [ ] Mobile app
- [ ] Browser extension
