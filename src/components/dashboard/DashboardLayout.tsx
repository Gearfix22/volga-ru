
import React, { useState } from 'react';
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
} from 'lucide-react';
import { Link, useLocation, Navigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signOut, loading } = useAuth();
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
    { icon: User, label: 'Overview', path: '/dashboard' },
    { icon: History, label: 'Reservations', path: '/dashboard/reservations' },
    { icon: Settings, label: 'Account Settings', path: '/dashboard/settings' },
    { icon: CreditCard, label: 'Payment Methods', path: '/dashboard/payments' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-volga-pearl via-white to-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full 
          w-4/5 max-w-xs sm:max-w-sm md:w-56 lg:w-64
          bg-white border-r border-silver shadow-2xl
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          flex flex-col
        `}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-5 border-b border-silver bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-lg md:text-xl font-bold text-volga-logo-blue tracking-tight select-none">Dashboard</h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
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
                className={`
                  flex items-center gap-2 px-3 py-2
                  rounded-lg transition-colors font-medium text-base
                  ${isActive(item.path)
                    ? 'bg-volga-logo-blue/10 text-volga-logo-blue font-semibold'
                    : 'text-gray-600 hover:bg-volga-logo-blue/5 hover:text-volga-logo-blue'}
                `}
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
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 bg-volga-logo-blue rounded-full flex items-center justify-center text-white text-md font-semibold shadow-inner border-2 border-white">
                  {getUserInitials()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 border-gray-200"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </Card>
        </div>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 md:pl-56">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/90 shadow-sm border-b border-silver flex items-center h-14 md:h-16 px-2 md:px-4 lg:px-8 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="shrink-0">
            <Button variant="ghost" size="sm" className="gap-2 px-2 sm:px-4 rounded">
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline font-medium text-volga-logo-blue">Back to Site</span>
            </Button>
          </Link>
          {/* Welcome / avatar on larger screens */}
          <div className="ml-auto hidden lg:flex items-center space-x-3">
            <span className="text-sm text-gray-600 font-medium">
              Welcome back, {getUserDisplayName()}
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
