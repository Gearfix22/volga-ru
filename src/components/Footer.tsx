
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin, Globe, Facebook, Instagram, ArrowUpRight } from 'lucide-react';
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
    <footer className="relative overflow-hidden bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6 fade-in-up">
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-2xl mb-4">
                <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                  Volga Services
                </span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t('footerDescription')}
              </p>
            </div>
            
            {/* WhatsApp Button */}
            <Button
              asChild
              className="modern-button bg-green-600 hover:bg-green-700 text-white group"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3">
                <Phone className="h-4 w-4" />
                <span>{t('whatsapp')}</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </Button>
          </div>

          {/* Contact Information */}
          <div className="space-y-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-slate-900 dark:text-white font-bold text-xl">{t('contactInfo')}</h3>
            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <div key={index} className="modern-card p-4 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">{item.label}</p>
                      {item.href === '#' ? (
                        <p className="text-slate-700 dark:text-slate-300 text-sm">{item.value}</p>
                      ) : (
                        <a 
                          href={item.href}
                          className="text-slate-700 dark:text-slate-300 hover:text-primary text-sm transition-colors hover:underline"
                          target={item.href.startsWith('http') ? '_blank' : undefined}
                          rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {item.value}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-slate-900 dark:text-white font-bold text-xl">{t('businessInfo')}</h3>
            <div className="space-y-4">
              <div className="modern-card p-6">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">{t('taxNumber')}</p>
                <p className="font-mono text-lg bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent font-semibold">4706086543</p>
              </div>
              <div className="modern-card p-6">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">{t('registrationNumber')}</p>
                <p className="font-mono text-lg bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent font-semibold">1254700002831</p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-6 fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-slate-900 dark:text-white font-bold text-xl">{t('followUs')}</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modern-card p-4 hover:shadow-md transition-all duration-300 transform hover:scale-110 group"
                >
                  <social.icon className="h-6 w-6 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 text-center fade-in-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © 2024 <span className="font-medium bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Volga Services</span>. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};
