
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Car, Hotel, Calendar, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ServiceDetails, UserInfo } from '@/types/booking';

const Booking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [serviceType, setServiceType] = useState('');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>({});
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '',
    email: '',
    phone: '',
    language: 'english'
  });

  const updateServiceDetail = (key: string, value: string | string[]) => {
    setServiceDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateUserInfo = (key: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceType) {
      toast({
        title: "Service required",
        description: "Please select a service type.",
        variant: "destructive"
      });
      return;
    }

    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      toast({
        title: "Contact information required",
        description: "Please fill in all required contact fields.",
        variant: "destructive"
      });
      return;
    }

    const bookingData = {
      serviceType,
      serviceDetails,
      userInfo
    };

    localStorage.setItem('bookingData', JSON.stringify(bookingData));
    navigate('/payment');
  };

  const renderServiceForm = () => {
    const details = serviceDetails as any;
    
    switch (serviceType) {
      case 'transportation':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup">Pickup Location *</Label>
                <Input
                  id="pickup"
                  value={details.pickup || ''}
                  onChange={(e) => updateServiceDetail('pickup', e.target.value)}
                  placeholder="Enter pickup location"
                />
              </div>
              <div>
                <Label htmlFor="dropoff">Drop-off Location *</Label>
                <Input
                  id="dropoff"
                  value={details.dropoff || ''}
                  onChange={(e) => updateServiceDetail('dropoff', e.target.value)}
                  placeholder="Enter drop-off location"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={details.date || ''}
                  onChange={(e) => updateServiceDetail('date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={details.time || ''}
                  onChange={(e) => updateServiceDetail('time', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select onValueChange={(value) => updateServiceDetail('vehicleType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="minivan">Minivan</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'hotel':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={details.city || ''}
                  onChange={(e) => updateServiceDetail('city', e.target.value)}
                  placeholder="Enter city name"
                />
              </div>
              <div>
                <Label htmlFor="hotel">Hotel Name</Label>
                <Input
                  id="hotel"
                  value={details.hotel || ''}
                  onChange={(e) => updateServiceDetail('hotel', e.target.value)}
                  placeholder="Preferred hotel (optional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkin">Check-in Date *</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={details.checkin || ''}
                  onChange={(e) => updateServiceDetail('checkin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="checkout">Check-out Date *</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={details.checkout || ''}
                  onChange={(e) => updateServiceDetail('checkout', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="roomType">Room Type</Label>
              <Select onValueChange={(value) => updateServiceDetail('roomType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Room</SelectItem>
                  <SelectItem value="double">Double Room</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="family">Family Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                value={details.eventName || ''}
                onChange={(e) => updateServiceDetail('eventName', e.target.value)}
                placeholder="Enter event name"
              />
            </div>
            <div>
              <Label htmlFor="eventLocation">Event Location *</Label>
              <Input
                id="eventLocation"
                value={details.eventLocation || ''}
                onChange={(e) => updateServiceDetail('eventLocation', e.target.value)}
                placeholder="Enter event location"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={details.eventDate || ''}
                  onChange={(e) => updateServiceDetail('eventDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tickets">Number of Tickets *</Label>
                <Input
                  id="tickets"
                  type="number"
                  min="1"
                  value={details.tickets || ''}
                  onChange={(e) => updateServiceDetail('tickets', e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        );

      case 'trip':
        const interests = details.interests || [];
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="duration">Trip Duration *</Label>
              <Select onValueChange={(value) => updateServiceDetail('duration', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3-days">1-3 days</SelectItem>
                  <SelectItem value="4-7-days">4-7 days</SelectItem>
                  <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
                  <SelectItem value="3-4-weeks">3-4 weeks</SelectItem>
                  <SelectItem value="1-month+">1 month+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="regions">Regions to Visit *</Label>
              <Textarea
                id="regions"
                value={details.regions || ''}
                onChange={(e) => updateServiceDetail('regions', e.target.value)}
                placeholder="Describe the regions or cities you'd like to visit"
                rows={3}
              />
            </div>
            <div>
              <Label>Interests (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {['History', 'Culture', 'Nature', 'Adventure', 'Food', 'Shopping', 'Nightlife', 'Architecture', 'Museums'].map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={interests.includes(interest)}
                      onCheckedChange={(checked) => {
                        const newInterests = checked
                          ? [...interests, interest]
                          : interests.filter((i: string) => i !== interest);
                        updateServiceDetail('interests', newInterests);
                      }}
                    />
                    <Label htmlFor={interest} className="text-sm">{interest}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Book Your Service
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Choose your service and provide the necessary details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Selection */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle>Select Service Type</CardTitle>
                <CardDescription>Choose the service you need</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'transportation', label: 'Transportation', icon: Car },
                    { id: 'hotel', label: 'Hotel Reservation', icon: Hotel },
                    { id: 'event', label: 'Event Booking', icon: Calendar },
                    { id: 'trip', label: 'Custom Trip', icon: MapPin }
                  ].map(({ id, label, icon: Icon }) => (
                    <Card
                      key={id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        serviceType === id ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setServiceType(id)}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium">{label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Details Form */}
            {serviceType && (
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle>Service Details</CardTitle>
                  <CardDescription>Provide specific information for your selected service</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderServiceForm()}
                </CardContent>
              </Card>
            )}

            {/* User Information */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>We'll use this information to contact you about your booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={userInfo.fullName}
                      onChange={(e) => updateUserInfo('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => updateUserInfo('email', e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => updateUserInfo('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Preferred Language</Label>
                    <Select value={userInfo.language} onValueChange={(value) => updateUserInfo('language', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="arabic">Arabic</SelectItem>
                        <SelectItem value="russian">Russian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="text-center">
              <Button type="submit" size="lg" className="px-8">
                Proceed to Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Booking;
