import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Check } from 'lucide-react';
import { ServiceData, getLocalizedServiceName, getLocalizedServiceDescription } from '@/services/servicesService';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServiceCardProps {
  service: ServiceData;
  icon: LucideIcon;
  pricing: string;
  index: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, icon: Icon, pricing, index }) => {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();

  const handleBookNow = () => {
    // Navigate to unified booking page with service type
    navigate(`/enhanced-booking?service=${encodeURIComponent(service.type)}`);
  };

  // Price is "fixed" if service has a base_price set in the database
  const hasFixedPrice = service.base_price !== null && service.base_price > 0;

  // Get localized name and description from service data
  const localizedName = getLocalizedServiceName(service, language);
  const localizedDescription = getLocalizedServiceDescription(service, language);

  // Fallback image for services without custom images
  const defaultImage = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop';

  return (
    <Card 
      className={`bg-card/80 backdrop-blur-sm border hover:bg-card/90 active:bg-card/95 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden group h-full flex flex-col shadow-lg hover:shadow-2xl touch-manipulation ${isRTL ? 'rtl' : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative h-40 lg:h-48 overflow-hidden">
        <img 
          src={service.image_url || defaultImage} 
          alt={localizedName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'}`}>
          <div className="bg-primary/90 backdrop-blur-sm rounded-full p-2">
            <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
          </div>
        </div>
        <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
          <Badge 
            variant={hasFixedPrice ? "default" : "secondary"} 
            className={hasFixedPrice ? 'bg-green-600 text-white' : 'bg-amber-600 text-white'}
          >
            {pricing}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="p-4 lg:p-6 flex-grow">
        <CardTitle className="text-lg lg:text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
          {localizedName}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm lg:text-base leading-relaxed line-clamp-3">
          {localizedDescription}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4 lg:p-6 pt-0 mt-auto">
        {service.features && service.features.length > 0 && (
          <div className="space-y-2">
            {service.features.slice(0, 4).map((feature, featureIndex) => (
              <div key={featureIndex} className={`flex items-center text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Check className={`h-4 w-4 text-green-500 ${isRTL ? 'ml-2' : 'mr-2'} flex-shrink-0`} />
                <span className="line-clamp-1">{feature}</span>
              </div>
            ))}
          </div>
        )}
        
        <Button
          onClick={handleBookNow}
          className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground text-sm lg:text-base py-3 min-h-[48px] shadow-md hover:shadow-lg transition-all touch-manipulation"
        >
          {t('common.selectService')}
        </Button>
      </CardContent>
    </Card>
  );
};
