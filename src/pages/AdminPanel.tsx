import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { EnhancedBookingsManagement } from '@/components/admin/EnhancedBookingsManagement';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { AdminPayments } from '@/components/admin/AdminPayments';
import { AdminLogs } from '@/components/admin/AdminLogs';
import DriversManagement from '@/components/admin/DriversManagement';
import GuidesManagement from '@/components/admin/GuidesManagement';
import { AdminDriverMap } from '@/components/admin/AdminDriverMap';
import AdminServicesManagement from '@/components/admin/AdminServicesManagement';
import AdminPriceNegotiations from '@/components/admin/AdminPriceNegotiations';

type TabType = 'overview' | 'bookings' | 'payments' | 'pricing' | 'drivers' | 'guides' | 'services' | 'map' | 'users' | 'logs';

const AdminPanel = () => {
  const { user, loading, hasRole } = useAuth();
  const { t, isRTL } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      navigate('/admin?tab=overview', { replace: true });
    }
  }, [searchParams, navigate]);

  // Show loading while checking auth (guard handles redirect)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTitleForTab = (tab: TabType) => {
    const titles: Record<TabType, string> = {
      overview: t('dashboard.overview'),
      bookings: t('dashboard.bookings'),
      payments: t('dashboard.payments'),
      pricing: t('dashboard.priceNegotiations'),
      drivers: t('dashboard.drivers'),
      guides: t('dashboard.guides'),
      services: t('dashboard.services'),
      map: t('dashboard.liveMap'),
      users: t('dashboard.users'),
      logs: t('dashboard.logs'),
    };
    return titles[tab] || t('dashboard.adminPanel');
  };

  return (
    <SidebarProvider>
      <div className={`flex min-h-screen w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <header className={`sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <SidebarTrigger className={isRTL ? '-mr-1' : '-ml-1'} />
            <Separator orientation="vertical" className={`${isRTL ? 'ml-2' : 'mr-2'} h-4`} />
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
            {activeTab === 'drivers' && <DriversManagement />}
            {activeTab === 'guides' && <GuidesManagement />}
            {activeTab === 'services' && <AdminServicesManagement />}
            {activeTab === 'pricing' && <AdminPriceNegotiations />}
            {activeTab === 'map' && <AdminDriverMap />}
            {activeTab === 'users' && <UsersManagement />}
            {activeTab === 'payments' && <AdminPayments />}
            {activeTab === 'logs' && <AdminLogs />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanel;
