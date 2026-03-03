import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AddProductForm } from "@/components/dashboard/add-product-form";
import { ProductCard } from "@/components/dashboard/product-card";
import { useProducts } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageSearch, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  const { data: products, isLoading, error } = useProducts();
  const { data: traffic } = useQuery({
    queryKey: ["/api/analytics/traffic"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/traffic", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-white/50 backdrop-blur-sm px-6 sticky top-0 z-10">
            <SidebarTrigger className="-ml-2 text-secondary hover:bg-secondary/10" />
            <div className="font-semibold text-lg text-secondary hidden sm:block">Dashboard</div>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-8">
            <div className="max-w-5xl mx-auto space-y-8">
              
              <section>
                <AddProductForm />
              </section>

              {traffic && (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Tracked</p>
                    <p className="text-2xl font-bold">{traffic.trackedProducts}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
                    <p className="text-2xl font-bold">{traffic.activeTracks}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Data Points</p>
                    <p className="text-2xl font-bold">{traffic.totalPricePoints}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Storage</p>
                    <p className="text-xl font-bold uppercase">{traffic.storage}</p>
                  </Card>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-secondary">Tracked Products</h2>
                  {products && products.length > 0 && (
                    <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-semibold">
                      {products.length} Items
                    </span>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load products. Please try again later.</AlertDescription>
                  </Alert>
                )}

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col gap-2 rounded-xl border border-border p-4 bg-white">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <Skeleton className="h-6 w-3/4 mt-4" />
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-[60px] w-full mt-4" />
                      </div>
                    ))}
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : !error ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-xl border border-dashed border-border/80 shadow-sm">
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                      <PackageSearch className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-2">No products tracked yet</h3>
                    <p className="text-muted-foreground max-w-md">
                      Copy a link from Amazon, Flipkart, or Myntra and paste it in the box above to start monitoring prices automatically.
                    </p>
                  </div>
                ) : null}
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
