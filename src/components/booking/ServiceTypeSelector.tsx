
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
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          {t('selectServiceType')}
        </CardTitle>
        <CardDescription>{t('chooseServiceYouNeed')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(({ id, label, icon: Icon, description, features }) => (
            <Card
              key={id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                serviceType === id 
                  ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              onClick={() => onSelectService(id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    serviceType === id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{label}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {description}
                    </p>
                    <div className="space-y-1">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-slate-500">
                          <div className="w-1 h-1 bg-slate-400 rounded-full" />
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
