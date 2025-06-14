
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
      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300 transform hover:scale-105 overflow-hidden group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img 
          src={service.image} 
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
          <div className="bg-volga-logo-blue/80 backdrop-blur-sm rounded-full p-2">
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
              className="border-volga-logo-red/50 text-white bg-volga-logo-red/20 text-xs sm:text-sm"
            >
              {feature}
            </Badge>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            onClick={handleBookNow}
            className="flex-1 bg-volga-logo-red hover:bg-red-700 text-white text-sm sm:text-base"
          >
            {t('bookNow')}
          </Button>
          <Button
            onClick={handleLearnMore}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10 text-sm sm:text-base"
          >
            {t('learnMore')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
