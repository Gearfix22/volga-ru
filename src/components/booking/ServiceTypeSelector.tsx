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
      label: 'Driver Only Booking',
      icon: Car,
      description: 'Professional driver service for one-way or round trips',
      features: [
        'One-way or round trip',
        'Professional drivers',
        'Airport transfers',
        'City transportation'
      ],
      pricing: `From $${SERVICE_PRICING.Driver.basePrice} USD`,
      hasFixedPrice: true
    },
    {
      id: 'Accommodation',
      label: 'Accommodation Booking',
      icon: Building2,
      description: 'Hotels, apartments, and lodging reservations',
      features: [
        'Hotels & Resorts',
        'Apartments',
        'Guest houses',
        'Custom requests'
      ],
      pricing: 'Price set by admin',
      hasFixedPrice: false
    },
    {
      id: 'Events',
      label: 'Events & Entertainment',
      icon: Ticket,
      description: 'Tickets and experiences for attractions and events',
      features: [
        'Circus & Shows',
        'Museums & Parks',
        'City Tours',
        'Cable Cars & Opera'
      ],
      pricing: 'Price set by admin',
      hasFixedPrice: false
    }
  ];

  return (
    <Card className="coastal-glass border border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5 text-coastal-blue" />
          Select Service Type
        </CardTitle>
        <CardDescription className="text-coastal-pearl">
          Choose the service you need
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map(({ id, label, icon: Icon, description, features, pricing, hasFixedPrice }) => (
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
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      serviceType === id 
                        ? 'bg-brand-primary text-white' 
                        : 'bg-white/10 text-coastal-blue'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-white">{label}</h3>
                  </div>
                  
                  <p className="text-sm text-coastal-pearl leading-relaxed">
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
