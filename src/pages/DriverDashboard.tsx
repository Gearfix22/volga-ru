import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, LogOut, Calendar, MapPin, Phone, User } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

const DriverDashboard = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth?role=driver');
  };

  // Check if user has driver role
  if (!hasRole('driver')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Access denied. Driver privileges required.</p>
            <Button className="mt-4" onClick={() => navigate('/auth?role=driver')}>
              Go to Driver Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Car className="h-8 w-8 text-primary" />
              Driver Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, driver!
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Phone: {user?.phone || 'Not set'}
                </p>
                <Badge variant="secondary">Driver</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Trips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Assigned Trips
              </CardTitle>
              <CardDescription>Your upcoming assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">No trips assigned yet.</p>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Current Location
              </CardTitle>
              <CardDescription>Your service area</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Location tracking not active.</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Contact dispatch for any questions or issues.
            </p>
            <Button asChild>
              <a href="https://wa.me/79522212903" target="_blank" rel="noopener noreferrer">
                Contact via WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;
