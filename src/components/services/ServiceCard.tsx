import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Check } from 'lucide-react';
import { ServiceData } from '@/services/servicesService';

interface ServiceCardProps {
  service: ServiceData;
  icon: LucideIcon;
  pricing: string;
  index: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, icon: Icon, pricing, index }) => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    // Navigate with service type for booking flow
    navigate(`/enhanced-booking?service=${service.type}`);
  };

  const hasFixedPrice = service.type === 'Driver';

  return (
    <Card 
      className="bg-card/80 backdrop-blur-sm border hover:bg-card/90 transition-all duration-500 transform hover:scale-105 overflow-hidden group h-full flex flex-col shadow-lg hover:shadow-2xl"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative h-40 lg:h-48 overflow-hidden">
        <img 
          src={service.image_url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'} 
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <div className="bg-brand-primary/90 backdrop-blur-sm rounded-full p-2">
            <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-brand-primary-foreground" />
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <Badge 
            variant={hasFixedPrice ? "default" : "secondary"} 
            className={hasFixedPrice ? 'bg-green-600 text-white' : 'bg-amber-600 text-white'}
          >
            {pricing}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="p-4 lg:p-6 flex-grow">
        <CardTitle className="text-lg lg:text-xl font-bold text-foreground leading-tight group-hover:text-brand-primary transition-colors">
          {service.name}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm lg:text-base leading-relaxed">
          {service.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4 lg:p-6 pt-0 mt-auto">
        <div className="space-y-2">
          {service.features.slice(0, 4).map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-center text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
        
        <Button
          onClick={handleBookNow}
          className="w-full bg-brand-secondary hover:bg-brand-secondary/90 text-brand-secondary-foreground text-sm lg:text-base py-2.5 shadow-lg hover:shadow-xl transition-all group-hover:scale-105"
        >
          Book Now
        </Button>
      </CardContent>
    </Card>
  );
};
