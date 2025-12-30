import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AITouristGuideModalProps {
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

export const AITouristGuideModal: React.FC<AITouristGuideModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
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
    en: 'Ask me anything about tourism...',
    ar: 'اسألني أي شيء عن السياحة...',
    ru: 'Спросите меня о туризме...',
    fr: 'Posez-moi une question sur le tourisme...',
    de: 'Fragen Sie mich etwas über Tourismus...',
    es: 'Pregúntame sobre turismo...',
  };

  const welcomeMessages: Record<string, string> = {
    en: "Hello! I'm your AI Tourist Guide. Ask me about attractions, events, transportation, or travel tips. You can also use voice!",
    ar: "مرحباً! أنا مرشدك السياحي الذكي. اسألني عن المعالم أو الفعاليات أو النقل. يمكنك أيضاً استخدام الصوت!",
    ru: "Привет! Я ваш AI-гид. Спрашивайте о достопримечательностях, событиях, транспорте. Можете говорить голосом!",
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
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
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
        () => {
          // Location denied - continue without it
        },
        { timeout: 5000 }
      );
    }
  }, [isOpen, userLocation]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: welcomeMessages[language] || welcomeMessages.en }]);
    }
  }, [isOpen, language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-tourist-guide', {
        body: {
          message: textToSend,
          language,
          session_id: sessionId,
          user_id: user?.id || null,
          user_location: userLocation,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const responseText = data.response;
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      
      // Speak the response if not muted
      speak(responseText);
    } catch (error: any) {
      console.error('AI Guide error:', error);
      const fallbackMessage = language === 'ar' 
        ? 'يرجى التواصل مع فريقنا للتأكيد.'
        : language === 'ru'
        ? 'Пожалуйста, свяжитесь с нашей командой для подтверждения.'
        : 'Please contact our team for confirmation.';
      
      toast({
        title: 'Error',
        description: error.message || fallbackMessage,
        variant: 'destructive',
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-send after voice input
  useEffect(() => {
    if (!isListening && input.trim() && recognitionRef.current) {
      const timer = setTimeout(() => {
        if (input.trim()) {
          sendMessage(input.trim());
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, input]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-background rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col border"
        onClick={e => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-600/10">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-foreground">
              {language === 'ar' ? 'مرشد سياحي ذكي' : language === 'ru' ? 'AI Гид' : 'AI Tourist Guide'}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {synthRef.current && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (synthRef.current) synthRef.current.cancel();
                  setIsMuted(!isMuted);
                }}
                className="h-8 w-8"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <div 
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            {speechSupported && (
              <Button 
                variant={isListening ? "default" : "outline"}
                size="icon"
                onClick={toggleListening}
                disabled={isLoading}
                className={isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}
                title={isListening ? 'Stop listening' : 'Start voice input'}
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
              className="flex-1"
            />
            <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="icon" className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-muted-foreground mt-2 text-center animate-pulse">
              {language === 'ar' ? 'جارٍ الاستماع...' : language === 'ru' ? 'Слушаю...' : 'Listening...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
