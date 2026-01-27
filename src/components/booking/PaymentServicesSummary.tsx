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
  User,
  Mail,
  Phone,
  DollarSign,
  CheckCircle,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ServiceDetails, UserInfo } from '@/types/booking';

interface PaymentServicesSummaryProps {
  selectedServices: string[];
  serviceDetailsMap: Record<string, ServiceDetails>;
  userInfo: UserInfo;
  initialPrice?: number;
  finalPrice: number;
  currency?: string;
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

export const PaymentServicesSummary: React.FC<PaymentServicesSummaryProps> = ({
  selectedServices,
  serviceDetailsMap,
  userInfo,
  initialPrice = 0,
  finalPrice,
  currency = 'USD'
}) => {
  const { t, isRTL } = useLanguage();

  const renderServiceDetails = (serviceType: string) => {
    const details = serviceDetailsMap[serviceType] as any;
    if (!details || Object.keys(details).length === 0) {
      return <p className="text-xs text-muted-foreground italic">{t('booking.noDetailsProvided')}</p>;
    }

    switch (serviceType) {
      case 'Driver':
        return (
          <div className="space-y-1 text-sm">
            {details.pickupLocation && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{details.pickupLocation} → {details.dropoffLocation}</span>
              </div>
            )}
            {details.pickupDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{details.pickupDate} {details.pickupTime && `at ${details.pickupTime}`}</span>
              </div>
            )}
            {details.vehicleType && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-3.5 w-3.5 shrink-0" />
                <span>{details.vehicleType}</span>
              </div>
            )}
            {details.passengers && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>{details.passengers} {t('booking.passengers')}</span>
              </div>
            )}
          </div>
        );

      case 'Accommodation':
        return (
          <div className="space-y-1 text-sm">
            {details.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{details.location}</span>
              </div>
            )}
            {details.checkIn && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{details.checkIn} - {details.checkOut}</span>
              </div>
            )}
            {details.guests && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>{details.guests} {t('booking.guests')}</span>
              </div>
            )}
            {details.roomType && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>{details.roomType}</span>
              </div>
            )}
          </div>
        );

      case 'Events':
        return (
          <div className="space-y-1 text-sm">
            {details.eventType && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Ticket className="h-3.5 w-3.5 shrink-0" />
                <span className="capitalize">{details.eventType}</span>
              </div>
            )}
            {details.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{details.location}</span>
              </div>
            )}
            {details.date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{details.date}</span>
              </div>
            )}
            {details.tickets && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>{details.tickets} {t('booking.tickets')}</span>
              </div>
            )}
          </div>
        );

      case 'Guide':
        return (
          <div className="space-y-1 text-sm">
            {details.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{details.location}</span>
              </div>
            )}
            {details.date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{details.date}</span>
              </div>
            )}
            {details.duration && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{details.duration} {t('booking.hours')}</span>
              </div>
            )}
            {details.language && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCheck className="h-3.5 w-3.5 shrink-0" />
                <span>{details.language}</span>
              </div>
            )}
          </div>
        );

      default:
        // Generic display for dynamic service types
        return (
          <div className="space-y-1 text-sm">
            {Object.entries(details)
              .filter(([key]) => !key.startsWith('_'))
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="truncate">{String(value)}</span>
                </div>
              ))}
          </div>
        );
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CheckCircle className="h-6 w-6 text-green-600" />
          {t('payment.bookingSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Information (Read-only from profile) */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('booking.contactInformation')}
          </p>
          <div className="grid grid-cols-1 gap-2 bg-muted/50 p-3 rounded-lg">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{userInfo.fullName || t('common.notProvided')}</span>
            </div>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{userInfo.email || t('common.notProvided')}</span>
            </div>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-mono">{userInfo.phone || t('common.notProvided')}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Selected Services with Details */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('booking.selectedServices')} ({selectedServices.length})
          </p>
          
          {selectedServices.map((serviceType, index) => {
            const Icon = SERVICE_ICONS[serviceType] || Ticket;
            const titleKey = SERVICE_TITLES[serviceType];
            
            return (
              <div key={serviceType} className="space-y-2">
                {index > 0 && <Separator className="my-2" />}
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-foreground">
                    {titleKey ? t(titleKey) : serviceType}
                  </span>
                </div>
                <div className="pl-8">
                  {renderServiceDetails(serviceType)}
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Pricing Comparison */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('payment.pricingDetails')}
          </p>
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            {/* Initial Price */}
            {initialPrice > 0 && (
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm text-muted-foreground">{t('booking.initialEstimate')}:</span>
                <span className="text-sm line-through text-muted-foreground">
                  ${initialPrice.toFixed(2)}
                </span>
              </div>
            )}
            
            {/* Final Approved Price */}
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="font-medium text-foreground">{t('payment.finalApprovedPrice')}:</span>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Badge variant="default" className="bg-green-600 text-white">
                  {t('payment.approved')}
                </Badge>
                <span className="text-xl font-bold text-primary">
                  ${finalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Price difference indicator */}
            {initialPrice > 0 && initialPrice !== finalPrice && (
              <div className={`flex items-center gap-2 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className={`${finalPrice < initialPrice ? 'text-green-600' : 'text-amber-600'}`}>
                  {finalPrice < initialPrice 
                    ? t('payment.discountApplied', { amount: `$${(initialPrice - finalPrice).toFixed(2)}` })
                    : t('payment.adjustedPrice')
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
