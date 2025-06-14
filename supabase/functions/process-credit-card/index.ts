
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreditCardPayment {
  amount: number
  currency?: string
  cardDetails: {
    number: string
    expiry: string
    cvv: string
    name: string
  }
  bookingData?: any
}

async function getPayPalAccessToken() {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
  const paypalUrl = Deno.env.get('PAYPAL_ENVIRONMENT') === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'

  const auth = btoa(`${clientId}:${clientSecret}`)
  
  const response = await fetch(`${paypalUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  return data.access_token
}

async function processCreditCardPayment(paymentData: CreditCardPayment) {
  const accessToken = await getPayPalAccessToken()
  const paypalUrl = Deno.env.get('PAYPAL_ENVIRONMENT') === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'

  // Parse expiry date (MM/YY format)
  const [month, year] = paymentData.cardDetails.expiry.split('/')
  const fullYear = year.length === 2 ? `20${year}` : year

  const paymentRequest = {
    intent: 'sale',
    payer: {
      payment_method: 'credit_card',
      funding_instruments: [{
        credit_card: {
          type: 'visa', // You might want to detect card type
          number: paymentData.cardDetails.number.replace(/\s/g, ''),
          expire_month: month,
          expire_year: fullYear,
          cvv2: paymentData.cardDetails.cvv,
          first_name: paymentData.cardDetails.name.split(' ')[0],
          last_name: paymentData.cardDetails.name.split(' ').slice(1).join(' ') || 'Customer'
        }
      }]
    },
    transactions: [{
      amount: {
        total: paymentData.amount.toFixed(2),
        currency: paymentData.currency || 'USD'
      },
      description: 'Volga Services Payment'
    }]
  }

  const response = await fetch(`${paypalUrl}/v1/payments/payment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentRequest)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Credit card payment failed: ${error}`)
  }

  return await response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const paymentData: CreditCardPayment = await req.json()

    if (!paymentData.amount || paymentData.amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!paymentData.cardDetails || !paymentData.cardDetails.number) {
      return new Response(
        JSON.stringify({ error: 'Card details are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the payment
    const paymentResult = await processCreditCardPayment(paymentData)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Store payment record
    await supabase
      .from('payment_orders')
      .insert({
        order_id: paymentResult.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        status: paymentResult.state,
        transaction_id: paymentResult.id,
        payment_method: 'credit_card',
        booking_data: paymentData.bookingData,
        created_at: new Date().toISOString()
      })

    // Create booking if user is authenticated
    const authHeader = req.headers.get('authorization')
    if (authHeader && paymentData.bookingData && paymentResult.state === 'approved') {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            service_type: paymentData.bookingData.serviceType,
            service_details: paymentData.bookingData.serviceDetails,
            user_info: paymentData.bookingData.userInfo,
            total_price: paymentData.amount,
            payment_method: 'Credit Card',
            transaction_id: paymentResult.id,
            status: 'completed'
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: paymentResult.state === 'approved',
        transactionId: paymentResult.id,
        paymentResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Credit card processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
