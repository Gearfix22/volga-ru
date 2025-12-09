import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { EnhancedBookingsManagement } from '@/components/admin/EnhancedBookingsManagement';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { AdminPayments } from '@/components/admin/AdminPayments';
import { AdminLogs } from '@/components/admin/AdminLogs';

type TabType = 'overview' | 'bookings' | 'payments' | 'users' | 'logs';

const AdminPanel = () => {
  const { user, loading, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      navigate('/admin?tab=overview', { replace: true });
    }
  }, [searchParams, navigate]);

  // Redirect to admin login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin-login', { replace: true });
    }
  }, [loading, user, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect handled above, but show nothing while redirecting
  if (!user) {
    return null;
  }

  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Access Denied. You do not have permission to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getTitleForTab = (tab: TabType) => {
    const titles: Record<TabType, string> = {
      overview: 'Overview',
      bookings: 'Bookings',
      payments: 'Payments',
      users: 'Users',
      logs: 'Logs',
    };
    return titles[tab] || 'Admin Panel';
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
            {activeTab === 'payments' && <AdminPayments />}
            {activeTab === 'logs' && <AdminLogs />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanel;
