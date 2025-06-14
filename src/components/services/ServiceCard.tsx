
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  service: {
    id: string;
    category: string;
    title: string;
    description: string;
    icon: LucideIcon;
    image: string;
    features: string[];
  };
  index: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, index }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const Icon = service.icon;

  const handleBookNow = () => {
    console.log(`Navigating to booking page for service: ${service.id}`);
    navigate('/booking');
  };

  const handleLearnMore = () => {
    console.log(`Learning more about: ${service.id}`);
    // TODO: Navigate to service details page
  };

  return (
    <Card 
      className="glass-morphism text-white hover-glass overflow-hidden group border-0 rounded-3xl"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-3xl">
        <img 
          src={service.image} 
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
          <div className="liquid-glass rounded-2xl p-3 hover-glass">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
      </div>
      
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl font-bold text-white">
          {service.title}
        </CardTitle>
        <CardDescription className="text-gray-200 text-sm sm:text-base">
          {service.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {service.features.map((feature, featureIndex) => (
            <Badge 
              key={featureIndex}
              variant="outline" 
              className="liquid-glass border-0 text-white text-xs sm:text-sm rounded-xl px-3 py-1"
            >
              {feature}
            </Badge>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            onClick={handleBookNow}
            className="flex-1 liquid-glass-button text-white text-sm sm:text-base rounded-xl border-0 relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span className="relative z-10">{t('bookNow')}</span>
          </Button>
          <Button
            onClick={handleLearnMore}
            variant="outline"
            className="flex-1 liquid-glass border-0 text-white hover:text-white text-sm sm:text-base rounded-xl"
          >
            {t('learnMore')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
