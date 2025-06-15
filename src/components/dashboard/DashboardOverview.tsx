
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserBookings } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, MapPin, Users, TrendingUp, Crown, Star } from 'lucide-react';
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
      <div className="space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
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
    return user?.email?.split('@')[0] || 'Traveler';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-russian-blue via-volga-logo-blue to-russian-blue rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center space-x-4 mb-4">
          <Crown className="h-12 w-12 text-russian-gold" />
          <div>
            <h1 className="text-3xl font-serif font-bold">
              Welcome back, {getUserWelcomeName()}!
            </h1>
            <p className="text-lg text-blue-100 font-medium">
              Your luxury travel dashboard awaits
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${user?.email_confirmed_at ? 'bg-russian-gold' : 'bg-yellow-400'}`}></div>
              <div>
                <p className="text-sm font-medium">Email Status</p>
                <p className="text-xs text-blue-100">
                  {user?.email_confirmed_at ? 'Verified' : 'Pending verification'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-russian-gold"></div>
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-xs text-blue-100">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-russian-gold"></div>
              <div>
                <p className="text-sm font-medium">Last Visit</p>
                <p className="text-xs text-blue-100">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Today'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Journeys</CardTitle>
            <Calendar className="h-5 w-5 text-russian-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-russian-blue">{totalBookings}</div>
            <p className="text-xs text-gray-600 font-medium">
              Lifetime adventures
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending</CardTitle>
            <Users className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingBookings}</div>
            <p className="text-xs text-gray-600 font-medium">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Investment</CardTitle>
            <TrendingUp className="h-5 w-5 text-russian-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-russian-gold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-gray-600 font-medium">
              Total experiences
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-russian-blue to-volga-logo-blue text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
            <Star className="h-5 w-5 text-russian-gold" />
          </CardHeader>
          <CardContent>
            <Link to="/booking">
              <Button className="w-full bg-russian-gold text-russian-blue hover:bg-yellow-400 font-semibold" size="sm">
                New Journey
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="h-6 w-6 text-russian-blue" />
              <CardTitle className="text-xl font-serif text-gray-800">Recent Adventures</CardTitle>
            </div>
            <Link to="/dashboard/reservations">
              <Button variant="outline" size="sm" className="border-russian-blue text-russian-blue hover:bg-russian-blue hover:text-white">
                View All Journeys
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-red-600 font-medium">Error loading adventures</p>
              <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-russian-blue to-volga-logo-blue rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-gray-800 mb-2">Your journey begins here</h3>
              <p className="text-gray-600 mb-6">Ready to explore the wonders of Russia?</p>
              <Link to="/booking">
                <Button className="bg-gradient-to-r from-russian-blue to-volga-logo-blue text-white hover:from-volga-logo-blue hover:to-russian-blue font-semibold px-8">
                  Plan Your First Adventure
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-6 border border-russian-silver/20 rounded-xl hover:bg-white/50 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-russian-blue to-volga-logo-blue rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-serif font-semibold text-gray-800">{booking.service_type}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-russian-blue">${booking.total_price}</p>
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
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
