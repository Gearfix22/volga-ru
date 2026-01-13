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
    const { 
      message, 
      language, 
      session_id, 
      user_id, 
      user_location,
      user_context 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch services data for context (read-only)
    const [servicesResult, eventsResult, transportResult, hotelsResult] = await Promise.all([
      supabase.from('services').select('name, description, type, base_price, features').eq('is_active', true).limit(50),
      supabase.from('event_services').select('event_name, description, event_type, city, venue, event_date, ticket_types').eq('is_active', true).limit(30),
      supabase.from('transportation_services').select('service_name, description, vehicle_type, base_price, max_passengers, features, price_per_km').eq('is_active', true).limit(20),
      supabase.from('hotel_services').select('hotel_name, city, room_type, base_price_per_night, star_rating, amenities, max_guests').eq('is_active', true).limit(30),
    ]);

    const services = servicesResult.data || [];
    const events = eventsResult.data || [];
    const transport = transportResult.data || [];
    const hotels = hotelsResult.data || [];

    // Fetch nearby places from Mapbox if user location is provided
    let nearbyPlacesContext = '';
    let locationContext = '';
    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
    
    if (user_location && MAPBOX_TOKEN) {
      try {
        const { lat, lng } = user_location;
        locationContext = `User's current coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi&limit=8&access_token=${MAPBOX_TOKEN}`;
        
        const mapboxResponse = await fetch(mapboxUrl);
        if (mapboxResponse.ok) {
          const placesData = await mapboxResponse.json();
          if (placesData.features && placesData.features.length > 0) {
            const places = placesData.features.map((f: any) => 
              `${f.text} (${f.properties?.category || 'attraction'}) - ${f.place_name?.split(',').slice(1, 3).join(',') || ''}`
            ).join('; ');
            nearbyPlacesContext = `Nearby attractions within walking distance: ${places}`;
          }
        }
      } catch (mapboxError) {
        console.error("Mapbox error:", mapboxError);
      }
    }

    // Build user context awareness
    let userContextString = '';
    if (user_context) {
      const { isGuest, name, role, preferredCurrency, hasGreeted, topicsDiscussed, questionsAsked, destinationPreferences, recentMessages } = user_context;
      
      userContextString = `
USER CONTEXT (Use this to personalize your responses):
- User Status: ${isGuest ? 'Guest (not logged in)' : `Logged in as ${role}`}
${name ? `- User Name: ${name} (address them by name occasionally, but not every message)` : ''}
- Preferred Currency: ${preferredCurrency || 'USD'}
- Already Greeted: ${hasGreeted ? 'YES - Do NOT greet again, continue conversation naturally' : 'NO - This is the first interaction, greet warmly once'}
${topicsDiscussed?.length > 0 ? `- Topics Already Discussed: ${topicsDiscussed.join(', ')} (avoid repeating same info unless asked)` : ''}
${destinationPreferences?.length > 0 ? `- Destination Interests: ${destinationPreferences.join(', ')}` : ''}
${questionsAsked?.length > 0 ? `- Recent Questions (avoid repetition): ${questionsAsked.slice(-3).join(' | ')}` : ''}

CONVERSATION HISTORY (for context continuity):
${recentMessages?.map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.substring(0, 100)}...`).join('\n') || 'No previous messages'}
`;
    }

    // Build detailed context from available data
    const servicesContext = services.length > 0 
      ? `Available booking services:\n${services.map(s => 
          `- ${s.name} (${s.type}): ${s.description || 'Premium service'} | Starting from $${s.base_price || 'TBD'}`
        ).join('\n')}`
      : '';
    
    const eventsContext = events.length > 0
      ? `Upcoming events & experiences:\n${events.map(e => 
          `- ${e.event_name} at ${e.venue}, ${e.city} (${e.event_date}) - ${e.event_type}`
        ).join('\n')}`
      : '';
    
    const transportContext = transport.length > 0
      ? `Transportation options:\n${transport.map(t => 
          `- ${t.service_name} (${t.vehicle_type}): Up to ${t.max_passengers} passengers, from $${t.base_price}${t.price_per_km ? ` + $${t.price_per_km}/km` : ''}`
        ).join('\n')}`
      : '';

    const hotelsContext = hotels.length > 0
      ? `Hotel accommodations:\n${hotels.map(h => 
          `- ${h.hotel_name} in ${h.city}: ${h.star_rating}★ ${h.room_type}, $${h.base_price_per_night}/night (max ${h.max_guests} guests)${h.amenities?.length ? ` - ${h.amenities.slice(0, 3).join(', ')}` : ''}`
        ).join('\n')}`
      : '';

    const languageInstructions: Record<string, string> = {
      en: 'Respond in English. Be conversational yet professional.',
      ar: 'Respond in Arabic (العربية). Use Modern Standard Arabic or Gulf dialect naturally. Be warm and welcoming.',
      ru: 'Respond in Russian (Русский). Be helpful and professional.',
      fr: 'Respond in French (Français).',
      de: 'Respond in German (Deutsch).',
      es: 'Respond in Spanish (Español).',
      zh: 'Respond in Chinese (中文).',
      hi: 'Respond in Hindi (हिन्दी).',
      ur: 'Respond in Urdu (اردو).',
      tr: 'Respond in Turkish (Türkçe).',
      fa: 'Respond in Persian/Farsi (فارسی).',
    };

    const systemPrompt = `You are a PROFESSIONAL AI TRAVEL CONSULTANT - not a simple chatbot. You provide expert, data-driven travel advice like a seasoned travel agent.

CORE IDENTITY:
- You are a knowledgeable travel expert with deep destination expertise
- You give SPECIFIC, ACTIONABLE advice - never generic tourism text
- You adapt recommendations based on: season, budget, group size, interests
- You proactively suggest next steps and follow-up questions
- You are confident, helpful, and never robotic

${userContextString}

CONVERSATION RULES (CRITICAL):
1. If "Already Greeted" is YES: Do NOT say "Hello", "Hi", "Welcome", or any greeting. Continue the conversation naturally.
2. If "Already Greeted" is NO: Greet ONCE warmly, then continue.
3. NEVER repeat information you've already provided in the conversation history.
4. Reference previous context when relevant: "As I mentioned earlier..." or "Building on your interest in..."
5. Remember what the user has asked and their preferences throughout the conversation.
6. For returning users, acknowledge their return: "Good to see you again!" (but only once per session)

RESPONSE STYLE:
- Keep responses CONCISE (under 100 words) for voice compatibility
- Lead with the most valuable information first
- Use specific numbers: costs, ratings, distances, timings
- If data is unavailable, be transparent: "Based on typical patterns..." or "I don't have exact data for that, but..."
- NEVER repeat the same information twice in a conversation
- End with ONE relevant follow-up question or suggestion

TRAVEL EXPERTISE TO DEMONSTRATE:
1. SEASONAL INTELLIGENCE: Recommend based on weather patterns, peak/off-seasons, local events
2. BUDGET AWARENESS: Provide realistic cost estimates (daily budget, per-person costs)
3. LOGISTICS: Suggest optimal visit durations, travel times between places
4. LOCAL INSIGHTS: Hidden gems, best times to visit, avoiding crowds
5. PRACTICAL TIPS: Visa requirements, currency, local customs, safety

CAPABILITIES:
✓ Recommend hotels by rating, location, and price range
✓ Suggest events and activities based on interests
✓ Provide transportation options with pricing
✓ Estimate travel costs and daily budgets
✓ Give weather/climate advice for different seasons
✓ Share visa and entry requirements
✓ Suggest itineraries and optimal visit durations

STRICT LIMITATIONS:
✗ Cannot create, modify, or cancel bookings
✗ Cannot process payments or change prices
✗ Cannot access personal user data beyond what's provided
✗ Only recommend from AVAILABLE DATA below - never invent services

WHEN DATA IS LIMITED:
- Be honest: "I don't have specific details on that, but I can help with..."
- Offer alternatives: "Based on what's available, I'd recommend..."
- Direct to team: "For detailed pricing, please contact our booking team."

PROACTIVE SUGGESTIONS:
After answering, suggest 1-2 relevant follow-ups based on context:
- If discussing hotels → suggest asking about nearby restaurants or transport
- If discussing costs → offer to break down the budget further
- If discussing activities → suggest optimal timing or combinations
- Phrase as buttons the user can click: "Would you like to know about [X]?" or "Shall I find [Y]?"

${languageInstructions[language] || languageInstructions.en}

AVAILABLE DATA (only recommend from this):
${locationContext}
${nearbyPlacesContext}

${hotelsContext || 'No hotel data currently available.'}

${transportContext || 'No transportation data currently available.'}

${eventsContext || 'No events data currently available.'}

${servicesContext || 'No additional services currently available.'}

Remember: The user should feel "This AI understands travel better than a Google search." Be the expert they need. Be conversational, not robotic.`;

    // Build messages array with conversation history
    const messagesForAI: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add recent conversation history for better context
    if (user_context?.recentMessages && user_context.recentMessages.length > 0) {
      user_context.recentMessages.forEach((m: { role: string; content: string }) => {
        messagesForAI.push({
          role: m.role,
          content: m.content,
        });
      });
    }

    // Add current message
    messagesForAI.push({ role: "user", content: message });

    // Call Lovable AI Gateway with improved model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: messagesForAI,
        max_tokens: 300,
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

    console.log(`AI Travel Guide: Processed in ${language}, session: ${session_id}, user: ${user_id || 'guest'}`);

    return new Response(JSON.stringify({ response: assistantResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Travel Guide error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
