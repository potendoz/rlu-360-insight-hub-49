import { Link, useLocation } from "react-router-dom";
import { Activity, BarChart3, Users, FileText, Settings, TrendingUp } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  { name: "nav.dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "nav.doctors", href: "/doctors", icon: Users },
  { name: "nav.analytics", href: "/analytics", icon: Activity },
  { name: "Performance Report", href: "/performance-report", icon: TrendingUp },
  { name: "nav.reports", href: "/reports", icon: FileText },
  { name: "Data Input", href: "/data-input", icon: Settings },
  { name: "nav.admin", href: "/admin", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t } = useI18n();
  const { canAccessRoute } = useAuth();
  
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนู</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.filter(item => canAccessRoute(item.href)).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <Icon className="h-4 w-4" />
                        {!isCollapsed && <span>{t(item.name as any)}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
