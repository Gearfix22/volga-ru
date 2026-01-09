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
    const { message, language, session_id, user_id, user_location } = await req.json();
    
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

    // Fetch nearby places from Mapbox if user location is provided
    let nearbyPlacesContext = '';
    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
    
    if (user_location && MAPBOX_TOKEN) {
      try {
        const { lat, lng } = user_location;
        const categories = 'tourist_attraction,museum,historic,park,entertainment';
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi&limit=5&access_token=${MAPBOX_TOKEN}`;
        
        const mapboxResponse = await fetch(mapboxUrl);
        if (mapboxResponse.ok) {
          const placesData = await mapboxResponse.json();
          if (placesData.features && placesData.features.length > 0) {
            const places = placesData.features.map((f: any) => 
              `${f.text} (${f.properties?.category || 'attraction'})`
            ).join(', ');
            nearbyPlacesContext = `Nearby attractions: ${places}`;
          }
        }
      } catch (mapboxError) {
        console.error("Mapbox error:", mapboxError);
      }
    }

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

const systemPrompt = `You are a professional, friendly AI Tourist Guide assistant. You act as a knowledgeable local guide helping tourists discover the best of the area.

PERSONALITY:
- Be warm, welcoming, and enthusiastic about local culture
- Give practical, realistic advice based on actual data
- Keep responses SHORT and helpful (under 120 words for voice compatibility)
- Use a conversational, friendly tone

CAPABILITIES:
- Answer questions about local attractions, landmarks, and hidden gems
- Recommend events, activities, and experiences
- Provide transportation guidance and travel tips
- Suggest routes and estimate travel times when location is available
- Share cultural insights and local customs

STRICT RULES:
- You can ONLY provide information and recommendations
- You CANNOT create, modify, or cancel any bookings
- You CANNOT change prices or booking status
- You CANNOT access personal user data
- If asked about something you're unsure of, say: "Please contact our team for confirmation."
- NEVER make up services, events, or prices - only use data from AVAILABLE DATA section
- If no matching service/event exists in AVAILABLE DATA, say: "I don't have information about that specific service. Please check our website or contact our team."

CLARIFICATION BEHAVIOR:
- If a user's request is unclear, ask ONE clarifying question before recommending
- Examples of clarifying questions:
  - "What date are you looking to travel?"
  - "How many people will be in your group?"
  - "Which city or area are you interested in?"
- Do NOT ask multiple questions at once - keep it simple

BOOKING GUIDANCE:
- When recommending services, mention the service name and estimated price if available
- Always direct users to the booking page: "You can book this through our website's booking section."
- NEVER attempt to create, confirm, or process any booking yourself
- Respect that final pricing is set by admin after review

${languageInstructions[language] || languageInstructions.en}

AVAILABLE DATA (only recommend from this list):
${servicesContext || 'No services currently available.'}
${eventsContext || 'No upcoming events currently available.'}
${transportContext || 'No transportation options currently available.'}
${nearbyPlacesContext || ''}

If no data is available for what the user asks, say: "I don't have current information about that. Please visit our website or contact our team directly."`;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 180,
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
