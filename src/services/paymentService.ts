
import { supabase } from '@/lib/supabase';

export interface PayPalOrderResponse {
  success: boolean;
  order?: {
    id: string;
    status: string;
    links: Array<{
      href: string;
      rel: string;
      method: string;
    }>;
  };
  error?: string;
}

export interface PaymentCaptureResponse {
  success: boolean;
  transactionId?: string;
  captureResult?: any;
  error?: string;
}

export interface CreditCardPaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentResult?: any;
  error?: string;
}

export const createPayPalOrder = async (amount: number, bookingData?: any): Promise<PayPalOrderResponse> => {
  try {
    console.log('Creating PayPal order with amount:', amount);
    console.log('Booking data:', bookingData);

    const { data, error } = await supabase.functions.invoke('create-paypal-order', {
      body: {
        amount,
        currency: 'USD',
        bookingData
      }
    });

    console.log('Supabase function response:', { data, error });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from edge function');
    }

    return data;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create PayPal order';
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to send a request to the Edge Function')) {
        errorMessage = 'PayPal service is not available. Please ensure the edge function is deployed and PayPal credentials are configured.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error occurred. Please check your internet connection and try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

export const capturePayPalPayment = async (orderId: string, bookingData?: any): Promise<PaymentCaptureResponse> => {
  try {
    console.log('Capturing PayPal payment for order:', orderId);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('capture-paypal-payment', {
      body: {
        orderId,
        bookingData
      },
      headers: session?.access_token ? {
        Authorization: `Bearer ${session.access_token}`
      } : {}
    });

    console.log('Capture response:', { data, error });

    if (error) {
      console.error('Capture error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    
    let errorMessage = 'Failed to capture PayPal payment';
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to send a request to the Edge Function')) {
        errorMessage = 'PayPal capture service is not available. Please contact support.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

export const processCreditCardPayment = async (
  amount: number,
  cardDetails: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  },
  bookingData?: any
): Promise<CreditCardPaymentResponse> => {
  try {
    console.log('Processing credit card payment with amount:', amount);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('process-credit-card', {
      body: {
        amount,
        currency: 'USD',
        cardDetails,
        bookingData
      },
      headers: session?.access_token ? {
        Authorization: `Bearer ${session.access_token}`
      } : {}
    });

    console.log('Credit card response:', { data, error });

    if (error) {
      console.error('Credit card error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error processing credit card payment:', error);
    
    let errorMessage = 'Failed to process credit card payment';
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to send a request to the Edge Function')) {
        errorMessage = 'Credit card processing service is not available. Please try PayPal or contact support.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};
