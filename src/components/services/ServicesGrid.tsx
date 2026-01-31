import React from 'react';
import { ServiceCard } from './ServiceCard';
import { Car, Building2, Ticket, UserCheck, LucideIcon, Loader2 } from 'lucide-react';
import { getPricingText } from '@/services/servicesService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServices } from '@/hooks/useServices';

interface ServicesGridProps {
  activeCategory: string;
}

// Icon mapping - extensible for new service types
const ICONS: Record<string, LucideIcon> = {
  'Driver': Car,
  'Transportation': Car,
  'Accommodation': Building2,
  'Hotels': Building2,
  'Events': Ticket,
  'Events & Entertainment': Ticket,
  'Guide': UserCheck,
  'Custom Trips': UserCheck
};

export const ServicesGrid: React.FC<ServicesGridProps> = ({ activeCategory }) => {
  const { t, isRTL } = useLanguage();
  const { services, loading, error } = useServices();

  const filteredServices = activeCategory === 'all' 
    ? services 
    : services.filter(service => service.type === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 text-destructive ${isRTL ? 'rtl' : ''}`}>
        {error}
      </div>
    );
  }

  if (filteredServices.length === 0) {
    return (
      <div className={`text-center py-12 text-muted-foreground ${isRTL ? 'rtl' : ''}`}>
        {t('services.noServicesInCategory')}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-slide-up animation-delay-400 px-4 sm:px-0 ${isRTL ? 'rtl' : ''}`}>
      {filteredServices.map((service, index) => (
        <ServiceCard
          key={service.id}
          service={service}
          icon={ICONS[service.type] || Car}
          pricing={getPricingText(service, t)}
          index={index}
        />
      ))}
    </div>
  );
};
