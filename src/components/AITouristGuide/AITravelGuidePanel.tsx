import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, User, Mic, MicOff, Volume2, VolumeX, ChevronDown, ChevronUp, Sparkles, MapPin, Calendar, DollarSign, Cloud, Ticket, Hotel, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIGuideSession, AIGuideMessage } from '@/hooks/useAIGuideSession';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AITravelGuidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Language codes for Web Speech API
const speechLangMap: Record<string, string> = {
  en: 'en-US',
  ar: 'ar-SA',
  ru: 'ru-RU',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  zh: 'zh-CN',
  hi: 'hi-IN',
  ur: 'ur-PK',
  tr: 'tr-TR',
  fa: 'fa-IR',
};

// Smart suggestion categories
const getSmartSuggestions = (language: string) => {
  const suggestions: Record<string, { icon: React.ReactNode; label: string; query: string }[]> = {
    en: [
      { icon: <Cloud className="h-3 w-3" />, label: "Weather & Climate", query: "What's the best time to visit and what weather should I expect?" },
      { icon: <Hotel className="h-3 w-3" />, label: "Top Hotels", query: "Recommend the best hotels by rating and location" },
      { icon: <DollarSign className="h-3 w-3" />, label: "Daily Budget", query: "What's the estimated daily cost for travelers?" },
      { icon: <Ticket className="h-3 w-3" />, label: "Visa Info", query: "What are the visa requirements for tourists?" },
      { icon: <MapPin className="h-3 w-3" />, label: "Must-See Places", query: "What are the most popular attractions I shouldn't miss?" },
      { icon: <Calendar className="h-3 w-3" />, label: "Events & Activities", query: "What events and activities are happening soon?" },
    ],
    ar: [
      { icon: <Cloud className="h-3 w-3" />, label: "الطقس والمناخ", query: "ما هو أفضل وقت للزيارة وما الطقس المتوقع؟" },
      { icon: <Hotel className="h-3 w-3" />, label: "أفضل الفنادق", query: "اقترح أفضل الفنادق حسب التقييم والموقع" },
      { icon: <DollarSign className="h-3 w-3" />, label: "الميزانية اليومية", query: "ما هي التكلفة اليومية المتوقعة للمسافرين؟" },
      { icon: <Ticket className="h-3 w-3" />, label: "التأشيرات", query: "ما هي متطلبات التأشيرة للسياح؟" },
      { icon: <MapPin className="h-3 w-3" />, label: "أماكن لا تفوتها", query: "ما هي أهم المعالم السياحية التي يجب زيارتها؟" },
      { icon: <Calendar className="h-3 w-3" />, label: "الفعاليات", query: "ما هي الفعاليات والأنشطة القادمة؟" },
    ],
    ru: [
      { icon: <Cloud className="h-3 w-3" />, label: "Погода", query: "Когда лучше посетить и какая погода ожидается?" },
      { icon: <Hotel className="h-3 w-3" />, label: "Лучшие отели", query: "Порекомендуйте лучшие отели по рейтингу" },
      { icon: <DollarSign className="h-3 w-3" />, label: "Бюджет", query: "Сколько стоит день путешествия?" },
      { icon: <Ticket className="h-3 w-3" />, label: "Виза", query: "Какие требования к визе для туристов?" },
      { icon: <MapPin className="h-3 w-3" />, label: "Достопримечательности", query: "Какие места обязательно стоит посетить?" },
      { icon: <Calendar className="h-3 w-3" />, label: "Мероприятия", query: "Какие мероприятия запланированы?" },
    ],
  };
  return suggestions[language] || suggestions.en;
};

export const AITravelGuidePanel: React.FC<AITravelGuidePanelProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const {
    sessionId,
    messages,
    context,
    userProfile,
    isInitialized,
    addMessage,
    markGreeted,
    clearSession,
    getUserContextForAI,
    persistToDatabase,
  } = useAIGuideSession();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholders: Record<string, string> = {
    en: 'Ask about destinations, costs, visa...',
    ar: 'اسأل عن الوجهات، التكاليف، التأشيرة...',
    ru: 'Спросите о направлениях, стоимости...',
  };

  const titles: Record<string, string> = {
    en: 'AI Travel Consultant',
    ar: 'مستشار السفر الذكي',
    ru: 'AI Консультант',
  };

  // Initialize speech recognition and synthesis
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = speechLangMap[language] || 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [language]);

  // Update recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLangMap[language] || 'en-US';
    }
  }, [language]);

  // Get user location on open
  useEffect(() => {
    if (isOpen && !userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, [isOpen, userLocation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isExpanded]);

  const speak = useCallback((text: string) => {
    if (isMuted || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLangMap[language] || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    synthRef.current.speak(utterance);
  }, [language, isMuted]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Speech recognition error:', e);
      }
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setIsExpanded(true);
    
    // Add user message to session
    const userMessage: AIGuideMessage = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    setIsLoading(true);

    try {
      const userContext = getUserContextForAI();
      
      const { data, error } = await supabase.functions.invoke('ai-tourist-guide', {
        body: {
          message: textToSend,
          language,
          session_id: sessionId,
          user_id: userContext.userId,
          user_location: userLocation,
          user_context: userContext,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const responseText = data.response;
      
      // Extract suggested follow-up questions from the response
      const suggestions = extractFollowUpQuestions(responseText, language);
      
      // Add assistant message to session
      const assistantMessage: AIGuideMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        suggestions,
      };
      addMessage(assistantMessage);
      
      // Mark as greeted after first successful interaction
      if (!context.hasGreeted) {
        markGreeted();
      }
      
      speak(responseText);
      
      // Persist session after successful interaction
      persistToDatabase();
    } catch (error: any) {
      console.error('AI Guide error:', error);
      const fallbackMessage = language === 'ar' 
        ? 'يرجى التواصل مع فريقنا للتأكيد.'
        : language === 'ru'
        ? 'Пожалуйста, свяжитесь с нашей командой.'
        : 'Please contact our team for confirmation.';
      
      toast({
        title: 'Error',
        description: error.message || fallbackMessage,
        variant: 'destructive',
      });
      
      addMessage({
        role: 'assistant',
        content: fallbackMessage,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Extract potential follow-up questions based on context
  const extractFollowUpQuestions = (response: string, lang: string): string[] => {
    const suggestions: Record<string, string[]> = {
      en: [
        "How do I book this?",
        "What's the price range?",
        "Show more options",
      ],
      ar: [
        "كيف أحجز هذا؟",
        "ما هو نطاق الأسعار؟",
        "أظهر خيارات أخرى",
      ],
      ru: [
        "Как это забронировать?",
        "Какой диапазон цен?",
        "Покажите другие варианты",
      ],
    };
    return suggestions[lang] || suggestions.en;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (query: string) => {
    sendMessage(query);
  };

  const handleClearSession = () => {
    clearSession();
    toast({
      title: language === 'ar' ? 'تم مسح المحادثة' : language === 'ru' ? 'Чат очищен' : 'Chat cleared',
      description: language === 'ar' ? 'بدأت محادثة جديدة' : language === 'ru' ? 'Начат новый разговор' : 'Started a new conversation',
    });
  };

  if (!isOpen) return null;

  const smartSuggestions = getSmartSuggestions(language);

  // Show loading state while session is initializing
  if (!isInitialized) {
    return (
      <div 
        className={cn(
          "fixed z-40 transition-all duration-300 ease-in-out",
          "bottom-20 left-4 right-4 sm:right-auto sm:w-96 h-auto"
        )}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="bg-background/95 backdrop-blur-md rounded-xl shadow-2xl border border-border/50 p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-40 transition-all duration-300 ease-in-out",
        "bottom-20 left-4 right-4 sm:right-auto sm:w-96",
        isExpanded ? "h-[60vh] max-h-[500px]" : "h-auto"
      )}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="bg-background/95 backdrop-blur-md rounded-xl shadow-2xl border border-border/50 flex flex-col h-full overflow-hidden"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header - Always visible */}
        <div 
          className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {titles[language] || titles.en}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {userProfile?.full_name 
                  ? (language === 'ar' ? `مرحباً، ${userProfile.full_name}` : language === 'ru' ? `Привет, ${userProfile.full_name}` : `Hi, ${userProfile.full_name}`)
                  : (language === 'ar' ? 'مساعدك الشخصي للسفر' : language === 'ru' ? 'Ваш личный консультант' : 'Your personal travel expert')
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSession();
                }}
                className="h-7 w-7"
                title={language === 'ar' ? 'مسح المحادثة' : language === 'ru' ? 'Очистить чат' : 'Clear chat'}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            {synthRef.current && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (synthRef.current) synthRef.current.cancel();
                  setIsMuted(!isMuted);
                }}
                className="h-7 w-7"
              >
                {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }} 
              className="h-7 w-7"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <>
            {/* Messages or Smart Suggestions */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              {messages.length === 0 ? (
                // Smart Suggestions Grid - Initial State
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    {language === 'ar' ? 'كيف يمكنني مساعدتك اليوم؟' : language === 'ru' ? 'Чем могу помочь?' : 'How can I help you today?'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {smartSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion.query)}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left group"
                      >
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                          {suggestion.icon}
                        </div>
                        <span className="text-xs font-medium text-foreground leading-tight">
                          {suggestion.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Chat Messages
                <div className="space-y-3">
                  {messages.map((msg, idx) => (
                    <div key={idx}>
                      <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <Sparkles className="h-3 w-3 text-primary" />
                          </div>
                        )}
                        <div 
                          className={cn(
                            "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-foreground'
                          )}
                        >
                          {msg.content}
                        </div>
                        {msg.role === 'user' && (
                          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      
                      {/* Follow-up suggestions after assistant message */}
                      {msg.role === 'assistant' && msg.suggestions && idx === messages.length - 1 && !isLoading && (
                        <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                          {msg.suggestions.map((sugg, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleSuggestionClick(sugg)}
                              className="px-2 py-1 text-[10px] rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                            >
                              {sugg}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-background/50">
              <div className="flex gap-2">
                {speechSupported && (
                  <Button 
                    variant={isListening ? "default" : "outline"}
                    size="icon"
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={cn(
                      "h-9 w-9 shrink-0",
                      isListening && 'bg-destructive hover:bg-destructive/90 animate-pulse'
                    )}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholders[language] || placeholders.en}
                  disabled={isLoading || isListening}
                  className="flex-1 h-9 text-sm"
                />
                <Button 
                  onClick={() => sendMessage()} 
                  disabled={isLoading || !input.trim()} 
                  size="icon" 
                  className="h-9 w-9 shrink-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {isListening && (
                <p className="text-[10px] text-muted-foreground mt-1.5 text-center animate-pulse">
                  {language === 'ar' ? 'جارٍ الاستماع...' : language === 'ru' ? 'Слушаю...' : 'Listening...'}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
