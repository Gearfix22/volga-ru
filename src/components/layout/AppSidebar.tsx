import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  CreditCard, 
  User, 
  MessageCircle,
  Settings,
  Users,
  Package,
  BarChart,
  FileText,
  LogOut,
  Shield
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const AppSidebar = () => {
  const { user, hasRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { state } = useSidebar();

  const userMenuItems = [
    {
      title: t('dashboard'),
      url: '/enhanced-dashboard',
      icon: LayoutDashboard,
    },
    {
      title: t('myBookings'),
      url: '/enhanced-dashboard',
      icon: Calendar,
    },
    {
      title: t('payments'),
      url: '/payments-history',
      icon: CreditCard,
    },
    {
      title: t('profile'),
      url: '/profile-settings',
      icon: User,
    },
    {
      title: t('support'),
      url: '/support',
      icon: MessageCircle,
    },
  ];

  const adminMenuItems = [
    {
      title: t('adminDashboard'),
      url: '/admin',
      icon: Shield,
    },
    {
      title: t('manageBookings'),
      url: '/admin/bookings',
      icon: Calendar,
    },
    {
      title: t('managePayments'),
      url: '/admin/payments',
      icon: CreditCard,
    },
    {
      title: t('manageServices'),
      url: '/admin/services',
      icon: Package,
    },
    {
      title: t('manageUsers'),
      url: '/admin/users',
      icon: Users,
    },
    {
      title: t('analytics'),
      url: '/admin/analytics',
      icon: BarChart,
    },
    {
      title: t('logs'),
      url: '/admin/logs',
      icon: FileText,
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getNavClass = (path: string) => {
    return location.pathname === path 
      ? "bg-accent text-accent-foreground font-medium" 
      : "hover:bg-accent/50";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
          {state === 'expanded' && (
            <div>
              <h2 className="font-semibold text-lg">Volga Travel</h2>
              <p className="text-sm text-muted-foreground">Booking Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('userMenu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {state === 'expanded' && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Menu - Only show if user is admin */}
        {hasRole('admin') && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('administration')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        {state === 'expanded' && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {state === 'expanded' && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.email}
              </p>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2 text-xs"
              >
                <LogOut className="h-3 w-3 mr-1" />
                {t('signOut')}
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;