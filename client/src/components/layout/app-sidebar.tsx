import { 
  BarChart3, 
  Store, 
  ExternalLink, 
  Settings, 
  LogOut, 
  ShoppingCart,
  PlusCircle,
  ShoppingBag
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <div className="bg-primary p-2 rounded-lg text-primary-foreground">
          <Store className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-sidebar-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          TrackZon
        </h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wider text-xs font-semibold">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === "/"}
                  className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  <Link href="/">
                    <BarChart3 className="h-4 w-4" />
                    <span className="font-medium">Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wider text-xs font-semibold mt-4">
            Supported Stores
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="https://www.amazon.in" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full hover:text-sidebar-accent-foreground">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Amazon India</span>
                    </div>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="https://www.flipkart.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full hover:text-sidebar-accent-foreground">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      <span>Flipkart</span>
                    </div>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="https://www.myntra.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full hover:text-sidebar-accent-foreground">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      <span>Myntra</span>
                    </div>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border border-sidebar-border">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground font-semibold">
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-sidebar-foreground">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : "User"}
            </span>
            <span className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email}
            </span>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-accent-foreground w-full px-2 py-2 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
