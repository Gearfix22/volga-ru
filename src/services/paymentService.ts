
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
    const { data, error } = await supabase.functions.invoke('create-paypal-order', {
      body: {
        amount,
        currency: 'USD',
        bookingData
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create PayPal order'
    };
  }
};

export const capturePayPalPayment = async (orderId: string, bookingData?: any): Promise<PaymentCaptureResponse> => {
  try {
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

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture PayPal payment'
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

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error processing credit card payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process credit card payment'
    };
  }
};
