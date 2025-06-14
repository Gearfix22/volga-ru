
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
import { CalendarIcon, MapPin, Clock, Hotel, Calendar, Users, Plane } from 'lucide-react';

interface BookingData {
  serviceType: string;
  serviceDetails: any;
  userInfo: {
    fullName: string;
    email: string;
    phone: string;
    language: string;
  };
}

const Booking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState('');
  const [serviceDetails, setServiceDetails] = useState({});
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    language: 'english'
  });

  const serviceTypes = [
    { id: 'transportation', name: 'Transportation', icon: Plane, description: 'Airport transfers, city tours' },
    { id: 'hotel', name: 'Hotel Reservation', icon: Hotel, description: 'Comfortable accommodations' },
    { id: 'event', name: 'Event Booking', icon: Calendar, description: 'Cultural events and activities' },
    { id: 'trip', name: 'Custom Trip', icon: MapPin, description: 'Personalized travel experiences' }
  ];

  const handleServiceDetailsChange = (field: string, value: string) => {
    setServiceDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleUserInfoChange = (field: string, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1 && serviceType) {
      setStep(2);
    } else if (step === 2) {
      const bookingData: BookingData = {
        serviceType,
        serviceDetails,
        userInfo
      };
      // Store booking data in localStorage for payment page
      localStorage.setItem('bookingData', JSON.stringify(bookingData));
      navigate('/payment');
    }
  };

  const renderServiceForm = () => {
    switch (serviceType) {
      case 'transportation':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup">Pickup Location</Label>
                <Input
                  id="pickup"
                  placeholder="Enter pickup address"
                  value={serviceDetails.pickup || ''}
                  onChange={(e) => handleServiceDetailsChange('pickup', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dropoff">Drop-off Location</Label>
                <Input
                  id="dropoff"
                  placeholder="Enter destination"
                  value={serviceDetails.dropoff || ''}
                  onChange={(e) => handleServiceDetailsChange('dropoff', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={serviceDetails.date || ''}
                  onChange={(e) => handleServiceDetailsChange('date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={serviceDetails.time || ''}
                  onChange={(e) => handleServiceDetailsChange('time', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vehicle">Vehicle Type</Label>
                <Select onValueChange={(value) => handleServiceDetailsChange('vehicle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="luxury">Luxury Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'hotel':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter city name"
                  value={serviceDetails.city || ''}
                  onChange={(e) => handleServiceDetailsChange('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="hotel">Hotel Name (Optional)</Label>
                <Input
                  id="hotel"
                  placeholder="Specific hotel preference"
                  value={serviceDetails.hotel || ''}
                  onChange={(e) => handleServiceDetailsChange('hotel', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="checkin">Check-in Date</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={serviceDetails.checkin || ''}
                  onChange={(e) => handleServiceDetailsChange('checkin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="checkout">Check-out Date</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={serviceDetails.checkout || ''}
                  onChange={(e) => handleServiceDetailsChange('checkout', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="roomType">Room Type</Label>
                <Select onValueChange={(value) => handleServiceDetailsChange('roomType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
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
          </div>
        );

      case 'event':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventName">Event Name</Label>
                <Input
                  id="eventName"
                  placeholder="Enter event name"
                  value={serviceDetails.eventName || ''}
                  onChange={(e) => handleServiceDetailsChange('eventName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eventLocation">Event Location</Label>
                <Input
                  id="eventLocation"
                  placeholder="Enter event location"
                  value={serviceDetails.eventLocation || ''}
                  onChange={(e) => handleServiceDetailsChange('eventLocation', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={serviceDetails.eventDate || ''}
                  onChange={(e) => handleServiceDetailsChange('eventDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tickets">Number of Tickets</Label>
                <Input
                  id="tickets"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={serviceDetails.tickets || ''}
                  onChange={(e) => handleServiceDetailsChange('tickets', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'trip':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Trip Duration</Label>
                <Select onValueChange={(value) => handleServiceDetailsChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3">1-3 days</SelectItem>
                    <SelectItem value="4-7">4-7 days</SelectItem>
                    <SelectItem value="1-2weeks">1-2 weeks</SelectItem>
                    <SelectItem value="3weeks+">3+ weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="regions">Regions to Visit</Label>
                <Input
                  id="regions"
                  placeholder="e.g., Moscow, St. Petersburg"
                  value={serviceDetails.regions || ''}
                  onChange={(e) => handleServiceDetailsChange('regions', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="interests">Interests & Preferences</Label>
              <Textarea
                id="interests"
                placeholder="Tell us about your interests, preferred activities, budget range, etc."
                value={serviceDetails.interests || ''}
                onChange={(e) => handleServiceDetailsChange('interests', e.target.value)}
              />
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
              Step {step} of 2: {step === 1 ? 'Select & Configure Service' : 'Your Information'}
            </p>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle>
                {step === 1 ? 'Choose Your Service' : 'Contact Information'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Select a service type and provide the required details'
                  : 'Please provide your contact information to complete the booking'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {serviceTypes.map((service) => {
                      const Icon = service.icon;
                      return (
                        <Card
                          key={service.id}
                          className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                            serviceType === service.id
                              ? 'ring-2 ring-primary bg-primary/5'
                              : 'hover:shadow-lg'
                          }`}
                          onClick={() => setServiceType(service.id)}
                        >
                          <CardContent className="p-6 text-center">
                            <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                            <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {service.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {serviceType && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Service Details</h3>
                      {renderServiceForm()}
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={userInfo.fullName}
                        onChange={(e) => handleUserInfoChange('fullName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={userInfo.email}
                        onChange={(e) => handleUserInfoChange('email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="Enter your phone number"
                        value={userInfo.phone}
                        onChange={(e) => handleUserInfoChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">Preferred Language</Label>
                      <Select 
                        value={userInfo.language}
                        onValueChange={(value) => handleUserInfoChange('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="russian">Russian</SelectItem>
                          <SelectItem value="arabic">Arabic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6">
                {step === 2 && (
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !serviceType) ||
                    (step === 2 && (!userInfo.fullName || !userInfo.email || !userInfo.phone))
                  }
                  className="ml-auto"
                >
                  {step === 1 ? 'Next' : 'Proceed to Payment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Booking;
