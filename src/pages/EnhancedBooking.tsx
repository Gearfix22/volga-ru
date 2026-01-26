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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, User, Mail, Phone, Globe, Save, Clock, CheckCircle, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MultiServiceSelector } from '@/components/booking/MultiServiceSelector';
import { MultiServiceDetailsForm } from '@/components/booking/MultiServiceDetailsForm';
import { BookingSummaryCard } from '@/components/booking/BookingSummaryCard';
import { BookingFormTracker } from '@/components/booking/BookingFormTracker';
import { useDataTracking } from '@/hooks/useDataTracking';
import { saveDraftBooking, getLatestDraft, deleteDraftBooking, DraftBooking } from '@/services/bookingService';
import { getServiceByType, ServiceData } from '@/services/servicesService';
import { supabase } from '@/integrations/supabase/client';
import type { ServiceDetails, UserInfo } from '@/types/booking';

const EnhancedBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { trackForm } = useDataTracking();
  const [searchParams] = useSearchParams();
  
  // Multi-service selection state
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceDetailsMap, setServiceDetailsMap] = useState<Record<string, ServiceDetails>>({});
  const [serviceDataMap, setServiceDataMap] = useState<Record<string, ServiceData>>({});
  
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '',
    email: '',
    phone: '',
    language: 'english'
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const serviceFromUrl = searchParams.get('service');

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
            email: user.email || prev.email,
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
      // Legacy support: convert single service to multi-service format
      setSelectedServices([resumeDraft.service_type]);
      setServiceDetailsMap({ [resumeDraft.service_type]: resumeDraft.service_details });
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
      if (!selectedServices.includes(mappedService)) {
        setSelectedServices([mappedService]);
      }
    }
  }, [serviceFromUrl, location.state]);

  // Fetch service data when selected services change
  useEffect(() => {
    const loadServiceData = async () => {
      const newDataMap: Record<string, ServiceData> = {};
      
      for (const serviceType of selectedServices) {
        if (!serviceDataMap[serviceType]) {
          const service = await getServiceByType(serviceType);
          if (service) {
            newDataMap[serviceType] = service;
          }
        }
      }
      
      if (Object.keys(newDataMap).length > 0) {
        setServiceDataMap(prev => ({ ...prev, ...newDataMap }));
      }
    };
    
    loadServiceData();
  }, [selectedServices]);

  // Check for existing draft on mount
  useEffect(() => {
    if (user && !location.state?.resumeDraft) {
      checkForExistingDraft();
    }
  }, [user, location.state]);

  // Auto-save functionality
  useEffect(() => {
    if (user && selectedServices.length > 0) {
      const timer = setTimeout(() => {
        autoSave();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [selectedServices, serviceDetailsMap, userInfo, user]);

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
    if (!user || selectedServices.length === 0) return;
    
    setIsSaving(true);
    try {
      // Save first service as primary (legacy compatibility)
      const primaryService = selectedServices[0];
      const progress = determineProgress();
      
      const draft = await saveDraftBooking(
        primaryService,
        serviceDetailsMap[primaryService] || {},
        userInfo,
        progress,
        0
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

  const determineProgress = (): DraftBooking['booking_progress'] => {
    if (selectedServices.length === 0) return 'service_selection';
    
    const hasDetails = selectedServices.some(s => {
      const details = serviceDetailsMap[s];
      return details && Object.keys(details).length > 0;
    });
    if (!hasDetails) return 'details_filled';
    
    const hasUserInfo = userInfo.fullName && userInfo.email && userInfo.phone;
    if (!hasUserInfo) return 'user_info_filled';
    
    return 'ready_for_payment';
  };

  const handleToggleService = (serviceType: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceType)) {
        return prev.filter(s => s !== serviceType);
      } else {
        return [...prev, serviceType];
      }
    });
  };

  const handleUpdateServiceDetail = (serviceType: string, key: string, value: string | string[]) => {
    setServiceDetailsMap(prev => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        [key]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    if (selectedServices.length === 0) {
      toast({
        title: t('booking.serviceRequired'),
        description: t('booking.pleaseSelectService'),
        variant: "destructive"
      });
      return false;
    }

    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      toast({
        title: t('booking.contactInfoRequired'),
        description: t('booking.updateProfileRequired'),
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

    return true;
  };

  const handleManualSave = async () => {
    if (!user || selectedServices.length === 0) return;
    
    setIsSaving(true);
    try {
      const primaryService = selectedServices[0];
      const progress = determineProgress();
      
      await saveDraftBooking(
        primaryService,
        serviceDetailsMap[primaryService] || {},
        userInfo,
        progress,
        0
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

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLockRef = React.useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submissionLockRef.current || isSubmitting) {
      toast({
        title: t('booking.submissionInProgress'),
        description: t('booking.pleaseWait'),
        variant: 'default'
      });
      return;
    }
    
    if (!validateForm()) {
      trackForm('booking', 'abandoned', {
        selectedServices,
        serviceDetailsMap,
        userInfo,
        reason: 'validation_failed'
      });
      return;
    }

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

      // Create a combined booking for multiple services
      const combinedServiceDetails = {
        _multiService: true,
        _selectedServices: selectedServices,
        ...selectedServices.reduce((acc, serviceType) => {
          acc[`_${serviceType.toLowerCase()}_details`] = serviceDetailsMap[serviceType] || {};
          return acc;
        }, {} as Record<string, any>)
      };

      // Use primary service type for the booking record
      const primaryService = selectedServices[0];
      const primaryServiceData = serviceDataMap[primaryService];
      
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          service_type: primaryService,
          service_id: primaryServiceData?.id || null,
          service_details: combinedServiceDetails,
          user_info: userInfo,
          currency: 'USD',
          customer_notes: selectedServices.length > 1 
            ? `Multi-service booking: ${selectedServices.join(', ')}` 
            : null
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

      trackForm('booking', 'submitted', {
        selectedServices,
        bookingId: data?.booking?.id,
        isMultiService: selectedServices.length > 1
      });

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

      navigate('/enhanced-confirmation', {
        state: { 
          bookingData: {
            serviceType: primaryService,
            serviceDetails: combinedServiceDetails,
            userInfo,
            totalPrice: 0,
            currency: 'USD',
            status: 'under_review',
            bookingId: data?.booking?.id,
            _selectedServices: selectedServices,
            _serviceDetailsMap: serviceDetailsMap
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
      setTimeout(() => {
        submissionLockRef.current = false;
      }, 3000);
    }
  };

  const handleResumeBooking = (draft: DraftBooking) => {
    setSelectedServices([draft.service_type]);
    setServiceDetailsMap({ [draft.service_type]: draft.service_details });
    setUserInfo(draft.user_info);
    setCurrentDraftId(draft.id);
  };

  // Build service ID map for forms
  const serviceIdMap = selectedServices.reduce((acc, type) => {
    acc[type] = serviceDataMap[type]?.id || null;
    return acc;
  }, {} as Record<string, string | null>);

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
                  disabled={isSaving || selectedServices.length === 0}
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
            
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t('booking.multiServiceBookingTitle')}
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400">
                {t('booking.multiServiceBookingDesc')}
              </p>
            </div>

            {/* Progress Indicator */}
            {selectedServices.length > 0 && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('booking.autoSaveEnabled')} - {t('booking.progressTracked')}
                </AlertDescription>
              </Alert>
            )}

            <BookingFormTracker
              serviceType={selectedServices[0] || ''}
              serviceDetails={serviceDetailsMap[selectedServices[0]] || {}}
              userInfo={userInfo}
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Multi-Service Selection */}
                <Card className="bg-card/80 backdrop-blur-sm border-border">
                  <CardContent className="pt-6">
                    <MultiServiceSelector
                      selectedServices={selectedServices}
                      onToggleService={handleToggleService}
                    />
                  </CardContent>
                </Card>

                {/* Service Details Forms */}
                {selectedServices.length > 0 && (
                  <MultiServiceDetailsForm
                    selectedServices={selectedServices}
                    serviceDetailsMap={serviceDetailsMap}
                    onUpdateServiceDetail={handleUpdateServiceDetail}
                    serviceIdMap={serviceIdMap}
                  />
                )}

                {/* Booking Summary */}
                {selectedServices.length > 0 && (
                  <BookingSummaryCard
                    selectedServices={selectedServices}
                    serviceDetailsMap={serviceDetailsMap}
                  />
                )}

                {/* User Information - Read-only for authenticated users */}
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t('booking.contactInformation')}
                    </CardTitle>
                    <CardDescription>
                      {user ? t('booking.contactInfoFromProfile') : t('booking.contactInfoDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user && profileLoaded ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t('booking.fullName')}</p>
                              <p className="font-medium text-foreground">{userInfo.fullName || t('common.notProvided')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t('booking.emailAddress')}</p>
                              <p className="font-medium text-foreground">{userInfo.email || user.email || t('common.notProvided')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t('booking.phoneNumber')}</p>
                              <p className="font-medium text-foreground">{userInfo.phone || t('common.notProvided')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t('booking.preferredLanguage')}</p>
                              <p className="font-medium text-foreground capitalize">{userInfo.language || 'english'}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2 border-t">
                          {t('booking.updateProfileHint')}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mr-2" />
                        {t('common.loading')}
                      </div>
                    )}

                    {/* Driver info notice */}
                    {selectedServices.includes('Driver') && (
                      <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
                        <Car className="h-4 w-4 text-primary" />
                        <span>{t('booking.driverIncluded')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    disabled={selectedServices.length === 0 || !userInfo.fullName || !userInfo.email || !userInfo.phone || isSubmitting}
                  >
                    {isSubmitting ? t('common.loading') : t('booking.submitBooking')}
                    {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
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
