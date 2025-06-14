
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
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center text-shadow font-serif">
              {t('contactUs')}
            </h1>
            
            <div className="grid md:grid-cols-2 gap-8">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-volga-logo-blue p-3 rounded-full">
                      <method.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{method.title}</h3>
                      {method.href === '#' ? (
                        <p className="text-gray-200">{method.value}</p>
                      ) : (
                        <a 
                          href={method.href}
                          className="text-gray-200 hover:text-white transition-colors"
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
