import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Info, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDriverPricing } from '@/hooks/useAppSettings';

interface PricingDisplayProps {
  serviceType: string;
  serviceDetails: any;
}

export const PricingDisplay: React.FC<PricingDisplayProps> = ({
  serviceType,
  serviceDetails
}) => {
  const { t, isRTL } = useLanguage();
  const { data: pricing, loading } = useDriverPricing();
  
  // Only show fixed price for Driver service
  // Accommodation and Events require admin pricing - NO estimated price shown
  
  if (!serviceType) return null;

  // Driver service - show base price from dynamic settings
  if (serviceType === 'Driver' || serviceType === 'Transportation') {
    // Use default values if pricing not loaded yet
    const basePriceConfig = pricing || {
      basePrice: 50,
      businessAddon: 30,
      suvAddon: 20,
      minivanAddon: 40,
      vanAddon: 60,
      busAddon: 100,
      roundTripMultiplier: 1.8
    };
    
    let basePrice = basePriceConfig.basePrice;
    
    // Add modifiers based on vehicle type (from database settings)
    if (serviceDetails?.vehicleType === 'business') basePrice += basePriceConfig.businessAddon;
    if (serviceDetails?.vehicleType === 'suv') basePrice += basePriceConfig.suvAddon;
    if (serviceDetails?.vehicleType === 'minivan') basePrice += basePriceConfig.minivanAddon;
    if (serviceDetails?.vehicleType === 'van') basePrice += basePriceConfig.vanAddon;
    if (serviceDetails?.vehicleType === 'bus') basePrice += basePriceConfig.busAddon;
    
    // Round trip adds multiplier
    if (serviceDetails?.tripType === 'round-trip') {
      basePrice = Math.round(basePrice * basePriceConfig.roundTripMultiplier);
    }

    return (
      <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
        <CardContent className="p-4">
          <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-lg">{t('booking.estimatedPrice') || 'Estimated Price'}</span>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-700">
              {t('serviceTypes.driver') || 'Driver Service'}
            </Badge>
          </div>
          
          <div className={`flex items-baseline gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-3xl font-bold text-green-600">
              ${basePrice}+
            </span>
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
          
          <div className={`flex items-start gap-2 text-xs text-muted-foreground ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>
              {t('booking.priceNote') || 'Final price depends on distance and may be adjusted by admin. Price shown is minimum starting price.'}
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
        <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-lg">{t('booking.priceQuoteRequired') || 'Price Quote Required'}</span>
          </div>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
            {serviceType === 'Accommodation' 
              ? (t('serviceTypes.accommodation') || 'Accommodation') 
              : (t('serviceTypes.eventsEntertainment') || 'Activities & Events')}
          </Badge>
        </div>
        
        <div className={`flex items-baseline gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-2xl font-bold text-amber-600">
            {t('booking.toBeDetermined') || 'To Be Determined'}
          </span>
        </div>
        
        <div className={`flex items-start gap-2 text-xs text-muted-foreground ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            {t('booking.customPriceNote') || 'Submit your request and our team will contact you with a custom price quote based on your specific requirements.'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
