import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { AuthRequiredWrapper } from '@/components/booking/AuthRequiredWrapper';
import { ResumeBookingDialog } from '@/components/booking/ResumeBookingDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, User, Mail, Phone, Globe, Save, Clock, CheckCircle, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceTypeSelector } from '@/components/booking/ServiceTypeSelector';
import { ServiceDetailsForm } from '@/components/booking/ServiceDetailsForm';
import { PricingDisplay } from '@/components/booking/PricingDisplay';
import { BookingFormTracker } from '@/components/booking/BookingFormTracker';
import { useDataTracking } from '@/hooks/useDataTracking';
import { saveDraftBooking, getDraftBookings, DraftBooking } from '@/services/bookingService';
import { supabase } from '@/integrations/supabase/client';
import { useServiceValidation } from '@/hooks/useServiceValidation';
import type { ServiceDetails, UserInfo } from '@/types/booking';

const EnhancedBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { trackForm } = useDataTracking();
  const { validateServiceDetails: validateServiceSchema } = useServiceValidation();
  const [searchParams] = useSearchParams();
  
  const [serviceType, setServiceType] = useState('');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>({});
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    language: 'english'
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [driverRequired, setDriverRequired] = useState(false);

  const serviceFromUrl = searchParams.get('service');
  const isPreSelected = !!serviceFromUrl;

  // Fetch user profile and auto-populate phone number
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || profileLoaded) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('phone, full_name, preferred_language')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (profile) {
          setUserInfo(prev => ({
            ...prev,
            phone: profile.phone || prev.phone,
            fullName: profile.full_name || prev.fullName,
            language: profile.preferred_language || prev.language
          }));
          setProfileLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user, profileLoaded]);

  // Handle resume booking from state
  useEffect(() => {
    const resumeDraft = location.state?.resumeDraft as DraftBooking;
    if (resumeDraft) {
      setServiceType(resumeDraft.service_type);
      setServiceDetails(resumeDraft.service_details);
      setUserInfo(resumeDraft.user_info);
      setCurrentDraftId(resumeDraft.id);
      
      toast({
        title: t('booking.bookingResumed'),
        description: t('booking.continueWhereLeft'),
      });
    }
  }, [location.state, t, toast]);

  // Pre-select service type from URL parameters
  useEffect(() => {
    if (serviceFromUrl && !location.state?.resumeDraft) {
      const serviceMap: { [key: string]: string } = {
        'transportation': 'Transportation',
        'hotel': 'Hotels',
        'hotels': 'Hotels',
        'event': 'Events',
        'events': 'Events',
        'trip': 'Custom Trips',
        'trips': 'Custom Trips'
      };
      
      const mappedService = serviceMap[serviceFromUrl.toLowerCase()] || 
                           serviceFromUrl.charAt(0).toUpperCase() + serviceFromUrl.slice(1);
      
      setServiceType(mappedService);
    }
  }, [serviceFromUrl, location.state]);

  // Check for existing drafts on mount
  useEffect(() => {
    if (user && !location.state?.resumeDraft) {
      checkForExistingDrafts();
    }
  }, [user, location.state]);

  // Auto-save functionality
  useEffect(() => {
    if (user && serviceType && (Object.keys(serviceDetails).length > 0 || userInfo.fullName)) {
      const timer = setTimeout(() => {
        autoSave();
      }, 10000); // Auto-save after 10 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [serviceType, serviceDetails, userInfo, user]);

  const checkForExistingDrafts = async () => {
    try {
      const drafts = await getDraftBookings();
      if (drafts.length > 0) {
        setShowResumeDialog(true);
      }
    } catch (error) {
      console.error('Error checking for drafts:', error);
    }
  };

  const autoSave = async () => {
    if (!user || !serviceType) return;
    
    setIsSaving(true);
    try {
      const progress = determineProgress();
      const totalPrice = calculatePrice();
      
      const draft = await saveDraftBooking(
        serviceType,
        serviceDetails,
        userInfo,
        progress,
        totalPrice
      );
      
      if (draft) {
        setCurrentDraftId(draft.id);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const checkRequiredFields = (): boolean => {
    const details = serviceDetails as any;
    const requiredFields: { [key: string]: string[] } = {
      'Transportation': ['pickup', 'dropoff', 'date', 'time', 'vehicleType'],
      'Hotels': ['city', 'checkin', 'checkout', 'roomType'],
      'Events': ['eventName', 'eventLocation', 'eventDate', 'tickets'],
      'Custom Trips': ['duration', 'regions']
    };

    const missing = requiredFields[serviceType]?.filter(field => !details[field]) || [];
    return missing.length === 0;
  };

  const determineProgress = (): DraftBooking['booking_progress'] => {
    if (!serviceType) return 'service_selection';
    
    const hasRequiredDetails = checkRequiredFields();
    if (!hasRequiredDetails) return 'details_filled';
    
    const hasUserInfo = userInfo.fullName && userInfo.email && userInfo.phone;
    if (!hasUserInfo) return 'user_info_filled';
    
    return 'ready_for_payment';
  };

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

  const validateForm = (): boolean => {
    if (!serviceType) {
      toast({
        title: 'Service Required',
        description: 'Please select a service type',
        variant: "destructive"
      });
      return false;
    }

    // Use zod schema validation for service details
    if (!validateServiceSchema(serviceType, serviceDetails)) {
      return false;
    }

    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      toast({
        title: 'Contact Information Required',
        description: 'Please fill in all required contact fields',
        variant: "destructive"
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: "destructive"
      });
      return false;
    }

    // Validate phone number format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(userInfo.phone.replace(/[\s\-\(\)]/g, ''))) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number',
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const calculatePrice = () => {
    const basePrices = {
      'Transportation': 50,
      'Hotels': 100,
      'Events': 75,
      'Custom Trips': 200
    };
    
    return basePrices[serviceType as keyof typeof basePrices] || 0;
  };

  const handleManualSave = async () => {
    if (!user || !serviceType) return;
    
    setIsSaving(true);
    try {
      const progress = determineProgress();
      const totalPrice = calculatePrice();
      
      await saveDraftBooking(
        serviceType,
        serviceDetails,
        userInfo,
        progress,
        totalPrice
      );
      
      setLastSaved(new Date());
      toast({
        title: t('booking.saved'),
        description: t('booking.progressSaved'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('booking.saveError'),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      trackForm('booking', 'abandoned', {
        serviceType,
        serviceDetails,
        userInfo,
        reason: 'validation_failed'
      });
      return;
    }

    // Final save before proceeding to payment
    await autoSave();

    const totalPrice = calculatePrice();
    const bookingData = {
      serviceType,
      serviceDetails,
      userInfo,
      totalPrice,
      driverRequired
    };

    // Track form submission
    trackForm('booking', 'submitted', {
      serviceType,
      totalPrice,
      hasAllRequiredFields: true
    });

    toast({
      title: t('bookingDetailsSaved'),
      description: t('proceedingToPayment'),
    });

    navigate('/enhanced-payment', {
      state: { 
        bookingData,
        draftId: currentDraftId 
      }
    });
  };

  const handleResumeBooking = (draft: DraftBooking) => {
    setServiceType(draft.service_type);
    setServiceDetails(draft.service_details);
    setUserInfo(draft.user_info);
    setCurrentDraftId(draft.id);
  };

  return (
    <AuthRequiredWrapper requireAuth={true}>
      <div className="relative min-h-screen overflow-hidden">
        <AnimatedBackground />
        <Navigation />
        
        <div className="relative z-10 pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <BackButton className="text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800" />
              
              <div className="flex items-center gap-4">
                {/* Save Status */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isSaving ? (
                    <>
                      <Save className="h-4 w-4 animate-pulse" />
                      {t('booking.saving')}
                    </>
                  ) : lastSaved ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('booking.savedAt')} {lastSaved.toLocaleTimeString()}
                    </>
                  ) : null}
                </div>

                {/* Manual Save Button */}
                <Button
                  onClick={handleManualSave}
                  variant="outline"
                  size="sm"
                  disabled={isSaving || !serviceType}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('booking.saveProgress')}
                </Button>

                {/* Resume Booking Button */}
                <Button
                  onClick={() => setShowResumeDialog(true)}
                  variant="outline"
                  size="sm"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {t('booking.resumeBooking')}
                </Button>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {t('bookYourService')}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {isPreSelected 
                  ? t('completeBookingDetails', { serviceType })
                  : t('chooseServiceDetails')
                }
              </p>
            </div>

            {/* Progress Indicator */}
            {serviceType && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('booking.autoSaveEnabled')} - {t('booking.progressTracked')}
                </AlertDescription>
              </Alert>
            )}

            <BookingFormTracker
              serviceType={serviceType}
              serviceDetails={serviceDetails}
              userInfo={userInfo}
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Service Type Selection */}
                <ServiceTypeSelector
                  serviceType={serviceType}
                  onSelectService={setServiceType}
                  preSelected={isPreSelected}
                />

                {/* Service Details Form */}
                {serviceType && (
                  <>
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        {t('serviceTypeDetails', { serviceType })}
                      </h2>
                      <ServiceDetailsForm
                        serviceType={serviceType}
                        serviceDetails={serviceDetails}
                        onUpdateDetail={updateServiceDetail}
                      />
                    </div>

                    {/* Pricing Display */}
                    <PricingDisplay
                      serviceType={serviceType}
                      serviceDetails={serviceDetails}
                    />
                  </>
                )}

                {/* User Information */}
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t('contactInformation')}
                    </CardTitle>
                    <CardDescription>{t('contactInfoDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {t('fullName')} *
                        </Label>
                        <Input
                          id="fullName"
                          value={userInfo.fullName}
                          onChange={(e) => updateUserInfo('fullName', e.target.value)}
                          placeholder={t('enterFullName')}
                          maxLength={100}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {t('emailAddress')} *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={userInfo.email}
                          onChange={(e) => updateUserInfo('email', e.target.value)}
                          placeholder={t('enterEmail')}
                          maxLength={255}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {t('phoneNumber')} *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={userInfo.phone}
                          onChange={(e) => updateUserInfo('phone', e.target.value)}
                          placeholder={t('enterPhone')}
                          maxLength={20}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t('preferredLanguage')}
                        </Label>
                        <Select value={userInfo.language} onValueChange={(value) => updateUserInfo('language', value)}>
                          <SelectTrigger className="focus:ring-2 focus:ring-primary">
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

                    {/* Driver Required Option */}
                    <div className="flex items-center space-x-3 pt-4 border-t">
                      <Checkbox
                        id="driverRequired"
                        checked={driverRequired}
                        onCheckedChange={(checked) => setDriverRequired(checked === true)}
                      />
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="driverRequired" className="cursor-pointer">
                          I need a driver for this service
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="text-center">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    disabled={!serviceType || !userInfo.fullName || !userInfo.email || !userInfo.phone}
                  >
                    {t('proceedToPayment')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            </BookingFormTracker>
          </div>
        </div>

        <Footer />

        {/* Resume Booking Dialog */}
        <ResumeBookingDialog
          isOpen={showResumeDialog}
          onClose={() => setShowResumeDialog(false)}
          onResumeBooking={handleResumeBooking}
        />
      </div>
    </AuthRequiredWrapper>
  );
};

export default EnhancedBooking;