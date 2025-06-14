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
    flexibleDuration: "Flexible Duration",
    home: 'Home',
    about: 'About',
    contact: 'Contact',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    address: 'Address',
    whatsapp: 'WhatsApp',
    contactInfo: 'Contact Information',
    businessInfo: 'Business Information',
    taxNumber: 'Tax Number',
    registrationNumber: 'Registration Number',
    followUs: 'Follow Us',
    allRightsReserved: 'All rights reserved.',
    footerDescription: 'Russia\'s premium tourist experience. VIP transportation, seamless hotel bookings, curated event access, and unforgettable Russian adventures.',
    aboutUs: 'About Us',
    contactUs: 'Contact Us',
    aboutDescription: 'Volga Services is Russia\'s premier tourism company, dedicated to providing exceptional travel experiences across the vast and beautiful landscapes of Russia. From the historic streets of Moscow and St. Petersburg to the pristine wilderness of Siberia, we offer comprehensive tourism solutions.',
    ourMission: 'Our Mission',
    missionDescription: 'To provide world-class tourism services that showcase the beauty, culture, and heritage of Russia while ensuring comfort, safety, and unforgettable experiences for our guests.',
    ourVision: 'Our Vision',
    visionDescription: 'To be the leading tourism company in Russia, recognized globally for excellence in service, innovation in travel solutions, and commitment to sustainable tourism practices.',
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
    fiveStarHotels: "5-Star Hotels",
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
    flexibleDuration: "مدة مرنة",
    home: 'الرئيسية',
    about: 'من نحن',
    contact: 'اتصل بنا',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    website: 'الموقع الإلكتروني',
    address: 'العنوان',
    whatsapp: 'واتساب',
    contactInfo: 'معلومات الاتصال',
    businessInfo: 'معلومات الشركة',
    taxNumber: 'الرقم الضريبي',
    registrationNumber: 'رقم التسجيل',
    followUs: 'تابعنا',
    allRightsReserved: 'جميع الحقوق محفوظة.',
    footerDescription: 'تجربة السياحة الروسية المتميزة. النقل الفاخر، حجوزات الفنادق السلسة، الوصول المنسق للفعاليات، والمغامرات الروسية التي لا تُنسى.',
    aboutUs: 'من نحن',
    contactUs: 'اتصل بنا',
    aboutDescription: 'فولجا سيرفيسز هي شركة السياحة الرائدة في روسيا، المكرسة لتقديم تجارب سفر استثنائية عبر المناظر الطبيعية الشاسعة والجميلة في روسيا. من شوارع موسكو وسانت بطرسبرغ التاريخية إلى البرية البكر في سيبيريا، نقدم حلول سياحية شاملة.',
    ourMission: 'مهمتنا',
    missionDescription: 'تقديم خدمات سياحية عالمية المستوى تُظهر جمال وثقافة وتراث روسيا مع ضمان الراحة والأمان والتجارب التي لا تُنسى لضيوفنا.',
    ourVision: 'رؤيتنا',
    visionDescription: 'أن نكون شركة السياحة الرائدة في روسيا، معترف بها عالمياً للتميز في الخدمة والابتكار في حلول السفر والالتزام بممارسات السياحة المستدامة.',
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
    flexibleDuration: "Гибкая Продолжительность",
    home: 'Главная',
    about: 'О нас',
    contact: 'Контакты',
    phone: 'Телефон',
    email: 'Электронная почта',
    website: 'Веб-сайт',
    address: 'Адрес',
    whatsapp: 'WhatsApp',
    contactInfo: 'Контактная информация',
    businessInfo: 'Информация о компании',
    taxNumber: 'Налоговый номер',
    registrationNumber: 'Регистрационный номер',
    followUs: 'Подписывайтесь',
    allRightsReserved: 'Все права защищены.',
    footerDescription: 'Премиальный туристический опыт России. VIP транспорт, бесшовное бронирование отелей, кураторский доступ к мероприятиям и незабываемые российские приключения.',
    aboutUs: 'О нас',
    contactUs: 'Связаться с нами',
    aboutDescription: 'Волга Сервисы - ведущая туристическая компания России, посвященная предоставлению исключительных туристических впечатлений по обширным и красивым ландшафтам России. От исторических улиц Москвы и Санкт-Петербурга до нетронутой дикой природы Сибири, мы предлагаем комплексные туристические решения.',
    ourMission: 'Наша миссия',
    missionDescription: 'Предоставлять туристические услуги мирового класса, которые демонстрируют красоту, культуру и наследие России, обеспечивая при этом комфорт, безопасность и незабываемые впечатления для наших гостей.',
    ourVision: 'Наше видение',
    visionDescription: 'Быть ведущей туристической компанией в России, признанной во всем мире за превосходство в обслуживании, инновации в туристических решениях и приверженность устойчивым туристическим практикам.',
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
