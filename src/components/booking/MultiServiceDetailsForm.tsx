import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Building2, Ticket, UserCheck, LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServiceDetailsForm } from './ServiceDetailsForm';
import type { ServiceDetails } from '@/types/booking';

interface MultiServiceDetailsFormProps {
  selectedServices: string[];
  serviceDetailsMap: Record<string, ServiceDetails>;
  onUpdateServiceDetail: (serviceType: string, key: string, value: string | string[]) => void;
  serviceIdMap: Record<string, string | null>;
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
  'Driver': 'booking.driverDetails',
  'Accommodation': 'booking.accommodationDetails',
  'Events': 'booking.eventsDetails',
  'Guide': 'booking.guideDetails'
};

export const MultiServiceDetailsForm: React.FC<MultiServiceDetailsFormProps> = ({
  selectedServices,
  serviceDetailsMap,
  onUpdateServiceDetail,
  serviceIdMap
}) => {
  const { t } = useLanguage();

  if (selectedServices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-foreground">{t('booking.fillServiceDetails')}</h3>
      
      {selectedServices.map((serviceType, index) => {
        const Icon = SERVICE_ICONS[serviceType] || Car;
        const titleKey = SERVICE_TITLES[serviceType] || 'booking.serviceDetails';
        const serviceDetails = serviceDetailsMap[serviceType] || {};
        const serviceId = serviceIdMap[serviceType] || null;

        return (
          <Card key={serviceType} className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span>{t(titleKey)}</span>
                <Badge variant="outline" className="ml-auto">
                  {index + 1} / {selectedServices.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceDetailsForm
                serviceType={serviceType}
                serviceDetails={serviceDetails}
                onUpdateDetail={(key, value) => onUpdateServiceDetail(serviceType, key, value)}
                serviceId={serviceId}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
