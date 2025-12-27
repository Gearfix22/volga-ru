import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Globe, Facebook, Instagram, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { language } = useLanguage();

  const whatsappNumber = '+79522212903';
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\+/g, '')}`;

  const contactInfo = [
    {
      icon: Phone,
      label: 'Phone',
      value: '+7 952 221 29 03',
      href: `tel:${whatsappNumber}`,
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'info@volgaservices.com',
      href: 'mailto:info@volgaservices.com',
    },
    {
      icon: Globe,
      label: 'Website',
      value: 'www.volgaservices.com',
      href: 'https://www.volgaservices.com',
    },
    {
      icon: MapPin,
      label: 'Address',
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
      href: 'https://www.instagram.com/volga.services/',
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-t border-white/10">
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-white font-bold text-xl sm:text-2xl mb-3 sm:mb-4 font-serif"
                  style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)' }}>
                Volga Services
              </h3>
              <p className="text-white/90 text-sm leading-relaxed"
                 style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
                Premium travel and tourism services in Russia. Your trusted partner for unforgettable experiences.
              </p>
            </div>
            
            {/* WhatsApp Button */}
            <Button
              asChild
              className="bg-[#25D366] hover:bg-[#20BA5A] text-white w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-white"
            >
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center"
                aria-label="Open WhatsApp chat with Volga Services"
              >
                <Phone className="h-4 w-4 mr-2" aria-hidden="true" />
                Chat on WhatsApp
              </a>
            </Button>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-white font-bold text-lg sm:text-xl"
                style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)' }}>Contact Information</h3>
            <div className="space-y-3 sm:space-y-4">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white/70 text-xs font-medium uppercase"
                       style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>{item.label}</p>
                    {item.href === '#' ? (
                      <p className="text-white text-sm break-words"
                         style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>{item.value}</p>
                    ) : (
                      <a 
                        href={item.href}
                        className="text-white hover:text-white/80 text-sm transition-colors break-words"
                        style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
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
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-white font-bold text-lg sm:text-xl"
                style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)' }}>Business Information</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase"
                   style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>Tax Number</p>
                <p className="text-white font-mono text-base sm:text-lg font-semibold"
                   style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>4706086543</p>
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase"
                   style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>Registration Number</p>
                <p className="text-white font-mono text-base sm:text-lg font-semibold"
                   style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>1254700002831</p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-white font-bold text-lg sm:text-xl"
                style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)' }}>Follow Us</h3>
            <div className="flex space-x-3 sm:space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur-sm p-2 sm:p-3 rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  <social.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/90 text-sm text-center sm:text-left"
               style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
              © 2024 <span className="text-white font-semibold">Volga Services</span>. All Rights Reserved.
            </p>
            <Link 
              to="/privacy-policy" 
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors"
            >
              <Shield className="h-4 w-4" />
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
