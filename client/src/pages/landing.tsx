import { ArrowRight, BellRing, TrendingDown, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const features = [
  {
    icon: <TrendingDown className="h-6 w-6 text-primary" />,
    title: "Price Drop Alerts",
    description: "Never miss a deal. We check prices constantly and alert you when they drop."
  },
  {
    icon: <LineChart className="h-6 w-6 text-primary" />,
    title: "Price History Charts",
    description: "Make informed decisions with detailed historical price trends."
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    title: "Multi-Store Support",
    description: "Track products seamlessly across Amazon, Flipkart, and Myntra."
  }
];

const trendingProducts = [
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: "₹29,990",
    oldPrice: "₹34,990",
    drop: "14%",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=600&fit=crop"
  },
  {
    name: "Apple MacBook Air M3 (2024)",
    price: "₹1,04,900",
    oldPrice: "₹1,14,900",
    drop: "8%",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop"
  },
  {
    name: "Samsung Galaxy S24 Ultra 5G",
    price: "₹1,29,999",
    oldPrice: "₹1,39,999",
    drop: "7%",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=600&fit=crop"
  }
];

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <BellRing className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-secondary font-display">TrackZon</span>
          </div>
          <Button 
            onClick={handleLogin}
            variant="outline" 
            className="border-primary text-primary hover:bg-primary hover:text-white font-semibold transition-colors"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-secondary mb-6 leading-tight">
              Stop guessing. <br/>
              <span className="text-primary relative inline-block">
                Start tracking.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Automate your price watching on Amazon, Flipkart, and Myntra. We monitor the items you want and chart the history, so you buy at exactly the right moment.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={handleLogin}
                size="lg" 
                className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all rounded-xl"
              >
                Log In to Track Prices
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mock Trending Section */}
      <section className="py-20 bg-secondary relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trending Deals Right Now</h2>
            <p className="text-secondary-foreground/60 text-lg">See what other smart shoppers are tracking and saving on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trendingProducts.map((product, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="overflow-hidden border-none bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm group">
                  <div className="relative h-64 overflow-hidden bg-white">
                    {/* landing page sample tech product */}
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                    />
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full text-sm shadow-lg">
                      {product.drop} DROP
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-bold text-white">{product.price}</span>
                      <span className="text-lg text-white/40 line-through pb-1">{product.oldPrice}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-background">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-300 border border-transparent hover:border-border">
              <div className="bg-primary/10 p-4 rounded-2xl mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold text-secondary font-display">TrackZon</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} TrackZon. All rights reserved. Amazon, Flipkart, and Myntra are trademarks of their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
}
