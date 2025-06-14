
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    welcome: "Welcome to Volga Services",
    subtitle: "Russia's premium tourist experience. We provide VIP transportation, seamless hotel bookings, curated event access, and unforgettable Russian adventures.",
    exploreServices: "Explore Services",
    languageSelector: "Language"
  },
  ar: {
    welcome: "مرحباً بكم في خدمات فولغا",
    subtitle: "تجربة السياحة الفاخرة في روسيا. نحن نوفر النقل المميز، حجوزات فندقية سلسة، الوصول المنسق للفعاليات، ومغامرات روسية لا تُنسى.",
    exploreServices: "استكشف الخدمات",
    languageSelector: "اللغة"
  },
  ru: {
    welcome: "Добро пожаловать в Волга Сервис",
    subtitle: "Премиальный туристический опыт России. Мы предоставляем VIP-транспорт, бесшовное бронирование отелей, курируемый доступ к мероприятиям и незабываемые русские приключения.",
    exploreServices: "Изучить Услуги",
    languageSelector: "Язык"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('volga-language') as Language;
    if (savedLanguage && ['en', 'ar', 'ru'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('volga-language', lang);
    
    // Set document direction for Arabic
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
