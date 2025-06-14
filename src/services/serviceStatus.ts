
import { supabase } from '@/lib/supabase';

export const checkPaymentServiceStatus = async () => {
  console.log('Checking payment service status...');
  
  try {
    // Try to call a simple edge function to test connectivity
    const { data, error } = await supabase.functions.invoke('create-paypal-order', {
      body: { test: true, amount: 1 }
    });

    console.log('Service status check result:', { data, error });

    if (error) {
      if (error.message.includes('Failed to send a request to the Edge Function')) {
        return {
          status: 'error',
          message: 'Edge functions are not deployed or not accessible'
        };
      }
      return {
        status: 'error',
        message: error.message
      };
    }

    return {
      status: 'ok',
      message: 'Payment services are operational'
    };
  } catch (error) {
    console.error('Service status check failed:', error);
    return {
      status: 'error',
      message: 'Unable to connect to payment services'
    };
  }
};
