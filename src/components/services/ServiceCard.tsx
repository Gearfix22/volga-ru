
import React from 'react';
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
  const Icon = service.icon;

  const handleBookNow = () => {
    console.log(`Booking service: ${service.id}`);
    // TODO: Implement booking functionality
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
      <div className="relative h-48 overflow-hidden">
        <img 
          src={service.image} 
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <div className="bg-volga-logo-blue/80 backdrop-blur-sm rounded-full p-2">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">
          {service.title}
        </CardTitle>
        <CardDescription className="text-gray-200">
          {service.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {service.features.map((feature, featureIndex) => (
            <Badge 
              key={featureIndex}
              variant="outline" 
              className="border-volga-logo-red/50 text-white bg-volga-logo-red/20"
            >
              {feature}
            </Badge>
          ))}
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleBookNow}
            className="flex-1 bg-volga-logo-red hover:bg-red-700 text-white"
          >
            {t('bookNow')}
          </Button>
          <Button
            onClick={handleLearnMore}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            {t('learnMore')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
