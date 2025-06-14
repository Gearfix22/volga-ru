
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';

const Contact = () => {
  const { t, language } = useLanguage();

  const contactMethods = [
    {
      icon: Phone,
      title: t('phone'),
      value: '+7 952 221 29 03',
      href: 'tel:+79522212903',
    },
    {
      icon: Mail,
      title: t('email'),
      value: 'info@volgaservices.com',
      href: 'mailto:info@volgaservices.com',
    },
    {
      icon: Globe,
      title: t('website'),
      value: 'www.volgaservices.com',
      href: 'https://www.volgaservices.com',
    },
    {
      icon: MapPin,
      title: t('address'),
      value: language === 'ru' 
        ? 'обл. Ленинградская, р-н. Всеволожский, г. Мурино, ул. Шувалова, д. 11, кв.'
        : 'Leningrad Region, Vsevolozhsky District, Murino, Shuvalov St., 11',
      href: '#',
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="relative z-10 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 text-center text-shadow font-serif leading-tight">
              {t('contactUs')}
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="bg-volga-logo-blue p-2 sm:p-3 rounded-full flex-shrink-0">
                      <method.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-semibold text-base sm:text-lg mb-1">{method.title}</h3>
                      {method.href === '#' ? (
                        <p className="text-gray-200 text-sm sm:text-base leading-relaxed break-words">{method.value}</p>
                      ) : (
                        <a 
                          href={method.href}
                          className="text-gray-200 hover:text-white transition-colors text-sm sm:text-base leading-relaxed break-words inline-block"
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
