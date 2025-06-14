import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Car, Hotel, Calendar, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ServiceDetails, UserInfo } from '@/types/booking';

const Booking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [serviceType, setServiceType] = useState('');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>({});
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '',
    email: '',
    phone: '',
    language: 'english'
  });

  // Pre-select service type from URL parameters
  useEffect(() => {
    const serviceFromUrl = searchParams.get('service');
    if (serviceFromUrl) {
      setServiceType(serviceFromUrl);
      console.log(`Pre-selecting service type: ${serviceFromUrl}`);
    }
  }, [searchParams]);

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
        title: t('serviceRequired'),
        description: t('pleaseSelectService'),
        variant: "destructive"
      });
      return;
    }

    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      toast({
        title: t('contactInfoRequired'),
        description: t('fillRequiredFields'),
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
                <Label htmlFor="pickup">{t('pickupLocation')} *</Label>
                <Input
                  id="pickup"
                  value={details.pickup || ''}
                  onChange={(e) => updateServiceDetail('pickup', e.target.value)}
                  placeholder={t('enterPickupLocation')}
                />
              </div>
              <div>
                <Label htmlFor="dropoff">{t('dropoffLocation')} *</Label>
                <Input
                  id="dropoff"
                  value={details.dropoff || ''}
                  onChange={(e) => updateServiceDetail('dropoff', e.target.value)}
                  placeholder={t('enterDropoffLocation')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">{t('date')} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={details.date || ''}
                  onChange={(e) => updateServiceDetail('date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="time">{t('time')} *</Label>
                <Input
                  id="time"
                  type="time"
                  value={details.time || ''}
                  onChange={(e) => updateServiceDetail('time', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vehicleType">{t('vehicleType')}</Label>
              <Select onValueChange={(value) => updateServiceDetail('vehicleType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectVehicleType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedan">{t('sedan')}</SelectItem>
                  <SelectItem value="suv">{t('suv')}</SelectItem>
                  <SelectItem value="minivan">{t('minivan')}</SelectItem>
                  <SelectItem value="bus">{t('bus')}</SelectItem>
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
                <Label htmlFor="city">{t('city')} *</Label>
                <Input
                  id="city"
                  value={details.city || ''}
                  onChange={(e) => updateServiceDetail('city', e.target.value)}
                  placeholder={t('enterCityName')}
                />
              </div>
              <div>
                <Label htmlFor="hotel">{t('hotel')}</Label>
                <Input
                  id="hotel"
                  value={details.hotel || ''}
                  onChange={(e) => updateServiceDetail('hotel', e.target.value)}
                  placeholder={t('preferredHotel')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkin">{t('checkinDate')} *</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={details.checkin || ''}
                  onChange={(e) => updateServiceDetail('checkin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="checkout">{t('checkoutDate')} *</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={details.checkout || ''}
                  onChange={(e) => updateServiceDetail('checkout', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="roomType">{t('roomType')}</Label>
              <Select onValueChange={(value) => updateServiceDetail('roomType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectRoomType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{t('singleRoom')}</SelectItem>
                  <SelectItem value="double">{t('doubleRoom')}</SelectItem>
                  <SelectItem value="suite">{t('suite')}</SelectItem>
                  <SelectItem value="family">{t('familyRoom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventName">{t('eventName')} *</Label>
              <Input
                id="eventName"
                value={details.eventName || ''}
                onChange={(e) => updateServiceDetail('eventName', e.target.value)}
                placeholder={t('enterEventName')}
              />
            </div>
            <div>
              <Label htmlFor="eventLocation">{t('eventLocation')} *</Label>
              <Input
                id="eventLocation"
                value={details.eventLocation || ''}
                onChange={(e) => updateServiceDetail('eventLocation', e.target.value)}
                placeholder={t('enterEventLocation')}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">{t('eventDate')} *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={details.eventDate || ''}
                  onChange={(e) => updateServiceDetail('eventDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tickets">{t('numberOfTickets')} *</Label>
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
              <Label htmlFor="duration">{t('tripDuration')} *</Label>
              <Select onValueChange={(value) => updateServiceDetail('duration', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectDuration')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3-days">{t('oneToDays')}</SelectItem>
                  <SelectItem value="4-7-days">{t('fourToSevenDays')}</SelectItem>
                  <SelectItem value="1-2-weeks">{t('oneToTwoWeeks')}</SelectItem>
                  <SelectItem value="3-4-weeks">{t('threeToFourWeeks')}</SelectItem>
                  <SelectItem value="1-month+">{t('oneMonthPlus')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="regions">{t('regionsToVisit')} *</Label>
              <Textarea
                id="regions"
                value={details.regions || ''}
                onChange={(e) => updateServiceDetail('regions', e.target.value)}
                placeholder={t('describeRegions')}
                rows={3}
              />
            </div>
            <div>
              <Label>{t('interests')}</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {[t('history'), t('culture'), t('nature'), t('adventure'), t('food'), t('shopping'), t('nightlife'), t('architecture'), t('museums')].map((interest, index) => {
                  const interestKeys = ['history', 'culture', 'nature', 'adventure', 'food', 'shopping', 'nightlife', 'architecture', 'museums'];
                  const interestKey = interestKeys[index];
                  return (
                    <div key={interestKey} className="flex items-center space-x-2">
                      <Checkbox
                        id={interestKey}
                        checked={interests.includes(interest)}
                        onCheckedChange={(checked) => {
                          const newInterests = checked
                            ? [...interests, interest]
                            : interests.filter((i: string) => i !== interest);
                          updateServiceDetail('interests', newInterests);
                        }}
                      />
                      <Label htmlFor={interestKey} className="text-sm">{interest}</Label>
                    </div>
                  );
                })}
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
          <div className="mb-6">
            <BackButton className="text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('bookYourService')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {t('chooseServiceDetails')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Selection - Only show if no service is pre-selected */}
            {!searchParams.get('service') && (
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle>{t('selectServiceType')}</CardTitle>
                  <CardDescription>{t('chooseServiceYouNeed')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { id: 'transportation', label: t('transportation'), icon: Car },
                      { id: 'hotel', label: t('hotelReservation'), icon: Hotel },
                      { id: 'event', label: t('eventBooking'), icon: Calendar },
                      { id: 'trip', label: t('customTrip'), icon: MapPin }
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
            )}

            {/* Service Details Form */}
            {serviceType && (
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle>{t('serviceDetails')}</CardTitle>
                  <CardDescription>{t('provideSpecificInfo')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderServiceForm()}
                </CardContent>
              </Card>
            )}

            {/* User Information */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle>{t('contactInformation')}</CardTitle>
                <CardDescription>{t('contactInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">{t('fullName')} *</Label>
                    <Input
                      id="fullName"
                      value={userInfo.fullName}
                      onChange={(e) => updateUserInfo('fullName', e.target.value)}
                      placeholder={t('enterFullName')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('emailAddress')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => updateUserInfo('email', e.target.value)}
                      placeholder={t('enterEmail')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{t('phoneNumber')} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => updateUserInfo('phone', e.target.value)}
                      placeholder={t('enterPhone')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">{t('preferredLanguage')}</Label>
                    <Select value={userInfo.language} onValueChange={(value) => updateUserInfo('language', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">{t('english')}</SelectItem>
                        <SelectItem value="arabic">{t('arabic')}</SelectItem>
                        <SelectItem value="russian">{t('russian')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="text-center">
              <Button type="submit" size="lg" className="px-8">
                {t('proceedToPayment')}
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
