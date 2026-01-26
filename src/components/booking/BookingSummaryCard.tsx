import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Car, 
  Building2, 
  Ticket, 
  UserCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  Users,
  DollarSign,
  LucideIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ServiceDetails } from '@/types/booking';

interface BookingSummaryCardProps {
  selectedServices: string[];
  serviceDetailsMap: Record<string, ServiceDetails>;
}

// Icon mapping by service type
const SERVICE_ICONS: Record<string, LucideIcon> = {
  'Driver': Car,
  'Accommodation': Building2,
  'Events': Ticket,
  'Guide': UserCheck
};

// Service titles for i18n
const SERVICE_TITLES: Record<string, string> = {
  'Driver': 'services.driver',
  'Accommodation': 'services.accommodation',
  'Events': 'services.events',
  'Guide': 'services.guide'
};

export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  selectedServices,
  serviceDetailsMap
}) => {
  const { t } = useLanguage();

  if (selectedServices.length === 0) {
    return null;
  }

  const renderServiceSummary = (serviceType: string) => {
    const details = serviceDetailsMap[serviceType] as any;
    if (!details || Object.keys(details).length === 0) return null;

    switch (serviceType) {
      case 'Driver':
        return (
          <div className="space-y-1.5 text-sm">
            {details.pickupLocation && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{details.pickupLocation} → {details.dropoffLocation}</span>
              </div>
            )}
            {details.pickupDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{details.pickupDate} {details.pickupTime && `at ${details.pickupTime}`}</span>
              </div>
            )}
            {details.vehicleType && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-3.5 w-3.5" />
                <span>{details.vehicleType}</span>
              </div>
            )}
          </div>
        );

      case 'Accommodation':
        return (
          <div className="space-y-1.5 text-sm">
            {details.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{details.location}</span>
              </div>
            )}
            {details.checkIn && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{details.checkIn} - {details.checkOut}</span>
              </div>
            )}
            {details.guests && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{details.guests} {t('booking.guests')}</span>
              </div>
            )}
          </div>
        );

      case 'Events':
        return (
          <div className="space-y-1.5 text-sm">
            {details.eventType && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Ticket className="h-3.5 w-3.5" />
                <span className="capitalize">{details.eventType}</span>
              </div>
            )}
            {details.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{details.location}</span>
              </div>
            )}
            {details.date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{details.date}</span>
              </div>
            )}
          </div>
        );

      case 'Guide':
        return (
          <div className="space-y-1.5 text-sm">
            {details.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{details.location}</span>
              </div>
            )}
            {details.date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{details.date}</span>
              </div>
            )}
            {details.duration && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{details.duration} {t('booking.hours')}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-primary" />
          {t('booking.bookingSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Services List */}
        <div className="space-y-3">
          {selectedServices.map((serviceType, index) => {
            const Icon = SERVICE_ICONS[serviceType] || Car;
            const titleKey = SERVICE_TITLES[serviceType];
            
            return (
              <div key={serviceType}>
                {index > 0 && <Separator className="my-3" />}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-foreground text-sm">
                      {titleKey ? t(titleKey) : serviceType}
                    </span>
                  </div>
                  {renderServiceSummary(serviceType)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Notice */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{t('booking.totalPrice')}</span>
            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/50">
              {t('booking.awaitingAdminPricing')}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('booking.pricingNote')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
