
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Activity,
} from 'lucide-react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signOut, loading } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to home if not authenticated and not loading
  if (!loading && !user) {
    return <Navigate to="/" replace />;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const menuItems = [
    { icon: User, label: t('dashboard.overview'), path: '/dashboard' },
    { icon: History, label: t('dashboard.reservations'), path: '/dashboard/reservations' },
    { icon: Activity, label: t('dashboard.activityHistory'), path: '/dashboard/activity' },
    { icon: Settings, label: t('dashboard.accountSettings'), path: '/dashboard/settings' },
    { icon: CreditCard, label: t('dashboard.paymentMethods'), path: '/dashboard/payments' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t('dashboard.signedOut'),
        description: t('dashboard.signedOutSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('dashboard.signOutError'),
        variant: 'destructive',
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
    <div className={cn("min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-volga-pearl via-white to-gray-100", isRTL && "flex-row-reverse")}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-50 h-full",
          "w-4/5 max-w-xs sm:max-w-sm md:w-56 lg:w-64",
          "bg-white border-r border-silver shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          "lg:static flex flex-col",
          isRTL ? "right-0" : "left-0",
          isRTL 
            ? (sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0')
            : (sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
        )}
        aria-label="Sidebar"
      >
        <div className={cn("flex items-center justify-between h-14 md:h-16 px-4 md:px-5 border-b border-silver bg-white/80 backdrop-blur-sm sticky top-0 z-10", isRTL && "flex-row-reverse")}>
          <h2 className="text-lg md:text-xl font-bold text-volga-logo-blue tracking-tight select-none">{t('dashboard.title')}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label={t('common.close')}
          >
            <X className="h-6 w-6 text-gray-500" />
          </Button>
        </div>
        {/* Main Menu */}
        <nav className="mt-2 md:mt-6 px-2 md:px-3 flex-1 flex flex-col gap-0.5 md:gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium text-base",
                  isActive(item.path)
                    ? 'bg-volga-logo-blue/10 text-volga-logo-blue font-semibold'
                    : 'text-gray-600 hover:bg-volga-logo-blue/5 hover:text-volga-logo-blue',
                  isRTL && "flex-row-reverse"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {/* User section */}
        <div className="mt-auto pb-4 px-2 md:px-3">
          <Card className="p-3 md:p-4 bg-cream/90 border-silver">
            <div className={cn("flex items-center space-x-3", isRTL && "flex-row-reverse space-x-reverse")}>
              <div className="flex-shrink-0">
                <div className="w-9 h-9 bg-volga-logo-blue rounded-full flex items-center justify-center text-white text-md font-semibold shadow-inner border-2 border-white">
                  {getUserInitials()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold text-gray-900 truncate leading-tight", isRTL && "text-right")}>
                  {getUserDisplayName()}
                </p>
                <p className={cn("text-xs text-gray-500 truncate", isRTL && "text-right")}>{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={cn("w-full mt-3 border-gray-200", isRTL && "flex-row-reverse")}
              onClick={handleSignOut}
            >
              <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t('auth.signOut')}
            </Button>
          </Card>
        </div>
      </aside>
      {/* Main content */}
      <div className={cn("flex-1 flex flex-col min-h-screen", isRTL ? "lg:pr-64 md:pr-56" : "lg:pl-64 md:pl-56")}>
        {/* Top bar */}
        <div className={cn("sticky top-0 z-30 bg-white/90 shadow-sm border-b border-silver flex items-center h-14 md:h-16 px-2 md:px-4 lg:px-8 backdrop-blur-sm", isRTL && "flex-row-reverse")}>
          <Button
            variant="ghost"
            size="icon"
            className={cn("lg:hidden", isRTL ? "ml-2" : "mr-2")}
            onClick={() => setSidebarOpen(true)}
            aria-label={t('common.menu')}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="shrink-0">
            <Button variant="ghost" size="sm" className={cn("gap-2 px-2 sm:px-4 rounded", isRTL && "flex-row-reverse")}>
              <Home className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              <span className="hidden xs:inline font-medium text-volga-logo-blue">{t('dashboard.backToSite')}</span>
            </Button>
          </Link>
          {/* Welcome / avatar on larger screens */}
          <div className={cn("hidden lg:flex items-center space-x-3", isRTL ? "mr-auto flex-row-reverse space-x-reverse" : "ml-auto")}>
            <span className="text-sm text-gray-600 font-medium">
              {t('dashboard.welcomeBack', { name: getUserDisplayName() })}
            </span>
            <div className="w-8 h-8 bg-volga-logo-blue rounded-full flex items-center justify-center text-white text-sm font-semibold border border-silver shadow">
              {getUserInitials()}
            </div>
          </div>
        </div>
        {/* Page content */}
        <main className="flex-1 p-2 xs:p-3 md:p-4 lg:p-8 bg-gradient-to-br from-white via-gray-50 to-pearl min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] mt-0">
          {children}
        </main>
      </div>
    </div>
  );
};