import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, ArrowRight, Home, DollarSign, MessageCircle, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { sendBookingEmail, redirectToWhatsApp } from '@/utils/postBookingActions';
import { BookingData } from '@/types/booking';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Get data from navigation state first, then localStorage as fallback
    const stateBookingData = location.state?.bookingData;
    const status = localStorage.getItem('paymentStatus');
    const txId = localStorage.getItem('transactionId');
    const amount = localStorage.getItem('paymentAmount');
    const storedBookingData = localStorage.getItem('bookingData');
    
    if (!status || !txId) {
      navigate('/booking');
      return;
    }
    
    setPaymentStatus(status);
    setTransactionId(txId);
    setPaymentAmount(amount || '0');
    
    // Use state data if available, otherwise fall back to localStorage
    const dataToUse = stateBookingData || (storedBookingData ? JSON.parse(storedBookingData) : null);
    
    if (dataToUse) {
      setBookingData(dataToUse);
      
      // Send booking email if payment is completed and email hasn't been sent yet
      if (status === 'completed' && !emailSent) {
        sendBookingEmail(dataToUse, txId, amount || '0')
          .then(() => {
            setEmailSent(true);
            console.log('Booking email sent successfully');
          })
          .catch((error) => {
            console.error('Error sending booking email:', error);
          });
      }
    }
  }, [navigate, location.state, emailSent]);

  const isPaymentCompleted = paymentStatus === 'completed';

  const handleWhatsAppContact = () => {
    if (bookingData) {
      redirectToWhatsApp(bookingData, transactionId);
    }
  };

  const gotoDashboard = () => {
    navigate('/dashboard');
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
            <div className="flex justify-center mb-4">
              {isPaymentCompleted ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <Clock className="h-16 w-16 text-yellow-500" />
              )}
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {isPaymentCompleted ? t('bookingConfirmed') : t('paymentPendingVerification')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {isPaymentCompleted 
                ? t('thankYouBooking')
                : t('paymentReceiptReceived')
              }
            </p>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('bookingDetails')}
              </CardTitle>
              <CardDescription>
                {t('transactionReference')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t('transactionId')}:</span>
                    <span className="font-mono text-sm bg-white dark:bg-slate-700 px-3 py-1 rounded">
                      {transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t('status')}:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isPaymentCompleted 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {isPaymentCompleted ? t('confirmed') : t('pendingVerification')}
                    </span>
                  </div>
                </div>
                
                {paymentAmount && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {t('paymentAmount')}:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        ${paymentAmount} USD
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Notification Status */}
              {isPaymentCompleted && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {t('bookingDetailsSentTitle')}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {t('bookingDetailsSentDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('whatHappensNext')}</h3>
                <div className="space-y-3">
                  {isPaymentCompleted ? (
                    <>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('bookingDetailsForwarded')}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('bookingDetailsForwardedDesc')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('serviceCoordination')}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('teamContact')}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('paymentVerification')}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('verifyingPayment')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('confirmationNotice')}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('emailConfirmation')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{t('needHelp')}</strong> {t('contactSupport')}{' '}
                  <a href="mailto:info@volgaservices.com" className="underline">
                    info@volgaservices.com
                  </a>{' '}
                  or call +7 (xxx) xxx-xxxx. {t('referenceTransaction')}
                </p>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                {isPaymentCompleted && (
                  <Button 
                    onClick={handleWhatsAppContact}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t('continueOnWhatsApp')}
                  </Button>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={gotoDashboard}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    {t('goToDashboard')}
                  </Button>
                  <Button 
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    {t('returnToHome')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem('bookingData');
                      localStorage.removeItem('paymentStatus');
                      localStorage.removeItem('transactionId');
                      localStorage.removeItem('paymentAmount');
                      navigate('/booking');
                    }}
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t('newBooking')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingConfirmation;
