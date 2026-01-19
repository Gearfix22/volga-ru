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
import { saveDraftBooking, getLatestDraft, deleteDraftBooking, DraftBooking } from '@/services/bookingService';
import { getServiceByType, ServiceData } from '@/services/servicesService';
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
  const [currentService, setCurrentService] = useState<ServiceData | null>(null);
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
  // Driver is automatically required for Driver service - no user toggle needed

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

  // Pre-select service type from URL parameters and fetch service data
  useEffect(() => {
    if (serviceFromUrl && !location.state?.resumeDraft) {
      // Service type mapping for URL compatibility
      const serviceMap: { [key: string]: string } = {
        'driver': 'Driver',
        'transportation': 'Driver',
        'accommodation': 'Accommodation',
        'hotel': 'Accommodation',
        'hotels': 'Accommodation',
        'event': 'Events',
        'events': 'Events',
        'entertainment': 'Events',
        'guide': 'Guide'
      };
      
      const mappedService = serviceMap[serviceFromUrl.toLowerCase()] || serviceFromUrl;
      setServiceType(mappedService);
    }
  }, [serviceFromUrl, location.state]);

  // Fetch service data from database when service type changes
  useEffect(() => {
    const loadServiceData = async () => {
      if (!serviceType) {
        setCurrentService(null);
        return;
      }
      
      const service = await getServiceByType(serviceType);
      setCurrentService(service);
    };
    
    loadServiceData();
  }, [serviceType]);

  // Check for existing draft on mount (only if not already resuming)
  useEffect(() => {
    if (user && !location.state?.resumeDraft) {
      checkForExistingDraft();
    }
  }, [user, location.state]);

  // Auto-save functionality - debounced
  useEffect(() => {
    if (user && serviceType) {
      const timer = setTimeout(() => {
        autoSave();
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [serviceType, serviceDetails, userInfo, user]);

  const checkForExistingDraft = async () => {
    try {
      const draft = await getLatestDraft();
      if (draft) {
        setShowResumeDialog(true);
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
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
    // All 4 service types: Driver, Accommodation, Events, Guide
    const requiredFields: { [key: string]: string[] } = {
      'Driver': ['pickupLocation', 'dropoffLocation', 'pickupDate', 'pickupTime', 'vehicleType', 'passengers'],
      'Accommodation': ['location', 'checkIn', 'checkOut', 'guests'],
      'Events': ['eventType', 'location', 'date', 'numberOfPeople'],
      'Guide': ['location', 'date', 'duration', 'numberOfPeople']
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
        title: t('booking.serviceRequired'),
        description: t('booking.pleaseSelectService'),
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
        title: t('booking.contactInfoRequired'),
        description: t('booking.fillAllContactFields'),
        variant: "destructive"
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      toast({
        title: t('booking.invalidEmail'),
        description: t('booking.enterValidEmail'),
        variant: "destructive"
      });
      return false;
    }

    // Validate phone number format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(userInfo.phone.replace(/[\s\-\(\)]/g, ''))) {
      toast({
        title: t('booking.invalidPhone'),
        description: t('booking.enterValidPhone'),
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Calculate price from database service data - NO HARDCODED VALUES
  const calculatePrice = (): number => {
    // Price comes from the database via currentService
    // If no service data or no base_price, return 0 (admin will set price)
    if (!currentService || !currentService.base_price) {
      return 0;
    }
    return currentService.base_price;
  };

  // Get currency from service data
  const getServiceCurrency = (): string => {
    return currentService?.currency || 'USD';
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

  // NEGATIVE TEST: Track submission state for double-submission prevention
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLockRef = React.useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // NEGATIVE TEST 1: Prevent double submission
    if (submissionLockRef.current || isSubmitting) {
      console.warn('Duplicate submission blocked');
      toast({
        title: t('booking.submissionInProgress'),
        description: t('booking.pleaseWait'),
        variant: 'default'
      });
      return;
    }
    
    if (!validateForm()) {
      trackForm('booking', 'abandoned', {
        serviceType,
        serviceDetails,
        userInfo,
        reason: 'validation_failed'
      });
      return;
    }

    // Lock submission immediately
    submissionLockRef.current = true;
    setIsSubmitting(true);
    setIsSaving(true);
    
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        toast({
          title: t('error'),
          description: t('auth.loginRequired'),
          variant: 'destructive'
        });
        return;
      }

      const currency = getServiceCurrency();
      
      // Call create-booking edge function
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          service_type: serviceType,
          service_id: currentService?.id || null,
          service_details: serviceDetails,
          user_info: userInfo,
          currency,
          customer_notes: (serviceDetails as any).specialRequests || null
        }
      });

      if (error) {
        console.error('Create booking error:', error);
        toast({
          title: t('error'),
          description: error.message || t('booking.submitError'),
          variant: 'destructive'
        });
        return;
      }

      // Track form submission
      trackForm('booking', 'submitted', {
        serviceType,
        bookingId: data?.booking?.id,
        hasAllRequiredFields: true
      });

      // Delete draft after successful submission
      if (currentDraftId) {
        try {
          await deleteDraftBooking(currentDraftId);
        } catch (e) {
          console.warn('Failed to delete draft:', e);
        }
      }

      toast({
        title: t('booking.bookingSubmitted'),
        description: t('booking.awaitingAdminReview'),
      });

      // Navigate to confirmation page (not payment - price needs admin approval first)
      navigate('/enhanced-confirmation', {
        state: { 
          bookingData: {
            serviceType,
            serviceDetails,
            userInfo,
            totalPrice: 0, // Will be set by admin
            currency,
            status: 'under_review',
            bookingId: data?.booking?.id
          },
          isNewBooking: true
        }
      });
    } catch (error: any) {
      console.error('Submit booking error:', error);
      toast({
        title: t('error'),
        description: error.message || t('booking.submitError'),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
      // Keep lock active for 3 seconds to prevent rapid re-clicks
      setTimeout(() => {
        submissionLockRef.current = false;
      }, 3000);
    }
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
                {t('booking.bookYourService')}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {isPreSelected 
                  ? t('booking.completeBookingDetails', { serviceType })
                  : t('booking.chooseServiceDetails')
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
                        {t('booking.serviceTypeDetails', { serviceType })}
                      </h2>
                      <ServiceDetailsForm
                        serviceType={serviceType}
                        serviceDetails={serviceDetails}
                        onUpdateDetail={updateServiceDetail}
                        serviceId={currentService?.id || null}
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
                      {t('booking.contactInformation')}
                    </CardTitle>
                    <CardDescription>{t('booking.contactInfoDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {t('booking.fullName')} *
                        </Label>
                        <Input
                          id="fullName"
                          value={userInfo.fullName}
                          onChange={(e) => updateUserInfo('fullName', e.target.value)}
                          placeholder={t('booking.enterFullName')}
                          maxLength={100}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {t('booking.emailAddress')} *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={userInfo.email}
                          onChange={(e) => updateUserInfo('email', e.target.value)}
                          placeholder={t('booking.enterEmail')}
                          maxLength={255}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {t('booking.phoneNumber')} *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={userInfo.phone}
                          onChange={(e) => updateUserInfo('phone', e.target.value)}
                          placeholder={t('booking.enterPhone')}
                          maxLength={20}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t('booking.preferredLanguage')}
                        </Label>
                        <Select value={userInfo.language} onValueChange={(value) => updateUserInfo('language', value)}>
                          <SelectTrigger className="focus:ring-2 focus:ring-primary">
                            <SelectValue placeholder={t('booking.selectLanguage')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="english">{t('common.english')}</SelectItem>
                            <SelectItem value="arabic">{t('common.arabic')}</SelectItem>
                            <SelectItem value="russian">{t('common.russian')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Driver info notice - Driver service always includes a driver */}
                    {serviceType === 'Driver' && (
                      <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
                        <Car className="h-4 w-4 text-primary" />
                        <span>{t('booking.driverIncluded')}</span>
                      </div>
                    )}
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
                    {t('booking.proceedToPayment')}
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