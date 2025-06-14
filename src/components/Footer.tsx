
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
    <footer className="relative overflow-hidden glass-effect border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-pearl-white font-serif font-bold text-2xl sm:text-3xl mb-4">
                <span className="luxury-text">Volga Services</span>
              </h3>
              <p className="text-ocean-light/75 text-sm leading-relaxed">
                {t('footerDescription')}
              </p>
            </div>
            
            {/* WhatsApp Button */}
            <Button
              asChild
              className="bg-green-600 hover:bg-green-700 text-white rounded-full w-full sm:w-auto"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <Phone className="h-4 w-4 mr-2" />
                {t('whatsapp')}
              </a>
            </Button>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="text-pearl-white font-serif font-bold text-lg sm:text-xl">{t('contactInfo')}</h3>
            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <item.icon className="h-5 w-5 text-ocean-bright mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-ocean-light/70 text-xs font-medium uppercase tracking-wide">{item.label}</p>
                    {item.href === '#' ? (
                      <p className="text-pearl-white text-sm break-words">{item.value}</p>
                    ) : (
                      <a 
                        href={item.href}
                        className="text-pearl-white hover:text-ocean-bright text-sm transition-colors break-words"
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
            <h3 className="text-pearl-white font-serif font-bold text-lg sm:text-xl">{t('businessInfo')}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-ocean-light/70 text-xs font-medium uppercase tracking-wide">{t('taxNumber')}</p>
                <p className="text-ocean-bright font-mono text-lg font-semibold">4706086543</p>
              </div>
              <div>
                <p className="text-ocean-light/70 text-xs font-medium uppercase tracking-wide">{t('registrationNumber')}</p>
                <p className="text-ocean-bright font-mono text-lg font-semibold">1254700002831</p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-6">
            <h3 className="text-pearl-white font-serif font-bold text-lg sm:text-xl">{t('followUs')}</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-effect p-3 rounded-full hover:bg-ocean-500/20 transition-colors"
                >
                  <social.icon className="h-6 w-6 text-pearl-white" />
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-ocean-light/70 text-sm">
            © 2024 <span className="text-ocean-bright font-medium">Volga Services</span>. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};
