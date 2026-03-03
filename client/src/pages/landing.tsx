import { useEffect, useMemo, useState } from "react";
import { BellRing, Search, Star, TrendingDown, LineChart, ShieldCheck, Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

type PublicStats = {
  trackedProducts: number;
  activeTracks: number;
  totalPricePoints: number;
  storage: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type SearchProduct = {
  id: string;
  title: string;
  store: string;
  price: string;
  oldPrice: string;
  rating: number;
  reviews: string;
  delivery: string;
  image: string;
  productUrl: string;
};

const searchFeed: SearchProduct[] = [
  {
    id: "p1",
    title: "Apple MacBook Air M3 13-inch",
    store: "Amazon",
    price: "₹1,04,900",
    oldPrice: "₹1,14,900",
    rating: 4.6,
    reviews: "4.1k",
    delivery: "2-day delivery",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&h=700&fit=crop",
    productUrl: "https://www.amazon.in/dp/B0CX23P6N6",
  },
  {
    id: "p2",
    title: "Sony WH-1000XM5 Wireless Headphones",
    store: "Flipkart",
    price: "₹29,990",
    oldPrice: "₹34,990",
    rating: 4.7,
    reviews: "13.5k",
    delivery: "Tomorrow delivery",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=700&h=700&fit=crop",
    productUrl: "https://www.flipkart.com/sony-wh-1000xm5/p/itmdummy",
  },
  {
    id: "p3",
    title: "Samsung Galaxy S24 Ultra 5G",
    store: "Myntra",
    price: "₹1,29,999",
    oldPrice: "₹1,39,999",
    rating: 4.5,
    reviews: "9.2k",
    delivery: "Express delivery",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700&h=700&fit=crop",
    productUrl: "https://www.myntra.com/samsung-galaxy-s24-ultra",
  },
  {
    id: "p4",
    title: "Nike Air Max Pulse Running Shoes",
    store: "Ajio",
    price: "₹8,499",
    oldPrice: "₹11,999",
    rating: 4.4,
    reviews: "2.7k",
    delivery: "3-day delivery",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&h=700&fit=crop",
    productUrl: "https://www.ajio.com/nike-air-max-pulse/p/itmdummy",
  },
  {
    id: "p5",
    title: "Dyson Airwrap Multi-Styler",
    store: "Nykaa",
    price: "₹45,900",
    oldPrice: "₹49,900",
    rating: 4.3,
    reviews: "1.8k",
    delivery: "2-day delivery",
    image: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=700&h=700&fit=crop",
    productUrl: "https://www.nykaa.com/dyson-airwrap/p/itmdummy",
  },
  {
    id: "p6",
    title: "Levi's 512 Slim Taper Jeans",
    store: "Flipkart",
    price: "₹2,299",
    oldPrice: "₹3,999",
    rating: 4.2,
    reviews: "10k",
    delivery: "Next day delivery",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=700&h=700&fit=crop",
    productUrl: "https://www.flipkart.com/levis-512-jeans/p/itmdummy",
  },
];

export default function Landing() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [search, setSearch] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [trackStatus, setTrackStatus] = useState<Record<string, "idle" | "loading" | "done">>({});
  const [registerForm, setRegisterForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const products = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return searchFeed;
    return searchFeed.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.store.toLowerCase().includes(query),
    );
  }, [search]);

  useEffect(() => {
    const handleGoogleLogin = async (response: any) => {
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: response.credential }),
          credentials: "include",
        });
        if (!res.ok) {
          setAuthError("Google sign-in failed. Check OAuth settings.");
          return;
        }
        window.location.href = "/";
      } catch {
        setAuthError("Google sign-in failed due to network/server issue.");
      }
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      const google = window.google;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!google || !clientId) return;
      google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleLogin });
      google.accounts.id.renderButton(document.getElementById("google-login")!, {
        theme: "outline",
        size: "large",
        width: 290,
      });
    };

    fetch("/api/analytics/traffic").then((res) => res.json()).then(setStats).catch(() => null);
    fetch("/api/faqs").then((res) => res.json()).then(setFaqs).catch(() => setFaqs([]));

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialsAuth = async (mode: "register" | "login", payload: Record<string, string>) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setAuthError(data?.message || "Authentication failed");
        return;
      }
      window.location.href = "/";
    } catch {
      setAuthError("Authentication request failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTrack = async (item: SearchProduct) => {
    setAuthError(null);
    setTrackStatus((prev) => ({ ...prev, [item.id]: "loading" }));
    try {
      const res = await fetch("/api/products/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.productUrl }),
        credentials: "include",
      });
      if (res.status === 401) {
        setAuthError("Sign in first to track products.");
        setTrackStatus((prev) => ({ ...prev, [item.id]: "idle" }));
        return;
      }
      if (!res.ok) {
        setAuthError("Failed to add product. Try again.");
        setTrackStatus((prev) => ({ ...prev, [item.id]: "idle" }));
        return;
      }
      setTrackStatus((prev) => ({ ...prev, [item.id]: "done" }));
    } catch {
      setAuthError("Tracking request failed.");
      setTrackStatus((prev) => ({ ...prev, [item.id]: "idle" }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <BellRing className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-secondary font-display">TrackZon</span>
          </div>
          <p className="hidden md:block text-sm text-muted-foreground">Keepa-style tracking with AI forecast and coupon radar</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
          <div className="lg:sticky lg:top-24">
            <Card className="p-5 shadow-sm border-slate-200">
              <h2 className="text-xl font-bold mb-1">Sign in</h2>
              <p className="text-sm text-muted-foreground mb-4">Left panel auth for quick access and tracking.</p>
              <div id="google-login" className="mb-4 min-h-12" />
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCredentialsAuth("login", loginForm);
                    }}
                  >
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        minLength={8}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button className="w-full" disabled={authLoading}>
                      {authLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="register">
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCredentialsAuth("register", registerForm);
                    }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="reg-first">First Name</Label>
                        <Input
                          id="reg-first"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm((prev) => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="reg-last">Last Name</Label>
                        <Input
                          id="reg-last"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-pass">Password</Label>
                      <Input
                        id="reg-pass"
                        type="password"
                        minLength={8}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button className="w-full" disabled={authLoading}>
                      {authLoading ? "Creating..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              {authError && <p className="text-sm text-destructive mt-3">{authError}</p>}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-700 text-white border-none">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">Professional price intelligence for smart buying</h1>
              <p className="text-slate-200 mt-3 max-w-3xl">
                Search products like shopping feeds, compare signals, and click Track to add instantly to your price watchlist.
              </p>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs uppercase text-slate-200">Tracked</p>
                    <p className="text-2xl font-bold">{stats.trackedProducts}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs uppercase text-slate-200">Active</p>
                    <p className="text-2xl font-bold">{stats.activeTracks}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs uppercase text-slate-200">Data Points</p>
                    <p className="text-2xl font-bold">{stats.totalPricePoints}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs uppercase text-slate-200">Storage</p>
                    <p className="text-xl font-bold uppercase">{stats.storage}</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search products, brands or stores..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11"
                />
              </div>
            </Card>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map((item, i) => {
                const isLoading = trackStatus[item.id] === "loading";
                const isDone = trackStatus[item.id] === "done";
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="overflow-hidden h-full border-slate-200 hover:shadow-md transition-shadow">
                      <div className="h-44 bg-white flex items-center justify-center p-4 border-b">
                        <img src={item.image} alt={item.title} className="h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">{item.store}</span>
                          <span className="text-xs text-muted-foreground">{item.delivery}</span>
                        </div>
                        <h3 className="font-semibold leading-tight line-clamp-2 min-h-11">{item.title}</h3>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-bold">{item.price}</span>
                          <span className="text-sm text-muted-foreground line-through pb-1">{item.oldPrice}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          {item.rating} ({item.reviews})
                        </div>
                        <Button
                          className="w-full mt-2"
                          onClick={() => handleTrack(item)}
                          disabled={isLoading || isDone}
                        >
                          {isLoading ? "Tracking..." : isDone ? "Tracked" : "Track"}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Core Intelligence Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 mb-1 font-semibold">
                    <TrendingDown className="h-4 w-4 text-primary" />
                    Keepa-like historical tracking
                  </div>
                  <p className="text-sm text-muted-foreground">See trend lines, deep drops, and price break zones.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 mb-1 font-semibold">
                    <LineChart className="h-4 w-4 text-primary" />
                    Multi-store comparison
                  </div>
                  <p className="text-sm text-muted-foreground">Benchmark likely better offers before final purchase.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 mb-1 font-semibold">
                    <Brain className="h-4 w-4 text-primary" />
                    AI future forecast
                  </div>
                  <p className="text-sm text-muted-foreground">Predict near-term movement from tracked history.</p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 mb-1 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Secure private tracking
                  </div>
                  <p className="text-sm text-muted-foreground">Each user gets isolated products, alerts and analytics.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">FAQ</h2>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-1">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
