import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, FileText } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { EnhancedBookingsManagement } from '@/components/admin/EnhancedBookingsManagement';
import { UsersManagement } from '@/components/admin/UsersManagement';

type TabType = 'overview' | 'bookings' | 'payments' | 'users' | 'logs';

const AdminPanel = () => {
  const { hasRole } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      navigate('/admin?tab=overview', { replace: true });
    }
  }, [searchParams, navigate]);

  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {t('accessDenied')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getTitleForTab = (tab: TabType) => {
    const titles = {
      overview: t('overview'),
      bookings: t('bookings'),
      payments: t('payments'),
      users: t('users'),
      logs: t('logs'),
    };
    return titles[tab] || t('adminPanel');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">
                    {getTitleForTab(activeTab)}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          
          <main className="flex-1 p-4 md:p-6 lg:p-8">
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
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanel;