import { type ProductWithHistory } from "@shared/schema";
import { format } from "date-fns";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Trash2, TrendingDown, TrendingUp, Minus, ExternalLink, Activity } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useDeleteProduct, useToggleProductActive } from "@/hooks/use-products";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: ProductWithHistory;
}

export function ProductCard({ product }: ProductCardProps) {
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductActive();

  // Parse numeric values from string response
  const initialPrice = Number(product.initialPrice);
  const currentPrice = Number(product.lastCheckedPrice);
  const isLower = currentPrice < initialPrice;
  const isHigher = currentPrice > initialPrice;
  const priceDiff = Math.abs(currentPrice - initialPrice);
  const priceDiffPercent = ((priceDiff / initialPrice) * 100).toFixed(1);

  // Format chart data
  const chartData = product.priceHistory.map((h) => ({
    price: Number(h.price),
    date: format(new Date(h.checkedAt), "MMM d"),
  }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <Card className="flex flex-col overflow-hidden hover-elevate bg-card border-border/50 shadow-sm transition-all">
      <div className="relative h-48 bg-white p-4 flex items-center justify-center border-b border-border/50">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.productName} 
            className="h-full object-contain mix-blend-multiply"
          />
        ) : (
          <div className="h-full w-full bg-muted rounded flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        <Badge variant="secondary" className="absolute top-3 left-3 bg-secondary/90 text-secondary-foreground backdrop-blur-sm shadow-sm">
          {product.platform}
        </Badge>
        {!product.isActive && (
          <Badge variant="destructive" className="absolute top-3 right-3 shadow-sm">
            Paused
          </Badge>
        )}
      </div>

      <CardContent className="p-5 flex-1 flex flex-col">
        <a 
          href={product.productUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-lg font-bold text-foreground line-clamp-2 hover:text-primary transition-colors mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {product.productName}
          <ExternalLink className="inline-block w-4 h-4 ml-1.5 opacity-50 -mt-1" />
        </a>

        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-bold text-foreground">
            {formatCurrency(currentPrice)}
          </span>
          {initialPrice !== currentPrice && (
            <span className="text-sm text-muted-foreground line-through mb-1">
              {formatCurrency(initialPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-6">
          {isLower ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 font-semibold shadow-none">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              Drop {priceDiffPercent}%
            </Badge>
          ) : isHigher ? (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 font-semibold shadow-none">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Up {priceDiffPercent}%
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground font-semibold shadow-none">
              <Minus className="w-3.5 h-3.5 mr-1" />
              No Change
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            <span>Price History</span>
            <Activity className="w-3 h-3" />
          </div>
          <div className="h-[60px] w-full">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "white" }} 
                    activeDot={{ r: 5 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                Gathering data...
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 p-4 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Switch 
            checked={product.isActive} 
            onCheckedChange={(checked) => toggleMutation.mutate({ id: product.id, isActive: checked })}
            disabled={toggleMutation.isPending}
            className="data-[state=checked]:bg-primary"
          />
          <span className="text-sm font-medium text-muted-foreground">
            {product.isActive ? 'Tracking Active' : 'Paused'}
          </span>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete tracking for "{product.productName}" and remove all its price history data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate(product.id)}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
