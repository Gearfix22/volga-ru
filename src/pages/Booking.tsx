import React, { useState, useEffect, useCallback } from 'react';
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
import { ArrowRight, User, Mail, Phone, Globe, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServiceTypeSelector } from '@/components/booking/ServiceTypeSelector';
import { ServiceDetailsForm } from '@/components/booking/ServiceDetailsForm';
import { PricingDisplay } from '@/components/booking/PricingDisplay';
import { BookingFormTracker } from '@/components/booking/BookingFormTracker';
import { useDataTracking } from '@/hooks/useDataTracking';
import { saveDraftBooking, getDraftBooking } from '@/services/bookingService';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ServiceDetails, UserInfo } from '@/types/booking';

const Booking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { trackForm } = useDataTracking();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [serviceType, setServiceType] = useState('');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>({});
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '',
    email: '',
    phone: '',
    language: 'english'
  });
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const serviceFromUrl = searchParams.get('service');
  const draftIdFromUrl = searchParams.get('draft');
  const isPreSelected = !!serviceFromUrl;

  // Load draft booking if draft ID is provided or check for existing drafts
  useEffect(() => {
    const loadDraft = async () => {
      if (user && draftIdFromUrl) {
        try {
          const draft = await getDraftBooking(draftIdFromUrl);
          if (draft) {
            setServiceType(draft.service_type);
            setServiceDetails(draft.service_details || {});
            setUserInfo(draft.user_info || { fullName: '', email: '', phone: '', language: 'english' });
            setDraftId(draft.id);
            setLastSaved(new Date(draft.updated_at));
            toast({
              title: t('draftLoaded'),
              description: t('continueWhereYouLeftOff'),
            });
          }
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    };
    loadDraft();
  }, [user, draftIdFromUrl, t, toast]);

  // Pre-select service type from URL parameters
  useEffect(() => {
    if (serviceFromUrl && !draftIdFromUrl) {
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
  }, [serviceFromUrl, draftIdFromUrl]);

  // Auto-save draft to database
  const saveCurrentDraft = useCallback(async () => {
    if (!user || !serviceType) return;
    
    setIsSavingDraft(true);
    try {
      const savedDraft = await saveDraftBooking(
        serviceType,
        serviceDetails,
        userInfo,
        'in_progress',
        calculatePrice()
      );
      
      if (savedDraft) {
        setDraftId(savedDraft.id);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  }, [user, serviceType, serviceDetails, userInfo]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!user || !serviceType) return;
    
    const autoSaveInterval = setInterval(() => {
      saveCurrentDraft();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [user, serviceType, saveCurrentDraft]);

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

  const validateForm = () => {
    if (!serviceType) {
      toast({
        title: t('serviceRequired'),
        description: t('pleaseSelectService'),
        variant: "destructive"
      });
      return false;
    }

    // Validate required service details
    const details = serviceDetails as any;
    const requiredFields: { [key: string]: string[] } = {
      'Transportation': ['pickup', 'dropoff', 'date', 'time', 'vehicleType'],
      'Hotels': ['city', 'checkin', 'checkout', 'roomType'],
      'Events': ['eventName', 'eventLocation', 'eventDate', 'tickets'],
      'Custom Trips': ['duration', 'regions']
    };

    const missing = requiredFields[serviceType]?.filter(field => !details[field]) || [];
    
    if (missing.length > 0) {
        toast({
          title: t('missingRequiredInfo'),
          description: `${t('pleaseFillIn')}: ${missing.join(', ')}`,
          variant: "destructive"
        });
      return false;
    }

    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      toast({
        title: t('contactInfoRequired'),
        description: t('fillRequiredFields'),
        variant: "destructive"
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
        toast({
          title: t('invalidEmail'),
          description: t('pleaseEnterValidEmail'),
          variant: "destructive"
        });
      return false;
    }

    // Validate phone format (Russian format)
    const phoneRegex = /^[\+]?[7,8]?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    if (!phoneRegex.test(userInfo.phone.replace(/[\s\-\(\)]/g, ''))) {
      toast({
        title: t('invalidPhone'),
        description: t('phoneFormatHint'),
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

  const handleSubmit = (e: React.FormEvent) => {
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

    const totalPrice = calculatePrice();
    const bookingData = {
      serviceType,
      serviceDetails,
      userInfo,
      totalPrice
    };

    // Track form submission
    trackForm('booking', 'submitted', {
      serviceType,
      totalPrice,
      hasAllRequiredFields: true
    });

    // Save to localStorage as backup
    localStorage.setItem('bookingData', JSON.stringify(bookingData));

    toast({
      title: t('bookingDetailsSaved'),
      description: t('proceedingToPayment'),
    });

    navigate('/payment', {
      state: { bookingData }
    });
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
              {isPreSelected 
                ? t('completeBookingDetails', { serviceType })
                : t('chooseServiceDetails')
              }
            </p>
            
            {/* Draft auto-save status */}
            {user && lastSaved && (
              <Alert className="mt-4 bg-primary/5 border-primary/20">
                <Save className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm text-slate-700 dark:text-slate-300">
                  {t('draftAutoSaved')} {new Date(lastSaved).toLocaleTimeString()}
                  {isSavingDraft && ` - ${t('saving')}...`}
                </AlertDescription>
              </Alert>
            )}
            
            {!user && (
              <Alert className="mt-4 bg-accent/5 border-accent/20">
                <AlertCircle className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm text-slate-700 dark:text-slate-300">
                  {t('loginToSaveDraft')}
                </AlertDescription>
              </Alert>
            )}
          </div>

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
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user && serviceType && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={saveCurrentDraft}
                          disabled={isSavingDraft}
                          className="px-6"
                        >
                          <Save className="mr-2 h-5 w-5" />
                          {isSavingDraft ? t('saving') : t('saveDraft')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('saveDraftTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
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
    </div>
  );
};

export default Booking;
