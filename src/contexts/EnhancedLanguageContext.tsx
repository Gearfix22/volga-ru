
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation & General
    home: "Home",
    services: "Services",
    about: "About",
    contact: "Contact",
    booking: "Booking",
    dashboard: "Dashboard",
    login: "Login",
    logout: "Logout",
    signup: "Sign Up",
    profile: "Profile",
    settings: "Settings",
    
    // Services
    transportation: "Transportation",
    hotels: "Hotels",
    events: "Events",
    customTrips: "Custom Trips",
    bookService: "Book Service",
    
    // Booking Process
    bookYourService: "Book Your Service",
    chooseServiceDetails: "Choose your service and provide details",
    contactInformation: "Contact Information",
    contactInfoDesc: "We'll use this information to contact you about your booking",
    fullName: "Full Name",
    enterFullName: "Enter your full name",
    emailAddress: "Email Address",
    enterEmail: "Enter your email address",
    phoneNumber: "Phone Number",
    enterPhone: "Enter your phone number",
    preferredLanguage: "Preferred Language",
    selectLanguage: "Select language",
    english: "English",
    arabic: "Arabic",
    russian: "Russian",
    proceedToPayment: "Proceed to Payment",
    
    // Payment
    securePayment: "Secure Payment",
    paymentAmount: "Payment Amount",
    paymentMethod: "Payment Method",
    creditCard: "Credit Card",
    paypal: "PayPal",
    bankTransfer: "Bank Transfer",
    payWith: "Pay with",
    
    // Validation Messages
    serviceRequired: "Service Required",
    pleaseSelectService: "Please select a service to continue",
    contactInfoRequired: "Contact Information Required",
    fillRequiredFields: "Please fill in all required fields",
    
    // Confirmation
    bookingConfirmed: "Booking Confirmed!",
    thankYouBooking: "Thank you for your booking",
    paymentPendingVerification: "Payment Pending Verification",
    paymentReceiptReceived: "We have received your payment information",
    bookingDetails: "Booking Details",
    transactionReference: "Transaction reference and booking information",
    transactionId: "Transaction ID",
    status: "Status",
    confirmed: "Confirmed",
    pendingVerification: "Pending Verification",
    whatHappensNext: "What happens next?",
    serviceCoordination: "Service coordination and preparation",
    teamContact: "Our team will contact you within 24 hours to coordinate your service",
    paymentVerification: "Payment verification in progress",
    verifyingPayment: "We're verifying your payment details with our banking partner",
    confirmationNotice: "Confirmation notice will be sent",
    emailConfirmation: "You'll receive a confirmation email once payment is verified",
    needHelp: "Need help?",
    contactSupport: "Contact our support team at",
    referenceTransaction: "Please reference your transaction ID when contacting us.",
    returnToHome: "Return to Home",
    newBooking: "Make New Booking",
    
    // Transportation specific
    pickupLocation: "Pickup Location",
    dropoffLocation: "Drop-off Location",
    travelDate: "Travel Date",
    travelTime: "Travel Time",
    vehicleType: "Vehicle Type",
    passengers: "Passengers",
    
    // Hotels specific
    city: "City",
    hotel: "Hotel",
    checkinDate: "Check-in Date",
    checkoutDate: "Check-out Date",
    roomType: "Room Type",
    guests: "Guests",
    
    // Events specific
    eventName: "Event Name",
    eventLocation: "Event Location",
    eventDate: "Event Date",
    tickets: "Tickets",
    
    // Custom Trips specific
    duration: "Duration",
    regions: "Regions",
    interests: "Interests",
    budget: "Budget",
    
    // Common Actions
    save: "Save",
    cancel: "Cancel",
    continue: "Continue",
    back: "Back",
    next: "Next",
    submit: "Submit",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    download: "Download",
    
    // Status
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    cancelled: "Cancelled",
    active: "Active",
    inactive: "Inactive",
  },
  
  ar: {
    // Navigation & General
    home: "الرئيسية",
    services: "الخدمات",
    about: "عن الشركة",
    contact: "اتصل بنا",
    booking: "الحجز",
    dashboard: "لوحة التحكم",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    signup: "إنشاء حساب",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    
    // Services
    transportation: "النقل",
    hotels: "الفنادق",
    events: "الفعاليات",
    customTrips: "رحلات مخصصة",
    bookService: "احجز الخدمة",
    
    // Booking Process
    bookYourService: "احجز خدمتك",
    chooseServiceDetails: "اختر خدمتك وقدم التفاصيل",
    contactInformation: "معلومات الاتصال",
    contactInfoDesc: "سنستخدم هذه المعلومات للتواصل معك بشأن حجزك",
    fullName: "الاسم الكامل",
    enterFullName: "أدخل اسمك الكامل",
    emailAddress: "عنوان البريد الإلكتروني",
    enterEmail: "أدخل بريدك الإلكتروني",
    phoneNumber: "رقم الهاتف",
    enterPhone: "أدخل رقم هاتفك",
    preferredLanguage: "اللغة المفضلة",
    selectLanguage: "اختر اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    russian: "الروسية",
    proceedToPayment: "المتابعة للدفع",
    
    // Payment
    securePayment: "دفع آمن",
    paymentAmount: "مبلغ الدفع",
    paymentMethod: "طريقة الدفع",
    creditCard: "بطاقة ائتمان",
    paypal: "باي بال",
    bankTransfer: "حوالة بنكية",
    payWith: "ادفع باستخدام",
    
    // Validation Messages
    serviceRequired: "الخدمة مطلوبة",
    pleaseSelectService: "يرجى اختيار خدمة للمتابعة",
    contactInfoRequired: "معلومات الاتصال مطلوبة",
    fillRequiredFields: "يرجى ملء جميع الحقول المطلوبة",
    
    // Confirmation
    bookingConfirmed: "تم تأكيد الحجز!",
    thankYouBooking: "شكراً لك على حجزك",
    paymentPendingVerification: "الدفع في انتظار التحقق",
    paymentReceiptReceived: "لقد استلمنا معلومات دفعتك",
    bookingDetails: "تفاصيل الحجز",
    transactionReference: "مرجع المعاملة ومعلومات الحجز",
    transactionId: "رقم المعاملة",
    status: "الحالة",
    confirmed: "مؤكد",
    pendingVerification: "في انتظار التحقق",
    whatHappensNext: "ما الذي سيحدث بعد ذلك؟",
    serviceCoordination: "تنسيق الخدمة والتحضير",
    teamContact: "سيتصل بك فريقنا خلال 24 ساعة لتنسيق خدمتك",
    paymentVerification: "التحقق من الدفع قيد التقدم",
    verifyingPayment: "نحن نتحقق من تفاصيل دفعتك مع شريكنا المصرفي",
    confirmationNotice: "سيتم إرسال إشعار التأكيد",
    emailConfirmation: "ستتلقى بريداً إلكترونياً للتأكيد عند التحقق من الدفع",
    needHelp: "تحتاج مساعدة؟",
    contactSupport: "اتصل بفريق الدعم على",
    referenceTransaction: "يرجى الإشارة إلى رقم المعاملة عند الاتصال بنا.",
    returnToHome: "العودة للرئيسية",
    newBooking: "إجراء حجز جديد",
    
    // Transportation specific
    pickupLocation: "موقع الاستلام",
    dropoffLocation: "موقع التسليم",
    travelDate: "تاريخ السفر",
    travelTime: "وقت السفر",
    vehicleType: "نوع المركبة",
    passengers: "الركاب",
    
    // Hotels specific
    city: "المدينة",
    hotel: "الفندق",
    checkinDate: "تاريخ تسجيل الوصول",
    checkoutDate: "تاريخ تسجيل المغادرة",
    roomType: "نوع الغرفة",
    guests: "الضيوف",
    
    // Events specific
    eventName: "اسم الفعالية",
    eventLocation: "موقع الفعالية",
    eventDate: "تاريخ الفعالية",
    tickets: "التذاكر",
    
    // Custom Trips specific
    duration: "المدة",
    regions: "المناطق",
    interests: "الاهتمامات",
    budget: "الميزانية",
    
    // Common Actions
    save: "حفظ",
    cancel: "إلغاء",
    continue: "متابعة",
    back: "عودة",
    next: "التالي",
    submit: "إرسال",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    download: "تحميل",
    
    // Status
    pending: "معلق",
    processing: "قيد المعالجة",
    completed: "مكتمل",
    cancelled: "ملغى",
    active: "نشط",
    inactive: "غير نشط",
  },
  
  ru: {
    // Navigation & General
    home: "Главная",
    services: "Услуги",
    about: "О нас",
    contact: "Контакты",
    booking: "Бронирование",
    dashboard: "Панель управления",
    login: "Войти",
    logout: "Выйти",
    signup: "Регистрация",
    profile: "Профиль",
    settings: "Настройки",
    
    // Services
    transportation: "Транспорт",
    hotels: "Отели",
    events: "Мероприятия",
    customTrips: "Индивидуальные туры",
    bookService: "Забронировать услугу",
    
    // Booking Process
    bookYourService: "Забронируйте вашу услугу",
    chooseServiceDetails: "Выберите услугу и предоставьте детали",
    contactInformation: "Контактная информация",
    contactInfoDesc: "Мы используем эту информацию для связи с вами по поводу бронирования",
    fullName: "Полное имя",
    enterFullName: "Введите ваше полное имя",
    emailAddress: "Адрес электронной почты",
    enterEmail: "Введите ваш email",
    phoneNumber: "Номер телефона",
    enterPhone: "Введите ваш номер телефона",
    preferredLanguage: "Предпочитаемый язык",
    selectLanguage: "Выберите язык",
    english: "Английский",
    arabic: "Арабский",
    russian: "Русский",
    proceedToPayment: "Перейти к оплате",
    
    // Payment
    securePayment: "Безопасная оплата",
    paymentAmount: "Сумма к оплате",
    paymentMethod: "Способ оплаты",
    creditCard: "Кредитная карта",
    paypal: "PayPal",
    bankTransfer: "Банковский перевод",
    payWith: "Оплатить через",
    
    // Validation Messages
    serviceRequired: "Услуга требуется",
    pleaseSelectService: "Пожалуйста, выберите услугу для продолжения",
    contactInfoRequired: "Требуется контактная информация",
    fillRequiredFields: "Пожалуйста, заполните все обязательные поля",
    
    // Confirmation
    bookingConfirmed: "Бронирование подтверждено!",
    thankYouBooking: "Спасибо за ваше бронирование",
    paymentPendingVerification: "Платеж ожидает проверки",
    paymentReceiptReceived: "Мы получили информацию о вашем платеже",
    bookingDetails: "Детали бронирования",
    transactionReference: "Справочная информация о транзакции и бронировании",
    transactionId: "ID транзакции",
    status: "Статус",
    confirmed: "Подтверждено",
    pendingVerification: "Ожидает проверки",
    whatHappensNext: "Что будет дальше?",
    serviceCoordination: "Координация и подготовка услуги",
    teamContact: "Наша команда свяжется с вами в течение 24 часов для координации услуги",
    paymentVerification: "Проверка платежа в процессе",
    verifyingPayment: "Мы проверяем детали вашего платежа с нашим банковским партнером",
    confirmationNotice: "Уведомление о подтверждении будет отправлено",
    emailConfirmation: "Вы получите подтверждение по электронной почте после проверки платежа",
    needHelp: "Нужна помощь?",
    contactSupport: "Обратитесь в службу поддержки по адресу",
    referenceTransaction: "Пожалуйста, укажите ваш ID транзакции при обращении к нам.",
    returnToHome: "Вернуться на главную",
    newBooking: "Сделать новое бронирование",
    
    // Transportation specific
    pickupLocation: "Место посадки",
    dropoffLocation: "Место высадки",
    travelDate: "Дата поездки",
    travelTime: "Время поездки",
    vehicleType: "Тип транспорта",
    passengers: "Пассажиры",
    
    // Hotels specific
    city: "Город",
    hotel: "Отель",
    checkinDate: "Дата заезда",
    checkoutDate: "Дата выезда",
    roomType: "Тип номера",
    guests: "Гости",
    
    // Events specific
    eventName: "Название мероприятия",
    eventLocation: "Место проведения",
    eventDate: "Дата мероприятия",
    tickets: "Билеты",
    
    // Custom Trips specific
    duration: "Продолжительность",
    regions: "Регионы",
    interests: "Интересы",
    budget: "Бюджет",
    
    // Common Actions
    save: "Сохранить",
    cancel: "Отменить",
    continue: "Продолжить",
    back: "Назад",
    next: "Далее",
    submit: "Отправить",
    edit: "Редактировать",
    delete: "Удалить",
    view: "Просмотр",
    download: "Скачать",
    
    // Status
    pending: "Ожидает",
    processing: "Обрабатывается",
    completed: "Завершено",
    cancelled: "Отменено",
    active: "Активный",
    inactive: "Неактивный",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('preferred-language', language);
    // Set document direction for RTL languages
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
