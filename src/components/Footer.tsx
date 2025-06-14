
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin, Globe, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';

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
    <footer className="bg-volga-navy border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="h-12">
              <Logo />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t('footerDescription')}
            </p>
            
            {/* WhatsApp Button */}
            <Button
              asChild
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Phone className="h-4 w-4 mr-2" />
                {t('whatsapp')}
              </a>
            </Button>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">{t('contactInfo')}</h3>
            <div className="space-y-3">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <item.icon className="h-4 w-4 text-volga-logo-blue mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">{item.label}</p>
                    {item.href === '#' ? (
                      <p className="text-gray-300 text-sm">{item.value}</p>
                    ) : (
                      <a 
                        href={item.href}
                        className="text-gray-300 hover:text-white text-sm transition-colors"
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
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">{t('businessInfo')}</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <span className="text-gray-400">{t('taxNumber')}:</span><br />
                4706086543
              </p>
              <p>
                <span className="text-gray-400">{t('registrationNumber')}:</span><br />
                1254700002831
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">{t('followUs')}</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors group"
                >
                  <social.icon className="h-5 w-5 text-white group-hover:text-volga-logo-blue transition-colors" />
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Volga Services. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};
