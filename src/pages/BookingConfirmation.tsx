import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, ArrowRight, Home, DollarSign, MessageCircle, Mail } from 'lucide-react';
import { sendBookingEmail, redirectToWhatsApp } from '@/utils/postBookingActions';
import { BookingData } from '@/types/booking';
import { useLanguage } from '@/contexts/LanguageContext';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL } = useLanguage();
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
    <div className={`relative min-h-screen overflow-hidden ${isRTL ? 'rtl' : ''}`}>
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
              {isPaymentCompleted ? t('confirmation.bookingConfirmed') : t('confirmation.paymentPendingVerification')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {isPaymentCompleted 
                ? t('confirmation.thankYouForBooking')
                : t('confirmation.paymentReceiptReceived')
              }
            </p>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText className="h-5 w-5" />
                {t('confirmation.bookingDetails')}
              </CardTitle>
              <CardDescription>
                {t('confirmation.transactionId')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="font-semibold">{t('confirmation.transactionId')}:</span>
                    <span className="font-mono text-sm bg-white dark:bg-slate-700 px-3 py-1 rounded">
                      {transactionId}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="font-semibold">{t('status.pending')}:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isPaymentCompleted 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {isPaymentCompleted ? t('confirmation.confirmed') : t('confirmation.pendingVerification')}
                    </span>
                  </div>
                </div>
                
                {paymentAmount && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`font-semibold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <DollarSign className="h-4 w-4" />
                        {t('confirmation.paymentAmount')}:
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
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Mail className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {t('messages.bookingDetailsSentTitle')}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {t('confirmation.emailConfirmation')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('confirmation.nextSteps')}</h3>
                <div className="space-y-3">
                  {isPaymentCompleted ? (
                    <>
                      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('messages.bookingDetailsForwarded')}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('messages.bookingDetailsForwardedDesc')}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <ArrowRight className={`h-5 w-5 text-blue-500 mt-0.5 ${isRTL ? 'rotate-180' : ''}`} />
                        <div>
                          <p className="font-medium">{t('confirmation.contactUs')}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('confirmation.emailConfirmation')}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('confirmation.pendingVerification')}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('confirmation.paymentReceiptReceived')}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <ArrowRight className={`h-5 w-5 text-blue-500 mt-0.5 ${isRTL ? 'rotate-180' : ''}`} />
                        <div>
                          <p className="font-medium">{t('confirmation.confirmationNotice')}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('confirmation.emailConfirmation')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{t('confirmation.contactUs')}</strong> info@volgaservices.com | +7 (952) 221-29-03
                </p>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                {isPaymentCompleted && (
                  <Button 
                    onClick={handleWhatsAppContact}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('messages.continueOnWhatsApp')}
                  </Button>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={gotoDashboard}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('confirmation.goToDashboard')}
                  </Button>
                  <Button 
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    <Home className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('staffLogin.backToHome')}
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
                    <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('confirmation.bookNewService')}
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