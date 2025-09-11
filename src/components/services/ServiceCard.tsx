
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
    navigate(`/enhanced-booking?service=${serviceType}`);
  };

  return (
    <Card 
      className="bg-card/80 backdrop-blur-sm border hover:bg-card/90 transition-all duration-500 transform hover:scale-105 overflow-hidden group h-full flex flex-col shadow-lg hover:shadow-2xl"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative h-40 lg:h-48 overflow-hidden">
        <img 
          src={service.image} 
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <div className="bg-brand-primary/90 backdrop-blur-sm rounded-full p-2">
            <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-brand-primary-foreground" />
          </div>
        </div>
      </div>
      
      <CardHeader className="p-4 lg:p-6 flex-grow">
        <CardTitle className="text-lg lg:text-xl font-bold text-foreground leading-tight group-hover:text-brand-primary transition-colors">
          {service.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm lg:text-base leading-relaxed">
          {service.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4 lg:p-6 pt-0 mt-auto">
        <div className="space-y-2">
          {service.features.slice(0, 3).map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-center text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mr-2 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
        
        <Button
          onClick={handleBookNow}
          className="w-full bg-brand-secondary hover:bg-brand-secondary/90 text-brand-secondary-foreground text-sm lg:text-base py-2.5 shadow-lg hover:shadow-xl transition-all group-hover:scale-105"
        >
          {t('common.bookNow')}
        </Button>
      </CardContent>
    </Card>
  );
};
