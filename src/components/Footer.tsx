import React from 'react';
import { Phone, Mail, MapPin, Globe, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Footer: React.FC = () => {
  const whatsappUrl = 'https://wa.me/79522212903';

  const contactInfo = [
    { icon: Phone, label: 'Phone', value: '+7 952 221 29 03', href: 'tel:+79522212903' },
    { icon: Mail, label: 'Email', value: 'info@volgaservices.com', href: 'mailto:info@volgaservices.com' },
    { icon: Globe, label: 'Website', value: 'volgaservices.com', href: 'https://www.volgaservices.com' },
    { icon: MapPin, label: 'Location', value: 'St. Petersburg, Russia', href: '#' },
  ];

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61574150824169' },
    { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/volga.services/' },
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png"
                alt="Volga Services"
                className="w-12 h-12"
              />
              <div>
                <h3 className="font-serif font-bold text-xl text-background">Volga Services</h3>
                <p className="text-background/60 text-xs uppercase tracking-wider">Premium Tourism</p>
              </div>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              Your trusted partner for premium travel experiences across Russia. Unforgettable journeys, exceptional service.
            </p>
            <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </Button>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h4 className="font-semibold text-background text-base">Contact</h4>
            <ul className="space-y-3">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <item.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  {item.href !== '#' ? (
                    <a href={item.href} className="text-background/80 text-sm hover:text-background transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-background/80 text-sm">{item.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Business Info */}
          <div className="space-y-5">
            <h4 className="font-semibold text-background text-base">Business Info</h4>
            <div className="space-y-4">
              <div>
                <p className="text-background/50 text-xs uppercase tracking-wide mb-1">Tax Number (INN)</p>
                <p className="text-background font-mono text-sm">4706086543</p>
              </div>
              <div>
                <p className="text-background/50 text-xs uppercase tracking-wide mb-1">Registration (OGRN)</p>
                <p className="text-background font-mono text-sm">1254700002831</p>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-5">
            <h4 className="font-semibold text-background text-base">Follow Us</h4>
            <div className="flex gap-3">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-background/10 mt-10 pt-6 text-center">
          <p className="text-background/60 text-sm">
            © {new Date().getFullYear()} <span className="text-background font-medium">Volga Services</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
