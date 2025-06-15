
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
  Crown
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-russian-blue to-volga-logo-blue">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-russian-gold"></div>
      </div>
    );
  }

  const menuItems = [
    { icon: User, label: 'Overview', path: '/dashboard' },
    { icon: History, label: 'My Reservations', path: '/dashboard/reservations' },
    { icon: Settings, label: 'Account Settings', path: '/dashboard/settings' },
    { icon: CreditCard, label: 'Payment Methods', path: '/dashboard/payments' },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-volga-pearl via-russian-cream to-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-md shadow-2xl border-r border-russian-silver/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-russian-silver/20 bg-gradient-to-r from-russian-blue to-volga-logo-blue">
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8 text-russian-gold" />
            <h2 className="text-xl font-serif font-bold text-white">Dashboard</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/20"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-8 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mt-2 text-sm rounded-xl transition-all duration-200 font-medium ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-russian-blue to-volga-logo-blue text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-russian-blue/10 hover:text-russian-blue hover:transform hover:scale-102'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5 mr-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card */}
        <div className="absolute bottom-6 left-4 right-4">
          <Card className="p-6 bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
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
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-russian-silver/20">
          <div className="flex items-center justify-between h-20 px-6 lg:px-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-russian-blue hover:bg-russian-blue/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link to="/" className="ml-4 lg:ml-0">
                <Button variant="ghost" size="sm" className="text-russian-blue hover:bg-russian-blue/10 font-medium">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
            </div>
            
            {/* User info in top bar for larger screens */}
            <div className="hidden lg:flex items-center space-x-4">
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

        {/* Page content */}
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
