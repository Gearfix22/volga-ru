import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIGuideMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: string[];
}

export interface AIGuideContext {
  hasGreeted: boolean;
  questionsAsked: string[];
  topicsDiscussed: string[];
  destinationPreferences: string[];
  lastInteraction: number | null;
}

interface AIGuideSessionState {
  sessionId: string;
  messages: AIGuideMessage[];
  context: AIGuideContext;
}

interface UserProfile {
  full_name: string | null;
  preferred_language: string | null;
  preferred_currency: string | null;
}

const STORAGE_KEY = 'volga_ai_guide_session';
const SESSION_EXPIRY_HOURS = 24;

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getDefaultContext = (): AIGuideContext => ({
  hasGreeted: false,
  questionsAsked: [],
  topicsDiscussed: [],
  destinationPreferences: [],
  lastInteraction: null,
});

const getDefaultState = (): AIGuideSessionState => ({
  sessionId: generateSessionId(),
  messages: [],
  context: getDefaultContext(),
});

export const useAIGuideSession = () => {
  const { user, userRoles } = useAuth();
  const [sessionState, setSessionState] = useState<AIGuideSessionState>(getDefaultState);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load session from localStorage and merge with DB if user is logged in
  useEffect(() => {
    const loadSession = async () => {
      // First, try to load from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      let localState: AIGuideSessionState = getDefaultState();
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const lastInteraction = parsed.context?.lastInteraction;
          const hoursSinceLastInteraction = lastInteraction 
            ? (Date.now() - lastInteraction) / (1000 * 60 * 60)
            : SESSION_EXPIRY_HOURS + 1;
          
          // If session is still valid (less than 24 hours old)
          if (hoursSinceLastInteraction < SESSION_EXPIRY_HOURS) {
            localState = parsed;
          }
        } catch (e) {
          console.error('Failed to parse AI guide session:', e);
        }
      }

      // If user is logged in, fetch their profile and previous session
      if (user?.id) {
        try {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, preferred_language, preferred_currency')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setUserProfile(profile);
          }

          // Check for existing session in DB
          const { data: existingSession } = await supabase
            .from('ai_guide_sessions')
            .select('id, context')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (existingSession?.context) {
            const dbContext = existingSession.context as unknown as AIGuideContext;
            // Merge DB context with local state
            localState = {
              ...localState,
              sessionId: existingSession.id,
              context: {
                ...localState.context,
                hasGreeted: dbContext.hasGreeted ?? localState.context.hasGreeted,
                questionsAsked: [...new Set([...(dbContext.questionsAsked || []), ...localState.context.questionsAsked])],
                topicsDiscussed: [...new Set([...(dbContext.topicsDiscussed || []), ...localState.context.topicsDiscussed])],
                destinationPreferences: [...new Set([...(dbContext.destinationPreferences || []), ...localState.context.destinationPreferences])],
              },
            };
          }

          // Fetch recent conversation history for this user
          const { data: recentLogs } = await supabase
            .from('ai_guide_logs')
            .select('user_message, assistant_response, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (recentLogs && recentLogs.length > 0 && localState.messages.length === 0) {
            // Reconstruct messages from logs (reversed to get chronological order)
            const historicalMessages: AIGuideMessage[] = [];
            recentLogs.reverse().forEach(log => {
              historicalMessages.push({
                role: 'user',
                content: log.user_message,
                timestamp: new Date(log.created_at).getTime(),
              });
              historicalMessages.push({
                role: 'assistant',
                content: log.assistant_response,
                timestamp: new Date(log.created_at).getTime(),
              });
            });
            localState.messages = historicalMessages;
          }
        } catch (e) {
          console.error('Failed to load user AI session:', e);
        }
      }

      setSessionState(localState);
      setIsInitialized(true);
    };

    loadSession();
  }, [user?.id]);

  // Persist session to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionState));
    }
  }, [sessionState, isInitialized]);

  // Save session context to DB for logged-in users
  const persistToDatabase = useCallback(async (state: AIGuideSessionState) => {
    if (!user?.id) return;

    try {
      // Check if session exists first
      const { data: existing } = await supabase
        .from('ai_guide_sessions')
        .select('id')
        .eq('id', state.sessionId)
        .maybeSingle();

      const contextData = JSON.parse(JSON.stringify(state.context));

      if (existing) {
        await supabase
          .from('ai_guide_sessions')
          .update({
            context: contextData,
          })
          .eq('id', state.sessionId);
      } else {
        await supabase
          .from('ai_guide_sessions')
          .insert([{
            id: state.sessionId,
            user_id: user.id,
            context: contextData,
          }]);
      }
    } catch (e) {
      console.error('Failed to persist AI session:', e);
    }
  }, [user?.id]);

  const addMessage = useCallback((message: AIGuideMessage) => {
    setSessionState(prev => {
      const newState = {
        ...prev,
        messages: [...prev.messages, message],
        context: {
          ...prev.context,
          lastInteraction: Date.now(),
        },
      };
      
      // Track question topics
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        const topics: string[] = [];
        
        if (content.includes('hotel') || content.includes('فندق') || content.includes('отель')) topics.push('hotels');
        if (content.includes('weather') || content.includes('طقس') || content.includes('погода')) topics.push('weather');
        if (content.includes('visa') || content.includes('تأشيرة') || content.includes('виза')) topics.push('visa');
        if (content.includes('cost') || content.includes('price') || content.includes('budget') || content.includes('تكلفة') || content.includes('стоимость')) topics.push('budget');
        if (content.includes('transport') || content.includes('النقل') || content.includes('транспорт')) topics.push('transport');
        if (content.includes('event') || content.includes('فعالية') || content.includes('мероприятие')) topics.push('events');
        
        if (topics.length > 0) {
          newState.context.topicsDiscussed = [...new Set([...prev.context.topicsDiscussed, ...topics])];
        }
        
        newState.context.questionsAsked = [...prev.context.questionsAsked, message.content].slice(-20);
      }
      
      return newState;
    });
  }, []);

  const markGreeted = useCallback(() => {
    setSessionState(prev => {
      const newState = {
        ...prev,
        context: {
          ...prev.context,
          hasGreeted: true,
          lastInteraction: Date.now(),
        },
      };
      persistToDatabase(newState);
      return newState;
    });
  }, [persistToDatabase]);

  const addDestinationPreference = useCallback((destination: string) => {
    setSessionState(prev => ({
      ...prev,
      context: {
        ...prev.context,
        destinationPreferences: [...new Set([...prev.context.destinationPreferences, destination])].slice(-10),
      },
    }));
  }, []);

  const clearSession = useCallback(() => {
    const newState = getDefaultState();
    setSessionState(newState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getUserContextForAI = useCallback(() => {
    const isGuest = !user;
    const role = userRoles?.[0] || 'guest';
    
    return {
      isGuest,
      userId: user?.id || null,
      role,
      name: userProfile?.full_name || null,
      preferredLanguage: userProfile?.preferred_language || null,
      preferredCurrency: userProfile?.preferred_currency || 'USD',
      hasGreeted: sessionState.context.hasGreeted,
      topicsDiscussed: sessionState.context.topicsDiscussed,
      questionsAsked: sessionState.context.questionsAsked.slice(-5),
      destinationPreferences: sessionState.context.destinationPreferences,
      conversationLength: sessionState.messages.length,
      recentMessages: sessionState.messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      })),
    };
  }, [user, userRoles, userProfile, sessionState]);

  return {
    sessionId: sessionState.sessionId,
    messages: sessionState.messages,
    context: sessionState.context,
    userProfile,
    isInitialized,
    addMessage,
    markGreeted,
    addDestinationPreference,
    clearSession,
    getUserContextForAI,
    persistToDatabase: () => persistToDatabase(sessionState),
  };
};
