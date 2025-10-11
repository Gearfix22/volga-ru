import React, { useState } from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  Calendar,
  CreditCard,
  Users,
  FileText,
  Settings,
  Menu,
  X
} from 'lucide-react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { EnhancedBookingsManagement } from '@/components/admin/EnhancedBookingsManagement';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type TabType = 'overview' | 'bookings' | 'payments' | 'users' | 'logs' | 'settings';

const AdminPanel = () => {
  const { hasRole } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!hasRole('admin')) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <AnimatedBackground />
        <Navigation />
        <div className="relative z-10 pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Alert variant="destructive">
              <AlertDescription>
                {t('accessDenied')}
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const menuItems = [
    { id: 'overview', label: t('overview'), icon: LayoutDashboard },
    { id: 'bookings', label: t('bookings'), icon: Calendar },
    { id: 'payments', label: t('payments'), icon: CreditCard },
    { id: 'users', label: t('users'), icon: Users },
    { id: 'logs', label: t('logs'), icon: FileText },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-20">
        <div className="flex h-[calc(100vh-80px)]">
          {/* Sidebar */}
          <aside
            className={cn(
              "fixed lg:static top-20 left-0 h-[calc(100vh-80px)] bg-card border-r transition-transform duration-300 z-40",
              sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"
            )}
          >
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-6">
                {sidebarOpen && (
                  <h2 className="text-lg font-semibold">{t('adminPanel')}</h2>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden"
                >
                  {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>

              <nav className="space-y-2 flex-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? 'default' : 'ghost'}
                      className={cn(
                        "w-full justify-start",
                        !sidebarOpen && "lg:justify-center lg:px-2"
                      )}
                      onClick={() => setActiveTab(item.id as TabType)}
                    >
                      <Icon className={cn("h-5 w-5", sidebarOpen && "mr-2")} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 lg:hidden z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mb-4 lg:hidden"
            >
              <Menu className="h-4 w-4 mr-2" />
              {t('menu')}
            </Button>

            {activeTab === 'overview' && <AdminDashboard />}
            {activeTab === 'bookings' && <EnhancedBookingsManagement />}
            {activeTab === 'users' && <UsersManagement />}
            {activeTab === 'payments' && (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('paymentsComingSoon')}</h3>
                <p className="text-muted-foreground">{t('featureInDevelopment')}</p>
              </div>
            )}
            {activeTab === 'logs' && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('logsComingSoon')}</h3>
                <p className="text-muted-foreground">{t('featureInDevelopment')}</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="text-center py-12">
                <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('settingsComingSoon')}</h3>
                <p className="text-muted-foreground">{t('featureInDevelopment')}</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;