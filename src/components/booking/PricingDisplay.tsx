
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Info } from 'lucide-react';

interface PricingDisplayProps {
  serviceType: string;
  serviceDetails: any;
}

export const PricingDisplay: React.FC<PricingDisplayProps> = ({
  serviceType,
  serviceDetails
}) => {
  const calculateEstimatedPrice = () => {
    const basePrices = {
      'Transportation': 3000,  // ₽3,000
      'Hotels': 6000,         // ₽6,000
      'Events': 4500,         // ₽4,500
      'Custom Trips': 12000   // ₽12,000
    };
    
    let basePrice = basePrices[serviceType as keyof typeof basePrices] || 3000;
    
    // Add modifiers based on service details
    if (serviceType === 'Transportation') {
      if (serviceDetails.vehicleType === 'business') basePrice += 3000;
      if (serviceDetails.vehicleType === 'minivan') basePrice += 1800;
      if (serviceDetails.vehicleType === 'bus') basePrice += 6000;
    }
    
    if (serviceType === 'Hotels') {
      if (serviceDetails.roomType === 'suite') basePrice += 6000;
      if (serviceDetails.roomType === 'presidential') basePrice += 18000;
      if (serviceDetails.roomType === 'deluxe') basePrice += 3000;
    }
    
    if (serviceType === 'Events') {
      const ticketCount = parseInt(serviceDetails.tickets) || 1;
      basePrice *= ticketCount;
      if (serviceDetails.ticketType === 'vip') basePrice += 3000;
      if (serviceDetails.ticketType === 'premium') basePrice += 1800;
      if (serviceDetails.ticketType === 'backstage') basePrice += 6000;
    }
    
    if (serviceType === 'Custom Trips') {
      if (serviceDetails.duration?.includes('1-2-weeks')) basePrice += 12000;
      if (serviceDetails.duration?.includes('3-4-weeks')) basePrice += 30000;
      if (serviceDetails.duration?.includes('1-month+')) basePrice += 60000;
      if (serviceDetails.interests?.length > 5) basePrice += 6000;
    }
    
    return Math.max(basePrice, 1500); // Minimum ₽1,500
  };

  if (!serviceType) return null;

  const estimatedPrice = calculateEstimatedPrice();

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Estimated Price</span>
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {serviceType}
          </Badge>
        </div>
        
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-primary">
            ₽{estimatedPrice.toLocaleString('ru-RU')}
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400">RUB</span>
        </div>
        
        <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            This is an estimated price. Final cost will be confirmed after consultation with our team.
            Price may vary based on availability, season, and specific requirements.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
