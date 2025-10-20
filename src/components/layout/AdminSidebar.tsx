import React from 'react';
import { 
  LayoutDashboard,
  Calendar,
  CreditCard,
  Users,
  FileText,
  LogOut
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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

interface AdminMenuItem {
  title: string;
  url: string;
  icon: any;
}

const AdminSidebar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const menuItems: AdminMenuItem[] = [
    { title: t('overview'), url: '/admin?tab=overview', icon: LayoutDashboard },
    { title: t('bookings'), url: '/admin?tab=bookings', icon: Calendar },
    { title: t('payments'), url: '/admin?tab=payments', icon: CreditCard },
    { title: t('users'), url: '/admin?tab=users', icon: Users },
    { title: t('logs'), url: '/admin?tab=logs', icon: FileText },
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
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">{t('adminPanel')}</h2>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('management')}</SidebarGroupLabel>
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
              <p className="text-xs text-muted-foreground">{t('admin')}</p>
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
            {t('signOut')}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
