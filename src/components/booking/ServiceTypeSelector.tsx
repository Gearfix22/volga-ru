import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Building2, Ticket, UserCheck, DollarSign, LucideIcon, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getServices, getPricingText, type ServiceData } from '@/services/servicesService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ServiceTypeSelectorProps {
  serviceType: string;
  onSelectService: (serviceType: string) => void;
  preSelected?: boolean;
}

// Icon mapping by service type
const SERVICE_ICONS: Record<string, LucideIcon> = {
  'Driver': Car,
  'Accommodation': Building2,
  'Events': Ticket,
  'Guide': UserCheck
};

// Translation key mapping
const SERVICE_TRANSLATION_KEYS: Record<string, { label: string; description: string }> = {
  'Driver': { label: 'booking.driverOnlyBooking', description: 'booking.driverOnlyDesc' },
  'Accommodation': { label: 'booking.accommodationBooking', description: 'booking.accommodationDesc' },
  'Events': { label: 'booking.eventsEntertainment', description: 'booking.eventsDesc' },
  'Guide': { label: 'booking.guideService', description: 'booking.guideDesc' }
};

export const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({
  serviceType,
  onSelectService,
  preSelected = false
}) => {
  const { t } = useLanguage();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getServices();
        
        // Group services by type - only show one card per type
        const uniqueTypes = new Map<string, ServiceData>();
        data.forEach(service => {
          if (!uniqueTypes.has(service.type)) {
            uniqueTypes.set(service.type, service);
          }
        });
        
        setServices(Array.from(uniqueTypes.values()));
      } catch (err) {
        console.error('Failed to load services:', err);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  if (preSelected) {
    return null;
  }

  if (loading) {
    return (
      <Card className="coastal-glass border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5 text-coastal-blue" />
            {t('booking.selectServiceType')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="coastal-glass border-white/10">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (services.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('booking.noServicesAvailable')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="coastal-glass border border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5 text-coastal-blue" />
          {t('booking.selectServiceType')}
        </CardTitle>
        <CardDescription className="text-coastal-pearl">
          {t('booking.chooseServiceYouNeed')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((service) => {
            const Icon = SERVICE_ICONS[service.type] || Car;
            const translationKeys = SERVICE_TRANSLATION_KEYS[service.type];
            const label = translationKeys ? t(translationKeys.label) : service.name;
            const description = translationKeys ? t(translationKeys.description) : service.description;
            const pricing = getPricingText(service);
            const hasFixedPrice = service.base_price !== null && service.base_price > 0;

            return (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-105 ${
                  serviceType === service.type 
                    ? 'ring-2 ring-brand-primary bg-brand-primary/10 shadow-glow border-brand-primary/50' 
                    : 'coastal-glass hover:bg-white/10 border-white/10'
                }`}
                onClick={() => onSelectService(service.type)}
                role="button"
                tabIndex={0}
                aria-label={`Select ${label} service`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectService(service.type);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${
                        serviceType === service.type 
                          ? 'bg-brand-primary text-white' 
                          : 'bg-white/10 text-coastal-blue'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-lg text-white">{label}</h3>
                    </div>
                    
                    <p className="text-sm text-coastal-pearl leading-relaxed line-clamp-2">
                      {description}
                    </p>
                    
                    {service.features && service.features.length > 0 && (
                      <div className="space-y-1">
                        {service.features.slice(0, 4).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-coastal-sage">
                            <div className="w-1.5 h-1.5 bg-coastal-blue rounded-full" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Badge 
                      variant={hasFixedPrice ? "default" : "secondary"} 
                      className={`w-fit mt-2 ${hasFixedPrice ? 'bg-green-600' : 'bg-amber-600'}`}
                    >
                      {pricing}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};