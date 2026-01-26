import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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

interface UserProfile {
  full_name: string | null;
  phone: string | null;
}

const AppSidebar = () => {
  const { user, hasRole } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch user profile for display in sidebar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        setUserProfile(data);
      }
    };
    
    fetchProfile();
  }, [user?.id]);

  const userMenuItems = [
    {
      title: t('sidebar.dashboard'),
      url: '/user-dashboard',
      icon: LayoutDashboard,
    },
    {
      title: t('sidebar.payments'),
      url: '/payments-history',
      icon: CreditCard,
    },
    {
      title: t('sidebar.profile'),
      url: '/profile-settings',
      icon: User,
    },
    {
      title: t('sidebar.support'),
      url: '/support',
      icon: MessageCircle,
    },
  ];

  // Admin menu uses query params to match AdminPanel's tab system
  const adminMenuItems = [
    {
      title: t('sidebar.adminDashboard'),
      url: '/admin?tab=overview',
      icon: Shield,
    },
    {
      title: t('sidebar.manageBookings'),
      url: '/admin?tab=bookings',
      icon: Calendar,
    },
    {
      title: t('sidebar.managePayments'),
      url: '/admin?tab=payments',
      icon: CreditCard,
    },
    {
      title: t('sidebar.manageServices'),
      url: '/admin?tab=services',
      icon: Package,
    },
    {
      title: t('sidebar.manageUsers'),
      url: '/admin?tab=users',
      icon: Users,
    },
    {
      title: t('sidebar.analytics'),
      url: '/admin?tab=overview',
      icon: BarChart,
    },
    {
      title: t('sidebar.activityLogs'),
      url: '/admin?tab=logs',
      icon: FileText,
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getNavClass = (url: string) => {
    // Handle query params for admin routes (e.g., /admin?tab=payments)
    const [pathname, queryString] = url.split('?');
    const currentSearch = new URLSearchParams(location.search);
    const urlSearch = new URLSearchParams(queryString || '');
    
    // For admin routes with tabs, check both pathname and tab param
    if (pathname === '/admin' && urlSearch.has('tab')) {
      const isMatch = location.pathname === pathname && 
                      currentSearch.get('tab') === urlSearch.get('tab');
      return isMatch 
        ? "bg-accent text-accent-foreground font-medium" 
        : "hover:bg-accent/50";
    }
    
    // For regular routes, just check pathname
    return location.pathname === pathname 
      ? "bg-accent text-accent-foreground font-medium" 
      : "hover:bg-accent/50";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
          {state === 'expanded' && (
            <div className={isRTL ? 'text-right' : ''}>
              <h2 className="font-semibold text-lg">{t('sidebar.volgaTravel')}</h2>
              <p className="text-sm text-muted-foreground">{t('sidebar.bookingPlatform')}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.url + item.title}>
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
            <SidebarGroupLabel>{t('sidebar.administration')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url + item.title}>
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
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {userProfile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {state === 'expanded' && (
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
              {userProfile?.full_name && (
                <p className="text-sm font-medium truncate">
                  {userProfile.full_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className={`mt-1 h-7 px-2 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <LogOut className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t('sidebar.signOut')}
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;