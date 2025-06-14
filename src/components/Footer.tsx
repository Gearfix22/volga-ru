
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin, Globe, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();

  const whatsappNumber = '+79522212903';
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\+/g, '')}`;

  const contactInfo = [
    {
      icon: Phone,
      label: t('phone'),
      value: '+7 952 221 29 03',
      href: `tel:${whatsappNumber}`,
    },
    {
      icon: Mail,
      label: t('email'),
      value: 'info@volgaservices.com',
      href: 'mailto:info@volgaservices.com',
    },
    {
      icon: Globe,
      label: t('website'),
      value: 'www.volgaservices.com',
      href: 'https://www.volgaservices.com',
    },
    {
      icon: MapPin,
      label: t('address'),
      value: language === 'ru' 
        ? 'обл. Ленинградская, р-н. Всеволожский, г. Мурино, ул. Шувалова, д. 11, кв.'
        : 'Leningrad Region, Vsevolozhsky District, Murino, Shuvalov St., 11',
      href: '#',
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      label: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=61574150824169',
    },
    {
      icon: Instagram,
      label: 'Instagram',
      href: 'https://www.instagram.com/volga.servicesegy/',
    },
  ];

  return (
    <footer className="bg-gradient-to-t from-volga-navy-dark to-volga-navy border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-xl font-serif">Volga Services</h3>
            <p className="text-gray-300 text-sm leading-relaxed font-light">
              {t('footerDescription')}
            </p>
            
            {/* WhatsApp Button */}
            <Button
              asChild
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Phone className="h-4 w-4 mr-2" />
                {t('whatsapp')}
              </a>
            </Button>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg font-serif">{t('contactInfo')}</h3>
            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 group">
                  <item.icon className="h-5 w-5 text-volga-logo-blue mt-1 flex-shrink-0 group-hover:text-volga-logo-red transition-colors" />
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{item.label}</p>
                    {item.href === '#' ? (
                      <p className="text-gray-300 text-sm font-light">{item.value}</p>
                    ) : (
                      <a 
                        href={item.href}
                        className="text-gray-300 hover:text-white text-sm transition-colors font-light hover:underline"
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {item.value}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg font-serif">{t('businessInfo')}</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="bg-white/5 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">{t('taxNumber')}</p>
                <p className="font-mono">4706086543</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">{t('registrationNumber')}</p>
                <p className="font-mono">1254700002831</p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg font-serif">{t('followUs')}</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-xl hover:from-volga-logo-blue/20 hover:to-volga-logo-red/20 transition-all duration-300 group transform hover:scale-110 backdrop-blur-sm"
                >
                  <social.icon className="h-6 w-6 text-white group-hover:text-volga-logo-blue transition-colors" />
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-gray-400 text-sm font-light">
            © 2024 <span className="font-medium text-white">Volga Services</span>. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};
