import React from 'react';
import { 
  LayoutDashboard,
  Calendar,
  CreditCard,
  Users,
  FileText,
  LogOut,
  Car,
  MapPin,
  Package,
  DollarSign,
  UserCheck,
  Star
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/admin/NotificationBell';

interface AdminMenuItem {
  title: string;
  url: string;
  icon: any;
}

const AdminSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const menuItems: AdminMenuItem[] = [
    { title: 'Overview', url: '/admin?tab=overview', icon: LayoutDashboard },
    { title: 'Bookings', url: '/admin?tab=bookings', icon: Calendar },
    { title: 'Payments', url: '/admin?tab=payments', icon: CreditCard },
    { title: 'Pricing', url: '/admin?tab=pricing', icon: DollarSign },
    { title: 'Reviews', url: '/admin?tab=reviews', icon: Star },
    { title: 'Drivers', url: '/admin?tab=drivers', icon: Car },
    { title: 'Guides', url: '/admin?tab=guides', icon: UserCheck },
    { title: 'Services', url: '/admin?tab=services', icon: Package },
    { title: 'Live Map', url: '/admin?tab=map', icon: MapPin },
    { title: 'Users', url: '/admin?tab=users', icon: Users },
    { title: 'Logs', url: '/admin?tab=logs', icon: FileText },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold">Admin Panel</h2>
          )}
          <NotificationBell />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className={({ isActive }) => 
                          isActive ? 'bg-primary text-primary-foreground' : ''
                        }
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.email ? getInitials(user.email) : 'AD'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start mt-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
