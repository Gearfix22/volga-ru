
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken()
  const paypalUrl = Deno.env.get('PAYPAL_ENVIRONMENT') === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'

  const response = await fetch(`${paypalUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to capture PayPal order: ${error}`)
  }

  return await response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, bookingData } = await req.json()

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Capture the payment
    const captureResult = await capturePayPalOrder(orderId)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update payment order status
    await supabase
      .from('payment_orders')
      .update({
        status: 'completed',
        transaction_id: captureResult.id,
        captured_at: new Date().toISOString(),
        capture_details: captureResult
      })
      .eq('order_id', orderId)

    // Create booking record if user is authenticated
    const authHeader = req.headers.get('authorization')
    if (authHeader && bookingData) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            service_type: bookingData.serviceType,
            service_details: bookingData.serviceDetails,
            user_info: bookingData.userInfo,
            total_price: parseFloat(captureResult.purchase_units[0].payments.captures[0].amount.value),
            payment_method: 'PayPal',
            transaction_id: captureResult.id,
            status: 'completed'
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionId: captureResult.id,
        captureResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('PayPal capture error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
