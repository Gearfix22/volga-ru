import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { useContactInfo, useSocialSettings } from '@/hooks/useAppSettings';

const Contact = () => {
  const { t, language, isRTL } = useLanguage();
  const { data: contactData, loading: contactLoading } = useContactInfo();
  const { data: socialData } = useSocialSettings();

  // Get address based on current language
  const getAddress = () => {
    if (!contactData) return '';
    switch (language) {
      case 'ar':
        return contactData.addressAr;
      case 'ru':
        return contactData.addressRu;
      default:
        return contactData.addressEn;
    }
  };

  const contactMethods = [
    {
      icon: Phone,
      title: t('footer.phone'),
      value: contactData?.phone || '+7 952 221 29 03',
      href: `tel:${contactData?.phoneRaw || '79522212903'}`,
    },
    {
      icon: Mail,
      title: t('footer.email'),
      value: contactData?.email || 'info@volgaservices.com',
      href: `mailto:${contactData?.email || 'info@volgaservices.com'}`,
    },
    {
      icon: Globe,
      title: t('footer.website'),
      value: contactData?.website || 'www.volgaservices.com',
      href: `https://${contactData?.website || 'www.volgaservices.com'}`,
    },
    {
      icon: MapPin,
      title: t('footer.address'),
      value: getAddress(),
      href: '#',
    },
  ];

  if (contactLoading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <Navigation />
        <div className="relative z-10 pt-24 flex items-center justify-center">
          <div className="animate-pulse text-white">{t('common.loading') || 'Loading...'}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="relative z-10 pt-12 sm:pt-14 lg:pt-16 pb-6 sm:pb-8">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 max-w-6xl">
          <div className="max-w-5xl mx-auto">
            <h1 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 text-center text-shadow font-serif leading-tight px-1 ${isRTL ? 'text-right' : ''}`}>
              {t('pages.contactUs')}
            </h1>
            
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-5">
                  <div className={`flex items-start space-x-2 sm:space-x-3 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className="bg-brand-primary p-1.5 sm:p-2 lg:p-2.5 rounded-full flex-shrink-0">
                      <method.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-semibold text-sm sm:text-base lg:text-lg mb-1">{method.title}</h3>
                      {method.href === '#' ? (
                        <p className={`text-gray-200 text-xs sm:text-sm lg:text-base leading-relaxed break-words ${isRTL ? 'text-right' : ''}`}>{method.value}</p>
                      ) : (
                        <a 
                          href={method.href}
                          className={`text-gray-200 hover:text-white transition-colors text-xs sm:text-sm lg:text-base leading-relaxed break-words block ${isRTL ? 'text-right' : ''}`}
                          target={method.href.startsWith('http') ? '_blank' : undefined}
                          rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {method.value}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Contact;
