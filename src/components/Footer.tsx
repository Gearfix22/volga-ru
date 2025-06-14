
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
    <footer className="relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-gray-950 to-background" />
      <div className="absolute inset-0 holographic opacity-20" />
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-bold text-2xl font-crimson text-gradient mb-4">
                Volga Services
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed font-space-grotesk">
                {t('footerDescription')}
              </p>
            </div>
            
            {/* WhatsApp Button */}
            <Button
              asChild
              className="group glassmorphism border-green-500/30 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-space-grotesk"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-green-400" />
                <span>{t('whatsapp')}</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </Button>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <h3 className="text-white font-bold text-xl font-crimson">{t('contactInfo')}</h3>
            <div className="space-y-6">
              {contactInfo.map((item, index) => (
                <div key={index} className="group glassmorphism p-4 rounded-xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <item.icon className="h-4 w-4 text-purple-400 group-hover:text-pink-400 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide font-space-grotesk">{item.label}</p>
                      {item.href === '#' ? (
                        <p className="text-gray-300 text-sm font-light font-space-grotesk">{item.value}</p>
                      ) : (
                        <a 
                          href={item.href}
                          className="text-gray-300 hover:text-white text-sm transition-colors font-light hover:underline font-space-grotesk"
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
          <div className="space-y-8">
            <h3 className="text-white font-bold text-xl font-crimson">{t('businessInfo')}</h3>
            <div className="space-y-4">
              <div className="glassmorphism p-6 rounded-xl morphing-border">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 font-space-grotesk">{t('taxNumber')}</p>
                <p className="font-mono text-lg text-gradient">4706086543</p>
              </div>
              <div className="glassmorphism p-6 rounded-xl morphing-border">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 font-space-grotesk">{t('registrationNumber')}</p>
                <p className="font-mono text-lg text-gradient">1254700002831</p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-8">
            <h3 className="text-white font-bold text-xl font-crimson">{t('followUs')}</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glassmorphism p-4 rounded-xl transition-all duration-500 transform hover:scale-110 hover:rotate-3"
                >
                  <social.icon className="h-6 w-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-16 pt-8 text-center">
          <p className="text-gray-500 text-sm font-space-grotesk">
            © 2024 <span className="font-medium text-gradient">Volga Services</span>. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};
