import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  CreditCard, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface AdminStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  totalUsers: number;
  newUsersToday: number;
}

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { hasRole } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalUsers: 0,
    newUsersToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasRole('admin')) {
      fetchAdminStats();
      
      // Set up real-time subscriptions
      const bookingsChannel = supabase
        .channel('admin-bookings')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, () => {
          fetchAdminStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(bookingsChannel);
      };
    }
  }, [hasRole]);

  const fetchAdminStats = async () => {
    try {
      // Fetch bookings stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, payment_status, total_price, created_at');

      // Fetch users stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at');

      if (bookings) {
        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter(b => b.status === 'pending').length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'paid').length;
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
        
        const totalRevenue = bookings
          .filter(b => b.payment_status === 'paid')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);
        
        const pendingPayments = bookings.filter(b => 
          b.payment_status === 'pending' || b.payment_status === 'pending_verification'
        ).length;

        const today = new Date().toDateString();
        const newUsersToday = profiles?.filter(p => 
          new Date(p.created_at).toDateString() === today
        ).length || 0;

        setStats({
          totalBookings,
          pendingBookings,
          confirmedBookings,
          cancelledBookings,
          totalRevenue,
          pendingPayments,
          totalUsers: profiles?.length || 0,
          newUsersToday,
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('admin')) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('adminDashboard')}>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</p>
                </div>
                <CreditCard className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                  <p className="text-xl font-bold text-green-600">{stats.confirmedBookings}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                </div>
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                  <p className="text-xl font-bold text-red-600">{stats.cancelledBookings}</p>
                </div>
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your booking platform efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recent">
              <TabsList>
                <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recent" className="space-y-4">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Recent booking activities will appear here</p>
                </div>
              </TabsContent>
              
              <TabsContent value="alerts" className="space-y-4">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">System alerts and notifications</p>
                </div>
              </TabsContent>
              
              <TabsContent value="reports" className="space-y-4">
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Analytics and reports coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;