
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
    languageSelector: "Language",
    backToHome: "Back to Home",
    ourServices: "Our Services",
    servicesSubtitle: "Discover our comprehensive range of premium services designed to make your Russian experience unforgettable.",
    allServices: "All Services",
    transportation: "Transportation",
    hotels: "Hotels",
    events: "Events",
    customTrips: "Custom Trips",
    bookNow: "Book Now",
    learnMore: "Learn More",
    luxuryTransport: "Luxury Transportation",
    luxuryTransportDesc: "Premium vehicles with professional drivers for your comfort and safety.",
    luxuryHotels: "Luxury Hotels",
    luxuryHotelsDesc: "Five-star accommodations in prime locations across Russia.",
    midrangeHotels: "Mid-Range Hotels",
    midrangeHotelsDesc: "Comfortable and affordable stays without compromising quality.",
    culturalEvents: "Cultural Events",
    culturalEventsDesc: "Exclusive access to concerts, festivals, and cultural shows.",
    groupTransport: "Group Transportation",
    groupTransportDesc: "Spacious buses and vans for group travel with flexible scheduling.",
    customTours: "Custom Tours",
    customToursDesc: "Personalized itineraries crafted to your interests and preferences.",
    professionalDrivers: "Professional Drivers",
    premiumVehicles: "Premium Vehicles",
    airportTransfers: "Airport Transfers",
    fiveStarHotels: "5-Star Hotels",
    primeLocations: "Prime Locations",
    conciergeService: "Concierge Service",
    comfortableStay: "Comfortable Stay",
    greatValue: "Great Value",
    modernAmenities: "Modern Amenities",
    exclusiveAccess: "Exclusive Access",
    culturalShows: "Cultural Shows",
    expertGuides: "Expert Guides",
    largeGroups: "Large Groups",
    comfortableBuses: "Comfortable Buses",
    flexibleSchedules: "Flexible Schedules",
    personalizedItinerary: "Personalized Itinerary",
    privateGuide: "Private Guide",
    flexibleDuration: "Flexible Duration"
  },
  ar: {
    welcome: "مرحباً بكم في خدمات فولغا",
    subtitle: "تجربة السياحة الفاخرة في روسيا. نحن نوفر النقل المميز، حجوزات فندقية سلسة، الوصول المنسق للفعاليات، ومغامرات روسية لا تُنسى.",
    exploreServices: "استكشف الخدمات",
    languageSelector: "اللغة",
    backToHome: "العودة للرئيسية",
    ourServices: "خدماتنا",
    servicesSubtitle: "اكتشف مجموعتنا الشاملة من الخدمات المميزة المصممة لجعل تجربتك الروسية لا تُنسى.",
    allServices: "جميع الخدمات",
    transportation: "النقل",
    hotels: "الفنادق",
    events: "الفعاليات",
    customTrips: "رحلات مخصصة",
    bookNow: "احجز الآن",
    learnMore: "اعرف المزيد",
    luxuryTransport: "النقل الفاخر",
    luxuryTransportDesc: "مركبات فاخرة مع سائقين محترفين لراحتك وأمانك.",
    luxuryHotels: "فنادق فاخرة",
    luxuryHotelsDesc: "إقامة خمس نجوم في أفضل المواقع عبر روسيا.",
    midrangeHotels: "فنادق متوسطة",
    midrangeHotelsDesc: "إقامة مريحة وبأسعار معقولة دون التنازل عن الجودة.",
    culturalEvents: "فعاليات ثقافية",
    culturalEventsDesc: "وصول حصري للحفلات والمهرجانات والعروض الثقافية.",
    groupTransport: "نقل جماعي",
    groupTransportDesc: "حافلات وشاحنات واسعة للسفر الجماعي مع جداول مرنة.",
    customTours: "جولات مخصصة",
    customToursDesc: "برامج شخصية مصممة حسب اهتماماتك وتفضيلاتك.",
    professionalDrivers: "سائقون محترفون",
    premiumVehicles: "مركبات فاخرة",
    airportTransfers: "نقل المطار",
    fiveStarHotels: "فنادق 5 نجوم",
    primeLocations: "مواقع مميزة",
    conciergeService: "خدمة الكونسيرج",
    comfortableStay: "إقامة مريحة",
    greatValue: "قيمة ممتازة",
    modernAmenities: "مرافق حديثة",
    exclusiveAccess: "وصول حصري",
    culturalShows: "عروض ثقافية",
    expertGuides: "مرشدون خبراء",
    largeGroups: "مجموعات كبيرة",
    comfortableBuses: "حافلات مريحة",
    flexibleSchedules: "جداول مرنة",
    personalizedItinerary: "برنامج شخصي",
    privateGuide: "مرشد خاص",
    flexibleDuration: "مدة مرنة"
  },
  ru: {
    welcome: "Добро пожаловать в Волга Сервис",
    subtitle: "Премиальный туристический опыт России. Мы предоставляем VIP-транспорт, бесшовное бронирование отелей, курируемый доступ к мероприятиям и незабываемые русские приключения.",
    exploreServices: "Изучить Услуги",
    languageSelector: "Язык",
    backToHome: "Вернуться домой",
    ourServices: "Наши Услуги",
    servicesSubtitle: "Откройте для себя наш полный спектр премиальных услуг, созданных для того, чтобы ваш российский опыт стал незабываемым.",
    allServices: "Все Услуги",
    transportation: "Транспорт",
    hotels: "Отели",
    events: "События",
    customTrips: "Индивидуальные Поездки",
    bookNow: "Забронировать",
    learnMore: "Узнать Больше",
    luxuryTransport: "Роскошный Транспорт",
    luxuryTransportDesc: "Премиальные автомобили с профессиональными водителями для вашего комфорта и безопасности.",
    luxuryHotels: "Роскошные Отели",
    luxuryHotelsDesc: "Пятизвездочные номера в лучших локациях по всей России.",
    midrangeHotels: "Отели Среднего Класса",
    midrangeHotelsDesc: "Комфортное и доступное размещение без компромиссов в качестве.",
    culturalEvents: "Культурные События",
    culturalEventsDesc: "Эксклюзивный доступ к концертам, фестивалям и культурным шоу.",
    groupTransport: "Групповой Транспорт",
    groupTransportDesc: "Просторные автобусы и фургоны для группового путешествия с гибким расписанием.",
    customTours: "Индивидуальные Туры",
    customToursDesc: "Персонализированные маршруты, созданные в соответствии с вашими интересами и предпочтениями.",
    professionalDrivers: "Профессиональные Водители",
    premiumVehicles: "Премиум Автомобили",
    airportTransfers: "Трансферы из Аэропорта",
    fiveStarHotels: "5-Звездочные Отели",
    primeLocations: "Лучшие Локации",
    conciergeService: "Служба Консьержа",
    comfortableStay: "Комфортное Пребывание",
    greatValue: "Отличное Соотношение",
    modernAmenities: "Современные Удобства",
    exclusiveAccess: "Эксклюзивный Доступ",
    culturalShows: "Культурные Шоу",
    expertGuides: "Эксперт Гиды",
    largeGroups: "Большие Группы",
    comfortableBuses: "Комфортные Автобусы",
    flexibleSchedules: "Гибкое Расписание",
    personalizedItinerary: "Персональный Маршрут",
    privateGuide: "Частный Гид",
    flexibleDuration: "Гибкая Продолжительность"
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
