import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { User, LogOut } from "lucide-react";
import rluLogo from "@/assets/rlu-360-logo.png";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <User className="mr-2 h-4 w-4" />
          {user.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <div className="font-medium">{user.name}</div>
          <div className="text-muted-foreground">{user.email}</div>
          <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('auth.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { t } = useI18n();
  const isMobile = useIsMobile();

  if (isHomePage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border sticky top-0 z-50 shadow-card">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SidebarTrigger />
                <Link to="/" className="flex items-center space-x-3">
                  <img src={rluLogo} alt="RLU 360" className="h-10 w-10" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-primary">RLU 360</span>
                    <span className="text-xs text-muted-foreground">Transformation Model</span>
                  </div>
                </Link>
              </div>

              <div className="flex items-center space-x-3">
                <LanguageSelector />
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container mx-auto px-4 py-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-card border-t border-border mt-auto">
            <div className="container mx-auto px-4 py-4">
              <div className="text-center text-sm text-muted-foreground">
                Copyright © 2025 Sriwarit Siriatiyut. All rights reserved.
              </div>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};