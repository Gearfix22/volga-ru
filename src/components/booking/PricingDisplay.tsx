import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Info, Clock } from 'lucide-react';

interface PricingDisplayProps {
  serviceType: string;
  serviceDetails: any;
}

export const PricingDisplay: React.FC<PricingDisplayProps> = ({
  serviceType,
  serviceDetails
}) => {
  // Only show fixed price for Driver service
  // Accommodation and Events require admin pricing - NO estimated price shown
  
  if (!serviceType) return null;

  // Driver service - show base price from $50
  if (serviceType === 'Driver' || serviceType === 'Transportation') {
    let basePrice = 50; // Base USD
    
    // Add modifiers based on vehicle type
    if (serviceDetails?.vehicleType === 'business') basePrice += 30;
    if (serviceDetails?.vehicleType === 'suv') basePrice += 20;
    if (serviceDetails?.vehicleType === 'minivan') basePrice += 40;
    if (serviceDetails?.vehicleType === 'van') basePrice += 60;
    if (serviceDetails?.vehicleType === 'bus') basePrice += 100;
    
    // Round trip adds 80%
    if (serviceDetails?.tripType === 'round-trip') basePrice = Math.round(basePrice * 1.8);

    return (
      <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-lg">Estimated Price</span>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-700">
              Driver Service
            </Badge>
          </div>
          
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-green-600">
              ${basePrice}+
            </span>
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
          
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>
              Final price depends on distance and may be adjusted by admin. Price shown is minimum starting price.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Accommodation and Events - No estimated price, admin sets it
  return (
    <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-500/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-lg">Price Quote Required</span>
          </div>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
            {serviceType === 'Accommodation' ? 'Accommodation' : 'Activities & Events'}
          </Badge>
        </div>
        
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-amber-600">
            To Be Determined
          </span>
        </div>
        
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Submit your request and our team will contact you with a custom price quote based on your specific requirements.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
