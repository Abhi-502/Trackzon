import nodemailer from 'nodemailer';

export interface PriceDropEmail {
  to: string;
  productName: string;
  productUrl: string;
  oldPrice: string;
  newPrice: string;
  savings: string;
  imageUrl?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configure with environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (!emailUser || !emailPassword) {
      console.warn('Email credentials not configured. Email notifications will be disabled.');
      console.warn('Set EMAIL_USER and EMAIL_PASSWORD environment variables to enable emails.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendPriceDropAlert(emailData: PriceDropEmail): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping email notification.');
      return false;
    }

    const { to, productName, productUrl, oldPrice, newPrice, savings, imageUrl } = emailData;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .content {
              padding: 30px 20px;
            }
            .product-info {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .product-image {
              width: 100%;
              max-width: 300px;
              height: auto;
              border-radius: 8px;
              margin: 0 auto 20px;
              display: block;
            }
            .product-name {
              font-size: 18px;
              font-weight: 600;
              color: #333;
              margin-bottom: 15px;
            }
            .price-comparison {
              display: flex;
              align-items: center;
              justify-content: space-around;
              margin: 20px 0;
              padding: 15px;
              background: white;
              border-radius: 8px;
            }
            .price-box {
              text-align: center;
            }
            .price-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 5px;
            }
            .old-price {
              font-size: 20px;
              color: #999;
              text-decoration: line-through;
            }
            .new-price {
              font-size: 28px;
              color: #10b981;
              font-weight: bold;
            }
            .savings {
              background: #10b981;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 16px;
              font-weight: 600;
              display: inline-block;
              margin: 15px 0;
            }
            .cta-button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .divider {
              height: 1px;
              background: #e0e0e0;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Price Drop Alert!</h1>
            </div>
            
            <div class="content">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Great news! The price for a product you're tracking has dropped.
              </p>
              
              <div class="product-info">
                ${imageUrl ? `<img src="${imageUrl}" alt="${productName}" class="product-image" />` : ''}
                
                <div class="product-name">${productName}</div>
                
                <div class="price-comparison">
                  <div class="price-box">
                    <div class="price-label">Was</div>
                    <div class="old-price">₹${oldPrice}</div>
                  </div>
                  <div style="font-size: 24px; color: #10b981;">→</div>
                  <div class="price-box">
                    <div class="price-label">Now</div>
                    <div class="new-price">₹${newPrice}</div>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <div class="savings">You Save: ₹${savings}!</div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${productUrl}" class="cta-button">
                  Buy Now →
                </a>
              </div>
              
              <div class="divider"></div>
              
              <p style="font-size: 14px; color: #666; text-align: center;">
                This is an automated notification from TrackZon. You're receiving this because you're tracking this product.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>TrackZon</strong> - Never miss a deal</p>
              <p style="margin-top: 10px; font-size: 12px;">
                © ${new Date().getFullYear()} TrackZon. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"TrackZon Price Alerts" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `🎉 Price Drop Alert: ${productName}`,
        html: htmlContent,
      });

      console.log(`✅ Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendTestEmail(to: string): Promise<boolean> {
    return this.sendPriceDropAlert({
      to,
      productName: 'Test Product - Sony WH-1000XM5',
      productUrl: 'https://example.com',
      oldPrice: '29990',
      newPrice: '24990',
      savings: '5000',
      imageUrl: 'https://via.placeholder.com/300',
    });
  }
}

export const emailService = new EmailService();
