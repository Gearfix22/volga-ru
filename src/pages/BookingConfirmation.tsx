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

const BookingConfirmation = () => {
  const navigate = useNavigate();
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
              {isPaymentCompleted ? 'Booking Confirmed!' : 'Payment Pending Verification'}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {isPaymentCompleted 
                ? 'Thank you for your booking!'
                : 'Your payment receipt has been received.'
              }
            </p>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Booking Details
              </CardTitle>
              <CardDescription>
                Your transaction reference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Transaction ID:</span>
                    <span className="font-mono text-sm bg-white dark:bg-slate-700 px-3 py-1 rounded">
                      {transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isPaymentCompleted 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {isPaymentCompleted ? 'Confirmed' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
                
                {paymentAmount && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payment Amount:
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
                        Booking Details Sent
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        A confirmation email has been sent with your booking details.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">What Happens Next?</h3>
                <div className="space-y-3">
                  {isPaymentCompleted ? (
                    <>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Booking Details Forwarded</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Your booking has been forwarded to our team.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Service Coordination</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Our team will contact you within 24 hours to finalize arrangements.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Payment Verification</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            We are verifying your payment receipt.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Confirmation Notice</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            You will receive an email once your payment is confirmed.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Need Help?</strong> Contact our support team at{' '}
                  <a href="mailto:info@volgaservices.com" className="underline">
                    info@volgaservices.com
                  </a>{' '}
                  or call +7 (952) 221-29-03. Please reference your transaction ID.
                </p>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                {isPaymentCompleted && (
                  <Button 
                    onClick={handleWhatsAppContact}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Continue on WhatsApp
                  </Button>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={gotoDashboard}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>
                  <Button 
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Return to Home
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
                    New Booking
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