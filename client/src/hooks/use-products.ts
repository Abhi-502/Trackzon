import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type TrackProductRequest, type TrackMultipleProductsRequest, type ProductWithHistory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Fetch all tracked products
export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch products");
      }
      const data = await res.json();
      return api.products.list.responses[200].parse(data);
    },
  });
}

// Track a single product
export function useTrackProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TrackProductRequest) => {
      const validated = api.products.track.input.parse(data);
      const res = await fetch(api.products.track.path, {
        method: api.products.track.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to track product");
      }
      return api.products.track.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Product Added", description: "Successfully started tracking." });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

// Track multiple products
export function useTrackMultipleProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TrackMultipleProductsRequest) => {
      const validated = api.products.trackMultiple.input.parse(data);
      const res = await fetch(api.products.trackMultiple.path, {
        method: api.products.trackMultiple.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to track products");
      }
      return api.products.trackMultiple.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({ 
        title: "Products Added", 
        description: `Successfully started tracking ${data.length} products.` 
      });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

// Toggle active status
export function useToggleProductActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const url = buildUrl(api.products.toggleActive.path, { id });
      const res = await fetch(url, {
        method: api.products.toggleActive.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update product status");
      return api.products.toggleActive.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({ 
        title: "Status Updated", 
        description: `Tracking is now ${data.isActive ? 'active' : 'paused'} for this product.` 
      });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

// Delete a tracked product
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.products.delete.path, { id });
      const res = await fetch(url, {
        method: api.products.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      toast({ title: "Product Deleted", description: "Removed product from your tracking list." });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}
