
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

  const getServiceTypeFromCategory = (category: string) => {
    switch (category) {
      case 'transportation':
        return 'transportation';
      case 'hotels':
        return 'hotel';
      case 'events':
        return 'event';
      case 'customTrips':
        return 'trip';
      default:
        return 'transportation';
    }
  };

  const handleBookNow = () => {
    const serviceType = getServiceTypeFromCategory(service.category);
    console.log(`Navigating to booking page for service: ${service.id} with type: ${serviceType}`);
    navigate(`/booking?service=${serviceType}`);
  };

  return (
    <Card 
      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 overflow-hidden group h-full flex flex-col"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden">
        <img 
          src={service.image} 
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4">
          <div className="bg-volga-logo-blue/80 backdrop-blur-sm rounded-full p-1.5 sm:p-2">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
          </div>
        </div>
      </div>
      
      <CardHeader className="p-3 sm:p-4 lg:p-6 flex-grow">
        <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-white leading-tight">
          {service.title}
        </CardTitle>
        <CardDescription className="text-gray-200 text-xs sm:text-sm lg:text-base leading-relaxed">
          {service.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6 pt-0 mt-auto">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {service.features.map((feature, featureIndex) => (
            <Badge 
              key={featureIndex}
              variant="outline" 
              className="border-volga-logo-red/50 text-white bg-volga-logo-red/20 text-xs leading-tight px-2 py-1"
            >
              {feature}
            </Badge>
          ))}
        </div>
        
        <div className="pt-2 sm:pt-4">
          <Button
            onClick={handleBookNow}
            className="w-full bg-volga-logo-red hover:bg-red-700 text-white text-xs sm:text-sm lg:text-base py-2 sm:py-2.5"
          >
            {t('bookNow')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
