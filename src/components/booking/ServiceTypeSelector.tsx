import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Building2, Ticket, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SERVICE_PRICING } from '@/types/booking';

interface ServiceTypeSelectorProps {
  serviceType: string;
  onSelectService: (serviceId: string) => void;
  preSelected?: boolean;
}

export const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({
  serviceType,
  onSelectService,
  preSelected = false
}) => {
  const { t } = useLanguage();

  if (preSelected) {
    return null;
  }

  const services = [
    {
      id: 'Driver',
      labelKey: 'booking.driverOnlyBooking',
      icon: Car,
      descriptionKey: 'booking.driverOnlyDesc',
      features: [
        'booking.oneWayOrRoundTrip',
        'booking.professionalDrivers',
        'booking.airportTransfers',
        'booking.cityTransportation'
      ],
      pricing: `${t('booking.fromPrice', { price: SERVICE_PRICING.Driver.basePrice })}`,
      hasFixedPrice: true
    },
    {
      id: 'Accommodation',
      labelKey: 'booking.accommodationBooking',
      icon: Building2,
      descriptionKey: 'booking.accommodationDesc',
      features: [
        'booking.hotelsResorts',
        'booking.apartments',
        'booking.guestHouses',
        'booking.customRequests'
      ],
      pricing: t('booking.priceSetByAdmin'),
      hasFixedPrice: false
    },
    {
      id: 'Events',
      labelKey: 'booking.eventsEntertainment',
      icon: Ticket,
      descriptionKey: 'booking.eventsDesc',
      features: [
        'booking.circusShows',
        'booking.museumsParks',
        'booking.cityTours',
        'booking.cableCarsOpera'
      ],
      pricing: t('booking.priceSetByAdmin'),
      hasFixedPrice: false
    }
  ];

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
          {services.map(({ id, labelKey, icon: Icon, descriptionKey, features, pricing, hasFixedPrice }) => (
            <Card
              key={id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-105 ${
                serviceType === id 
                  ? 'ring-2 ring-brand-primary bg-brand-primary/10 shadow-glow border-brand-primary/50' 
                  : 'coastal-glass hover:bg-white/10 border-white/10'
              }`}
              onClick={() => onSelectService(id)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${t(labelKey)} service`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectService(id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      serviceType === id 
                        ? 'bg-brand-primary text-white' 
                        : 'bg-white/10 text-coastal-blue'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-white">{t(labelKey)}</h3>
                  </div>
                  
                  <p className="text-sm text-coastal-pearl leading-relaxed">
                    {t(descriptionKey)}
                  </p>
                  
                  <div className="space-y-1">
                    {features.map((featureKey, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-coastal-sage">
                        <div className="w-1.5 h-1.5 bg-coastal-blue rounded-full" />
                        {t(featureKey)}
                      </div>
                    ))}
                  </div>
                  
                  <Badge 
                    variant={hasFixedPrice ? "default" : "secondary"} 
                    className={`w-fit mt-2 ${hasFixedPrice ? 'bg-green-600' : 'bg-amber-600'}`}
                  >
                    {pricing}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
