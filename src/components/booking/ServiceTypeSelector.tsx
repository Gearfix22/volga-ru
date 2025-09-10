
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Building2, Calendar, MapPin, Plane, Ship, Train, Music } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
       id: 'Transportation',
       label: t('transportation'),
       icon: Car,
       description: t('transportationDescription'),
       features: [t('airportPickup'), t('cityTransportation'), t('privateDrivers'), t('groupTransport')]
     },
     {
       id: 'Hotels',
       label: t('hotelReservation'),
       icon: Building2,
       description: t('hotelsDescription'),
       features: [t('hotelReservations'), t('roomSelection'), t('specialRequests'), t('groupBookings')]
     },
     {
       id: 'Events',
       label: t('eventBooking'),
       icon: Calendar,
       description: t('eventsDescription'),
       features: [t('concertTickets'), t('culturalEvents'), t('sportsEvents'), t('vipAccess')]
     },
     {
       id: 'Custom Trips',
       label: t('customTrip'),
       icon: MapPin,
       description: t('customTripsDescription'),
       features: [t('customItineraries'), t('multiDestination'), t('localExperiences'), t('adventureTours')]
     }
   ];

  return (
    <Card className="coastal-glass border border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Plane className="h-5 w-5 text-coastal-blue" />
          {t('selectServiceType')}
        </CardTitle>
        <CardDescription className="text-coastal-pearl">
          {t('chooseServiceYouNeed')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(({ id, label, icon: Icon, description, features }) => (
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
              aria-label={`Select ${label} service`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectService(id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    serviceType === id 
                      ? 'bg-brand-primary text-white' 
                      : 'bg-white/10 text-coastal-blue'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-white">{label}</h3>
                    <p className="text-sm text-coastal-pearl mb-3 leading-relaxed">
                      {description}
                    </p>
                    <div className="space-y-1">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-coastal-sage">
                          <div className="w-1.5 h-1.5 bg-coastal-blue rounded-full" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
