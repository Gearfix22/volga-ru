
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserBookings } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, MapPin, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDataTracking } from '@/hooks/useDataTracking';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { trackForm } = useDataTracking();

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: getUserBookings,
    enabled: !!user,
    retry: 1,
  });

  useEffect(() => {
    if (user) {
      trackForm('dashboard', 'started', { 
        section: 'overview',
        userId: user.id 
      });
    }
  }, [trackForm, user]);

  const recentBookings = bookings?.slice(0, 3) || [];
  const totalBookings = bookings?.length || 0;
  const pendingBookings = bookings?.filter(b => b.booking_status === 'pending').length || 0;
  const totalSpent = bookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getUserWelcomeName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    return user?.email?.split('@')[0] || 'there';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {getUserWelcomeName()}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your account.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link to="/booking">
              <Button className="w-full" size="sm">
                New Booking
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${user?.email_confirmed_at ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <div>
                <p className="text-sm font-medium">Email Verification</p>
                <p className="text-xs text-gray-600">
                  {user?.email_confirmed_at ? 'Verified' : 'Pending verification'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium">Account Active</p>
                <p className="text-xs text-gray-600">
                  Since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-xs text-gray-600">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Reservations</CardTitle>
            <Link to="/dashboard/reservations">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-6">
              <p className="text-red-500">Error loading reservations</p>
              <p className="text-xs text-gray-500 mt-1">Please try refreshing the page</p>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reservations yet</p>
              <Link to="/booking">
                <Button className="mt-4">Make Your First Booking</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h4 className="font-medium">{booking.service_type}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${booking.total_price}</p>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      booking.booking_status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : booking.booking_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.booking_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
