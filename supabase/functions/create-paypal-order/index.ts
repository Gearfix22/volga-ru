
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayPalOrderRequest {
  amount: number
  currency?: string
  bookingData?: any
}

async function getPayPalAccessToken() {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
  const paypalUrl = Deno.env.get('PAYPAL_ENVIRONMENT') === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  const auth = btoa(`${clientId}:${clientSecret}`)
  
  const response = await fetch(`${paypalUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return data.access_token
}

async function createPayPalOrder(amount: number, currency: string = 'USD') {
  const accessToken = await getPayPalAccessToken()
  const paypalUrl = Deno.env.get('PAYPAL_ENVIRONMENT') === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'

  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount.toFixed(2)
      }
    }],
    application_context: {
      return_url: `${Deno.env.get('SITE_URL')}/booking-confirmation`,
      cancel_url: `${Deno.env.get('SITE_URL')}/payment`,
      brand_name: 'Volga Services',
      user_action: 'PAY_NOW'
    }
  }

  const response = await fetch(`${paypalUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create PayPal order: ${error}`)
  }

  return await response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, bookingData }: PayPalOrderRequest = await req.json()

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const order = await createPayPalOrder(amount, currency)

    // Store order details in Supabase for tracking
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        amount: amount,
        currency: currency || 'USD',
        status: 'created',
        booking_data: bookingData,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('PayPal order creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
