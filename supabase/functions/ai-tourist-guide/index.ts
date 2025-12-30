import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language, session_id, user_id } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch services data for context (read-only)
    const [servicesResult, eventsResult, transportResult] = await Promise.all([
      supabase.from('services').select('name, description, type, base_price, features').eq('is_active', true).limit(50),
      supabase.from('event_services').select('event_name, description, event_type, city, venue, event_date').eq('is_active', true).limit(30),
      supabase.from('transportation_services').select('service_name, description, vehicle_type, base_price, max_passengers, features').eq('is_active', true).limit(20),
    ]);

    const services = servicesResult.data || [];
    const events = eventsResult.data || [];
    const transport = transportResult.data || [];

    // Build context from available data
    const servicesContext = services.length > 0 
      ? `Available services: ${services.map(s => `${s.name} (${s.type}) - ${s.description || 'No description'}`).join('; ')}`
      : '';
    
    const eventsContext = events.length > 0
      ? `Upcoming events: ${events.map(e => `${e.event_name} at ${e.venue}, ${e.city} on ${e.event_date}`).join('; ')}`
      : '';
    
    const transportContext = transport.length > 0
      ? `Transportation options: ${transport.map(t => `${t.service_name} (${t.vehicle_type}) - up to ${t.max_passengers} passengers, from $${t.base_price}`).join('; ')}`
      : '';

    const languageInstructions: Record<string, string> = {
      en: 'Respond in English.',
      ar: 'Respond in Arabic (العربية). Use Modern Standard Arabic or Saudi dialect when appropriate. Write naturally in Arabic script.',
      ru: 'Respond in Russian (Русский).',
      fr: 'Respond in French (Français).',
      de: 'Respond in German (Deutsch).',
      es: 'Respond in Spanish (Español).',
      zh: 'Respond in Chinese (中文).',
      hi: 'Respond in Hindi (हिन्दी).',
      ur: 'Respond in Urdu (اردو).',
      tr: 'Respond in Turkish (Türkçe).',
      fa: 'Respond in Persian/Farsi (فارسی).',
    };

    const systemPrompt = `You are a friendly AI Tourist Guide assistant. Your role is to help tourists with questions about local services, events, transportation, and provide travel recommendations.

IMPORTANT RULES:
- You can ONLY answer questions related to tourism, travel, local attractions, services, events, and transportation
- You CANNOT create, modify, or cancel any bookings
- You CANNOT change prices or booking status
- You CANNOT access personal user data beyond what's provided
- Keep responses concise (under 150 words) to save tokens
- Be helpful, friendly, and informative
- If asked about something outside your scope, politely explain your limitations

${languageInstructions[language] || languageInstructions.en}

AVAILABLE DATA FOR CONTEXT:
${servicesContext}
${eventsContext}
${transportContext}

If the user asks about booking, direct them to use the booking feature on the website. Do not attempt to make bookings yourself.`;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // Using lite model for low token usage
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 200, // Limit response length
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Log conversation
    await supabase.from('ai_guide_logs').insert({
      user_id: user_id || null,
      session_id,
      language,
      user_message: message,
      assistant_response: assistantResponse,
    });

    console.log(`AI Guide: Processed message in ${language}, session: ${session_id}`);

    return new Response(JSON.stringify({ response: assistantResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Tourist Guide error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
