import { useState } from "react";
import { Link, Plus, Trash2, Search } from "lucide-react";
import { useTrackProduct, useTrackMultipleProducts } from "@/hooks/use-products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export function AddProductForm() {
  const [singleUrl, setSingleUrl] = useState("");
  const [multipleUrls, setMultipleUrls] = useState<string[]>([""]);
  
  const trackSingle = useTrackProduct();
  const trackMultiple = useTrackMultipleProducts();

  const handleTrackSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl) return;
    trackSingle.mutate({ url: singleUrl }, {
      onSuccess: () => setSingleUrl("")
    });
  };

  const handleTrackMultiple = (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = multipleUrls.filter(url => url.trim().length > 0);
    if (validUrls.length === 0) return;
    
    trackMultiple.mutate({ urls: validUrls }, {
      onSuccess: () => setMultipleUrls([""])
    });
  };

  const updateMultipleUrl = (index: number, value: string) => {
    const newUrls = [...multipleUrls];
    newUrls[index] = value;
    setMultipleUrls(newUrls);
  };

  const removeMultipleUrl = (index: number) => {
    if (multipleUrls.length === 1) {
      setMultipleUrls([""]);
      return;
    }
    const newUrls = [...multipleUrls];
    newUrls.splice(index, 1);
    setMultipleUrls(newUrls);
  };

  const storeTemplates = [
    { label: "Amazon", url: "https://www.amazon.in/" },
    { label: "Flipkart", url: "https://www.flipkart.com/" },
    { label: "Myntra", url: "https://www.myntra.com/" },
    { label: "Ajio", url: "https://www.ajio.com/" },
  ];

  return (
    <Card className="shadow-md border-border/50 overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-orange-400 to-yellow-400" />
      <CardHeader className="bg-white pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Search className="h-6 w-6 text-primary" />
          Track New Product
        </CardTitle>
        <CardDescription>
          Paste an Amazon, Flipkart, or Myntra product URL to start tracking its price.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          {storeTemplates.map((store) => (
            <Button
              key={store.label}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setSingleUrl(store.url)}
            >
              {store.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="bg-white">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
            <TabsTrigger value="single" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all font-semibold">
              Single Item
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all font-semibold">
              Bulk Import
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="single">
            <form onSubmit={handleTrackSingle} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Product URL</Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="url"
                      placeholder="https://www.amazon.in/dp/B0..." 
                      className="pl-9 h-12 bg-background border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-base"
                      value={singleUrl}
                      onChange={(e) => setSingleUrl(e.target.value)}
                      disabled={trackSingle.isPending}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!singleUrl || trackSingle.isPending}
                    className="h-12 px-8 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                  >
                    {trackSingle.isPending ? "Adding..." : "Track"}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="bulk">
            <form onSubmit={handleTrackMultiple} className="space-y-4">
              <div className="space-y-3">
                <Label>Product URLs</Label>
                {multipleUrls.map((url, index) => (
                  <div key={index} className="flex gap-2 items-center group">
                    <div className="relative flex-1">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="https://..." 
                        className="pl-9 bg-background focus-visible:ring-primary/20"
                        value={url}
                        onChange={(e) => updateMultipleUrl(index, e.target.value)}
                        disabled={trackMultiple.isPending}
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeMultipleUrl(index)}
                      className="text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
                      disabled={trackMultiple.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setMultipleUrls([...multipleUrls, ""])}
                  className="w-full border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-colors mt-2"
                  disabled={trackMultiple.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Another URL
                </Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={multipleUrls.filter(u => u.trim()).length === 0 || trackMultiple.isPending}
                  className="px-8 font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg transition-all"
                >
                  {trackMultiple.isPending ? "Processing..." : `Track ${multipleUrls.filter(u => u.trim()).length || ''} Items`}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
