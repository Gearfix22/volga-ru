
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, ArrowRight, Home } from 'lucide-react';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const status = localStorage.getItem('paymentStatus');
    const txId = localStorage.getItem('transactionId');
    
    if (!status || !txId) {
      navigate('/booking');
      return;
    }
    
    setPaymentStatus(status);
    setTransactionId(txId);
  }, [navigate]);

  const isPaymentCompleted = paymentStatus === 'completed';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
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
                ? 'Thank you for your booking. You will receive a confirmation email shortly.'
                : 'Your payment receipt has been received. We will verify and confirm your booking within 24 hours.'
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
                Your transaction reference and next steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex justify-between items-center mb-4">
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

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">What happens next?</h3>
                <div className="space-y-3">
                  {isPaymentCompleted ? (
                    <>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Confirmation Email Sent</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Check your email for detailed booking information
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Service Coordination</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Our team will contact you within 2 hours to coordinate details
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
                            We are verifying your payment receipt (within 24 hours)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Confirmation Notice</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            You will receive an email confirmation once payment is verified
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Need help?</strong> Contact our support team at{' '}
                  <a href="mailto:support@volgatourism.com" className="underline">
                    support@volgatourism.com
                  </a>{' '}
                  or call +7 (xxx) xxx-xxxx. Please reference your transaction ID.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
                    navigate('/booking');
                  }}
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  New Booking
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

export default BookingConfirmation;
