import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Car, 
  Building2, 
  Ticket, 
  DollarSign,
  MessageCircle,
  Phone,
  Mail,
  Download,
  Share,
  Home,
  User
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { BookingData } from '@/types/booking';

const EnhancedConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  
  const bookingData = location.state?.bookingData as BookingData & {
    paymentMethod?: string;
    transactionId?: string;
    paidAmount?: number;
    status?: string;
    receiptUrl?: string;
  };

  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (!bookingData) {
      navigate('/');
      return;
    }

    // Send booking confirmation email
    sendBookingEmail();

    // Show WhatsApp button after 2 seconds for better UX
    setTimeout(() => {
      setShowWhatsAppButton(true);
    }, 2000);
  }, [bookingData, navigate]);

  const sendBookingEmail = async () => {
    if (!bookingData || emailSent) return;
    
    try {
      const { error } = await supabase.functions.invoke('send-booking-email', {
        body: {
          userInfo: bookingData.userInfo,
          serviceType: bookingData.serviceType,
          serviceDetails: bookingData.serviceDetails,
          transactionId: bookingData.transactionId,
          totalPrice: bookingData.totalPrice,
          paymentMethod: bookingData.paymentMethod,
          status: bookingData.status || 'confirmed'
        }
      });

      if (error) {
        console.error('Error sending booking email:', error);
      } else {
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Error sending booking email:', error);
    }
  };

  if (!bookingData) {
    return null;
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending_verification':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending_verification':
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPaymentStatusMessage = () => {
    switch (bookingData.paymentMethod) {
      case 'Cash on Arrival':
        return t('cashPaymentConfirmed');
      case 'Credit Card':
        return t('cardPaymentSuccessful');
      case 'Bank Transfer':
        return t('bankTransferReceived');
      default:
        return t('bookingConfirmed');
    }
  };

  const renderServiceDetails = () => {
    const details = bookingData.serviceDetails as any;
    
    switch (bookingData.serviceType) {
      case 'Transportation':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('pickup')}:</span>
              <span className="text-sm">{details.pickup}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('dropoff')}:</span>
              <span className="text-sm">{details.dropoff}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('date')}:</span>
              <span className="text-sm">{details.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('time')}:</span>
              <span className="text-sm">{details.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('vehicle')}:</span>
              <span className="text-sm">{details.vehicleType}</span>
            </div>
            {details.passengers && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('passengers')}:</span>
                <span className="text-sm">{details.passengers}</span>
              </div>
            )}
          </div>
        );
      
      case 'Hotels':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('hotel')}:</span>
              <span className="text-sm">{details.hotel}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('city')}:</span>
              <span className="text-sm">{details.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('checkin')}:</span>
              <span className="text-sm">{details.checkin}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('checkout')}:</span>
              <span className="text-sm">{details.checkout}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('roomType')}:</span>
              <span className="text-sm">{details.roomType}</span>
            </div>
          </div>
        );
      
      case 'Events':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('event')}:</span>
              <span className="text-sm">{details.eventName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('location')}:</span>
              <span className="text-sm">{details.eventLocation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('date')}:</span>
              <span className="text-sm">{details.eventDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('tickets')}:</span>
              <span className="text-sm">{details.tickets}</span>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-muted-foreground">
            {t('serviceDetailsNotAvailable')}
          </div>
        );
    }
  };

  const generateWhatsAppMessage = () => {
    const message = `🎉 ${t('bookingConfirmed')}!\n\n` +
      `📋 ${t('bookingDetails')}:\n` +
      `• ${t('service')}: ${bookingData.serviceType}\n` +
      `• ${t('customer')}: ${bookingData.userInfo.fullName}\n` +
      `• ${t('email')}: ${bookingData.userInfo.email}\n` +
      `• ${t('phone')}: ${bookingData.userInfo.phone}\n` +
      `• ${t('paymentMethod')}: ${bookingData.paymentMethod}\n` +
      `• ${t('totalAmount')}: $${bookingData.totalPrice?.toFixed(2)}\n` +
      `• ${t('transactionId')}: ${bookingData.transactionId}\n\n` +
      `📞 ${t('contactUsForDetails')}`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = '+201030905969'; // Your WhatsApp business number
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDownloadReceipt = () => {
    // Here you would generate and download a PDF receipt
    toast({
      title: t('featureComingSoon'),
      description: t('pdfReceiptComingSoon'),
    });
  };

  const handleShareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: t('bookingConfirmation'),
        text: `${t('bookingConfirmed')} - ${bookingData.serviceType}`,
        url: window.location.href,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('linkCopied'),
        description: t('bookingLinkCopied'),
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('bookingConfirmed')}!
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {getPaymentStatusMessage()}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Booking Details */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('bookingDetails')}</span>
                  <Badge className={getStatusColor(bookingData.status)}>
                    {getStatusIcon(bookingData.status)}
                    <span className="ml-1">{bookingData.status || 'confirmed'}</span>
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {t('transactionId')}: {bookingData.transactionId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">{t('serviceInformation')}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{bookingData.serviceType}</Badge>
                  </div>
                  {renderServiceDetails()}
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{t('customerInformation')}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{bookingData.userInfo.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{bookingData.userInfo.email}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                        <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          {bookingData.userInfo.phone}
                        </span>
                        <Badge variant="outline" className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/40">
                          {t('adminOnly')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t('paymentInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('paymentMethod')}:</span>
                  <Badge variant="outline">{bookingData.paymentMethod}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('totalAmount')}:</span>
                  <span className="text-lg font-bold text-primary">
                    ${bookingData.totalPrice?.toFixed(2)}
                  </span>
                </div>

                {bookingData.paidAmount !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{t('amountPaid')}:</span>
                    <span className="text-lg font-semibold text-green-600">
                      ${bookingData.paidAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {bookingData.paymentMethod === 'Cash on Arrival' && (
                  <Alert>
                    <MessageCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('cashPaymentReminder')}
                    </AlertDescription>
                  </Alert>
                )}

                {bookingData.paymentMethod === 'Bank Transfer' && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      {t('bankTransferVerificationPending')}
                    </AlertDescription>
                  </Alert>
                )}

                {emailSent && (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      {t('confirmationEmailSent')}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4 border-t space-y-3">
                  <Button 
                    onClick={handleDownloadReceipt}
                    variant="outline" 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('downloadReceipt')}
                  </Button>
                  
                  <Button 
                    onClick={handleShareBooking}
                    variant="outline" 
                    className="w-full"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    {t('shareBooking')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {showWhatsAppButton && (
              <Button 
                onClick={handleWhatsAppContact}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                {t('contactUsWhatsApp')}
              </Button>
            )}
            
            <Button 
              onClick={() => navigate('/enhanced-dashboard')}
              variant="outline"
              size="lg"
            >
              {t('viewMyBookings')}
            </Button>
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
            >
              <Home className="h-5 w-5 mr-2" />
              {t('backToHome')}
            </Button>
          </div>

          {/* Next Steps */}
          <Card className="mt-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle>{t('nextSteps')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  {t('confirmationEmailSent')}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  {t('representativeWillContact')}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  {t('trackBookingInDashboard')}
                </li>
                {bookingData.paymentMethod === 'Cash on Arrival' && (
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    {t('prepareExactCashAmount')}
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EnhancedConfirmation;