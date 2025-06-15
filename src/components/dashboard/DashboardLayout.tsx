
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
  LogOut
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full 
          w-60 md:w-56 lg:w-64 
          bg-white shadow-lg 
          transform transition-transform duration-300 ease-in-out 
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:!block
        `}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-5 border-b">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">Dashboard</h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-4 md:mt-6 px-2 md:px-3 flex-1 flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm md:text-base rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5 mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 md:bottom-6 left-2 md:left-3 right-2 md:right-3 max-w-full">
          <Card className="p-3 md:p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getUserInitials()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </Card>
        </div>
      </aside>

      {/* Main content (with top bar for mobile/desktop) */}
      <div className="flex-1 lg:pl-60 md:pl-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b flex items-center h-14 md:h-16 px-2 md:px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="ml-2 md:ml-4 lg:ml-0 shrink-0">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Back to Site</span>
            </Button>
          </Link>
          {/* User info in top bar for larger screens */}
          <div className="ml-auto hidden lg:flex items-center space-x-3">
            <span className="text-sm text-gray-600">Welcome back, {getUserDisplayName()}</span>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getUserInitials()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-2 md:p-4 lg:p-6 bg-gray-50 min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] mt-0">
          {children}
        </main>
      </div>
    </div>
  );
};
