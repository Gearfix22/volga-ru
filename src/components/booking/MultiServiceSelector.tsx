import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Car, 
  Building2, 
  Ticket, 
  UserCheck, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Check,
  DollarSign,
  LucideIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getServices, getPricingText, getLocalizedServiceName, getLocalizedServiceDescription, type ServiceData } from '@/services/servicesService';
import { formatPrice } from '@/services/currencyService';

interface MultiServiceSelectorProps {
  selectedServices: string[];
  onToggleService: (serviceType: string) => void;
  onServiceDataLoaded?: (serviceDataMap: Record<string, ServiceData>) => void;
}

// Icon mapping by service type
const SERVICE_ICONS: Record<string, LucideIcon> = {
  'Driver': Car,
  'Accommodation': Building2,
  'Events': Ticket,
  'Guide': UserCheck
};

// Short descriptions for compact cards
const SERVICE_SHORT_DESC: Record<string, string> = {
  'Driver': 'booking.driverShortDesc',
  'Accommodation': 'booking.accommodationShortDesc',
  'Events': 'booking.eventsShortDesc',
  'Guide': 'booking.guideShortDesc'
};

export const MultiServiceSelector: React.FC<MultiServiceSelectorProps> = ({
  selectedServices,
  onToggleService,
  onServiceDataLoaded
}) => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  // Store callback ref to avoid infinite loops
  const onServiceDataLoadedRef = React.useRef(onServiceDataLoaded);
  onServiceDataLoadedRef.current = onServiceDataLoaded;

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getServices();
        
        // Group services by type - only show one card per type
        const uniqueTypes = new Map<string, ServiceData>();
        data.forEach(service => {
          if (!uniqueTypes.has(service.type)) {
            uniqueTypes.set(service.type, service);
          }
        });
        
        const serviceArray = Array.from(uniqueTypes.values());
        setServices(serviceArray);
        
        // Notify parent about loaded service data for price calculations
        if (onServiceDataLoadedRef.current) {
          const dataMap: Record<string, ServiceData> = {};
          serviceArray.forEach(s => {
            dataMap[s.type] = s;
          });
          onServiceDataLoadedRef.current(dataMap);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
        setError(t('booking.failedToLoadServices'));
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [t]); // Removed onServiceDataLoaded to prevent infinite loops

  const toggleExpand = (serviceType: string) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(serviceType)) {
        next.delete(serviceType);
      } else {
        next.add(serviceType);
      }
      return next;
    });
  };

  const isSelected = (serviceType: string) => selectedServices.includes(serviceType);
  const isExpanded = (serviceType: string) => expandedServices.has(serviceType);

  // Calculate estimated total from initial prices
  const estimatedTotal = selectedServices.reduce((sum, type) => {
    const service = services.find(s => s.type === type);
    return sum + (service?.base_price || 0);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-foreground mb-4">{t('booking.selectServices')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (services.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('booking.noServicesAvailable')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">{t('booking.selectServices')}</h3>
        {selectedServices.length > 0 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {selectedServices.length} {t('booking.servicesSelected')}
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        {t('booking.selectMultipleServices')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((service) => {
          const Icon = SERVICE_ICONS[service.type] || Car;
          const selected = isSelected(service.type);
          const expanded = isExpanded(service.type);
          const hasBasePrice = service.base_price !== null && service.base_price > 0;
          const localizedName = getLocalizedServiceName(service, language);
          const localizedDesc = getLocalizedServiceDescription(service, language);
          const shortDescKey = SERVICE_SHORT_DESC[service.type];

          return (
            <Card
              key={service.id}
              className={`transition-all duration-200 cursor-pointer ${
                selected 
                  ? 'ring-2 ring-primary bg-primary/5 border-primary/30' 
                  : 'bg-card/80 backdrop-blur-sm hover:bg-accent/50 border-border'
              }`}
            >
              <CardContent className="p-0">
                {/* Compact Header - Always visible */}
                <div 
                  className="flex items-center gap-3 p-4"
                  onClick={() => onToggleService(service.type)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleService(service.type);
                    }
                  }}
                >
                  {/* Checkbox */}
                  <Checkbox 
                    checked={selected}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => onToggleService(service.type)}
                  />
                  
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${
                    selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  {/* Title & Short Description */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{localizedName}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {shortDescKey ? t(shortDescKey) : localizedDesc.slice(0, 50)}
                    </p>
                  </div>
                  
                  {/* Initial Price Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    {hasBasePrice ? (
                      <>
                        <Badge 
                          variant="outline" 
                          className="border-green-500/50 text-green-600 dark:text-green-400 text-xs"
                        >
                          <DollarSign className="h-3 w-3 mr-0.5" />
                          {service.base_price}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {t('booking.initialPrice')}
                        </span>
                      </>
                    ) : (
                      <Badge 
                        variant="outline" 
                        className="border-amber-500/50 text-amber-600 dark:text-amber-400 text-xs"
                      >
                        {t('booking.quoteByAdmin')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expandable Details */}
                <Collapsible open={expanded} onOpenChange={() => toggleExpand(service.type)}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full flex items-center justify-center gap-1 rounded-none border-t border-border/50 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {expanded ? (
                        <>
                          {t('booking.hideDetails')} <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          {t('booking.showDetails')} <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border/30">
                      {/* Full Description */}
                      <p className="text-sm text-muted-foreground">
                        {localizedDesc}
                      </p>
                      
                      {/* Features */}
                      {service.features && service.features.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-foreground">{t('booking.includes')}:</p>
                          <ul className="space-y-1">
                            {service.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Driver notice for Transportation */}
                      {service.type === 'Driver' && (
                        <div className="flex items-center gap-2 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2 rounded-md">
                          <Car className="h-3 w-3" />
                          <span>{t('booking.driverIncludedNote')}</span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection Summary with Initial Price Estimate */}
      {selectedServices.length > 0 && (
        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
          <p className="text-sm font-medium text-foreground">
            {t('booking.selectedServicesLabel')}:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedServices.map((type) => {
              const service = services.find(s => s.type === type);
              const Icon = SERVICE_ICONS[type] || Car;
              const price = service?.base_price;
              return (
                <Badge key={type} variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3">
                  <Icon className="h-3 w-3" />
                  <span>{service ? getLocalizedServiceName(service, language) : type}</span>
                  {price && price > 0 && (
                    <span className="text-green-600 dark:text-green-400 font-medium ml-1">
                      ${price}
                    </span>
                  )}
                </Badge>
              );
            })}
          </div>
          
          {/* Estimated Total */}
          <div className="flex items-center justify-between pt-2 border-t border-primary/20">
            <span className="text-sm text-muted-foreground">{t('booking.estimatedTotal')}:</span>
            <div className="text-right">
              {estimatedTotal > 0 ? (
                <>
                  <span className="text-lg font-bold text-foreground">${estimatedTotal.toFixed(2)}</span>
                  <p className="text-[10px] text-muted-foreground">{t('booking.finalPriceByAdmin')}</p>
                </>
              ) : (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                  {t('booking.quoteByAdmin')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
