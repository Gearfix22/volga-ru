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
  User,
  Mail,
  Phone,
  LucideIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServices } from '@/hooks/useServices';
import type { ServiceDetails, UserInfo } from '@/types/booking';
import type { ServiceData } from '@/services/servicesService';

interface BookingSummaryCardProps {
  selectedServices: string[];
  serviceDetailsMap: Record<string, ServiceDetails>;
  serviceDataMap?: Record<string, ServiceData>;
  userInfo?: UserInfo;
  showUserInfo?: boolean;
}

// Icon mapping by service type - extensible for new types
const SERVICE_ICONS: Record<string, LucideIcon> = {
  'Driver': Car,
  'Transportation': Car,
  'Accommodation': Building2,
  'Hotels': Building2,
  'Events': Ticket,
  'Events & Entertainment': Ticket,
  'Guide': UserCheck,
  'Custom Trips': UserCheck
};

export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  selectedServices,
  serviceDetailsMap,
  serviceDataMap,
  userInfo,
  showUserInfo = false
}) => {
  const { t } = useLanguage();
  const { getServiceName } = useServices();

  if (selectedServices.length === 0) {
    return null;
  }

  // Calculate estimated total from initial prices
  const estimatedTotal = serviceDataMap 
    ? selectedServices.reduce((sum, type) => {
        const service = serviceDataMap[type];
        return sum + (service?.base_price || 0);
      }, 0)
    : 0;

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
        {/* User Info Section (read-only) */}
        {showUserInfo && userInfo && (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('booking.contactInformation')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{userInfo.fullName || t('common.notProvided')}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{userInfo.email || t('common.notProvided')}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded sm:col-span-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{userInfo.phone || t('common.notProvided')}</span>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Services List */}
        <div className="space-y-3">
          {selectedServices.map((serviceType, index) => {
            const Icon = SERVICE_ICONS[serviceType] || Car;
            const serviceData = serviceDataMap?.[serviceType];
            const basePrice = serviceData?.base_price;
            // Use shared hook for consistent service name resolution
            const serviceName = getServiceName(serviceType);
            
            return (
              <div key={serviceType}>
                {index > 0 && <Separator className="my-3" />}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-foreground text-sm">
                        {serviceName}
                      </span>
                    </div>
                    {basePrice && basePrice > 0 && (
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        ${basePrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {renderServiceSummary(serviceType)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Section */}
        <div className="pt-3 border-t border-border space-y-2">
          {/* Initial Price Estimate */}
          {estimatedTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('booking.initialEstimate')}:</span>
              <span className="font-medium">${estimatedTotal.toFixed(2)}</span>
            </div>
          )}
          
          {/* Final Price Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{t('booking.finalPrice')}:</span>
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
