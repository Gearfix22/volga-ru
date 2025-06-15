import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  History, 
  Settings, 
  CreditCard,
  Menu,
  X,
  Home,
  LogOut,
  Crown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: User, label: 'Overview', path: '/dashboard' },
  { icon: History, label: 'My Reservations', path: '/dashboard/reservations' },
  { icon: Settings, label: 'Account Settings', path: '/dashboard/settings' },
  { icon: CreditCard, label: 'Payment Methods', path: '/dashboard/payments' },
];

const ActualDashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-volga-pearl via-russian-cream to-white">
      <Sidebar
        className={`border-r border-russian-silver/20 bg-white/95 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-72"}`}
        collapsible="icon"
      >
        <SidebarContent className="flex flex-col">
          <div className="flex items-center justify-between h-20 px-6 border-b border-russian-silver/20 bg-gradient-to-r from-russian-blue to-volga-logo-blue">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <Crown className="h-8 w-8 text-russian-gold" />
                <h2 className="text-xl font-serif font-bold text-white">Dashboard</h2>
              </div>
            )}
            <SidebarTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <X className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
          </div>
          
          <nav className="mt-8 px-4 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.path}
                      className={`flex items-center w-full px-4 py-3 mt-2 text-sm rounded-xl transition-all duration-200 font-medium ${
                        active
                          ? 'bg-gradient-to-r from-russian-blue to-volga-logo-blue text-white shadow-lg'
                          : 'text-gray-700 hover:bg-russian-blue/10 hover:text-russian-blue'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      {/* This span is necessary to ensure the Link has a single child element,
                          which is a requirement for components using 'asChild'. */}
                      <span className="flex items-center">
                        <Icon className={`h-5 w-5 ${!collapsed ? 'mr-4' : ''}`} />
                        {!collapsed && item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </nav>

          <div className="p-4">
            {collapsed ? (
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-russian-blue to-volga-logo-blue rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                {getUserInitials()}
              </div>
            ) : (
              <Card className="p-4 bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-russian-blue to-volga-logo-blue rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                      {getUserInitials()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-serif font-semibold text-gray-900 truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-russian-blue text-russian-blue hover:bg-russian-blue hover:text-white transition-all duration-200"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </Card>
            )}
          </div>
        </SidebarContent>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-sm border-b border-russian-silver/20">
          <div className="flex items-center justify-between h-20 px-6 lg:px-8">
            <div className="flex items-center">
              <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" className="text-russian-blue hover:bg-russian-blue/10">
                  {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>
              </SidebarTrigger>

              <Button asChild variant="ghost" size="sm" className="text-russian-blue hover:bg-russian-blue/10 font-medium ml-4 lg:ml-0">
                <Link to="/">
                  <span className="flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Site
                  </span>
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-lg font-serif font-semibold text-gray-800">Welcome back</span>
                <p className="text-sm text-russian-blue font-medium">{getUserDisplayName()}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-russian-blue to-volga-logo-blue rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {getUserInitials()}
              </div>
            </div>
          </div>
        </div>

        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};


export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-russian-blue to-volga-logo-blue">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-russian-gold"></div>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <ActualDashboardLayout>{children}</ActualDashboardLayout>
    </SidebarProvider>
  );
};
