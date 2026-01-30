import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Car, Building2, Ticket, Users, ArrowLeftRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENT_TYPES } from '@/types/booking';
import { DynamicServiceForm } from './DynamicServiceForm';
import type { ServiceDetails } from '@/types/booking';

interface ServiceDetailsFormProps {
  serviceType: string;
  serviceDetails: ServiceDetails;
  onUpdateDetail: (key: string, value: string | string[]) => void;
  serviceId?: string | null;
}

// Known service types that have hardcoded forms (for backward compatibility)
const LEGACY_SERVICE_TYPES = ['Driver', 'Accommodation', 'Events', 'Guide'];

export const ServiceDetailsForm: React.FC<ServiceDetailsFormProps> = ({
  serviceType,
  serviceDetails,
  onUpdateDetail,
  serviceId
}) => {
  const { t, isRTL } = useLanguage();
  const details = serviceDetails as any;
  
  // Create unique ID prefix for this form instance to avoid conflicts in multi-service mode
  const idPrefix = React.useMemo(() => `${serviceType.toLowerCase()}-`, [serviceType]);
  
  // Check if this is a legacy service type with hardcoded form
  const isLegacyType = LEGACY_SERVICE_TYPES.includes(serviceType);

  // SERVICE 1: Driver Only Booking Form
  const renderDriverForm = () => (
    <div className="space-y-6">
      {/* Trip Type Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Car className="h-4 w-4" />
          {t('booking.tripType')} *
        </Label>
        <RadioGroup 
          value={details.tripType || 'one-way'} 
          onValueChange={(value) => onUpdateDetail('tripType', value)}
          className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="one-way" id={`${serviceType}-one-way`} />
            <Label htmlFor={`${serviceType}-one-way`} className="flex items-center gap-2 cursor-pointer">
              <ArrowRight className="h-4 w-4" />
              {t('booking.oneWay')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="round-trip" id={`${serviceType}-round-trip`} />
            <Label htmlFor={`${serviceType}-round-trip`} className="flex items-center gap-2 cursor-pointer">
              <ArrowLeftRight className="h-4 w-4" />
              {t('booking.roundTrip')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickupLocation" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-500" />
            {t('booking.pickupLocation')} *
          </Label>
          <Input
            id="pickupLocation"
            value={details.pickupLocation || ''}
            onChange={(e) => onUpdateDetail('pickupLocation', e.target.value)}
            placeholder={t('booking.enterPickupLocation')}
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dropoffLocation" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
            {t('booking.dropoffLocation')} *
          </Label>
          <Input
            id="dropoffLocation"
            value={details.dropoffLocation || ''}
            onChange={(e) => onUpdateDetail('dropoffLocation', e.target.value)}
            placeholder={t('booking.enterDropoffLocation')}
            maxLength={200}
          />
        </div>
      </div>
      
      {/* Pickup Date/Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickupDate" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('booking.pickupDate')} *
          </Label>
          <Input
            id="pickupDate"
            type="date"
            value={details.pickupDate || ''}
            onChange={(e) => onUpdateDetail('pickupDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pickupTime" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('booking.pickupTime')} *
          </Label>
          <Input
            id="pickupTime"
            type="time"
            value={details.pickupTime || ''}
            onChange={(e) => onUpdateDetail('pickupTime', e.target.value)}
          />
        </div>
      </div>

      {/* Return Date/Time (for round trips) */}
      {details.tripType === 'round-trip' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="returnDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('booking.returnDate')} *
            </Label>
            <Input
              id="returnDate"
              type="date"
              value={details.returnDate || ''}
              onChange={(e) => onUpdateDetail('returnDate', e.target.value)}
              min={details.pickupDate || new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="returnTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('booking.returnTime')} *
            </Label>
            <Input
              id="returnTime"
              type="time"
              value={details.returnTime || ''}
              onChange={(e) => onUpdateDetail('returnTime', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Vehicle & Passengers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicleType" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            {t('booking.vehicleType')} *
          </Label>
          <Select 
            value={details.vehicleType || undefined} 
            onValueChange={(value) => value && onUpdateDetail('vehicleType', value)}
          >
            <SelectTrigger className={!details.vehicleType ? 'text-muted-foreground' : ''}>
              <SelectValue placeholder={t('booking.selectVehicleType')} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="economy">{t('booking.economyCar')}</SelectItem>
              <SelectItem value="comfort">{t('booking.comfortCar')}</SelectItem>
              <SelectItem value="business">{t('booking.businessClass')}</SelectItem>
              <SelectItem value="suv">{t('booking.suv')}</SelectItem>
              <SelectItem value="minivan">{t('booking.minivanSeats')}</SelectItem>
              <SelectItem value="van">{t('booking.vanSeats')}</SelectItem>
              <SelectItem value="bus">{t('booking.busSeats')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="passengers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('booking.passengers')} *
          </Label>
          <Select 
            value={details.passengers || undefined} 
            onValueChange={(value) => value && onUpdateDetail('passengers', value)}
          >
            <SelectTrigger className={!details.passengers ? 'text-muted-foreground' : ''}>
              <SelectValue placeholder={t('booking.selectPassengers')} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {[1,2,3,4,5,6,7,8,10,12,15,20,25,30].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num > 1 ? t('booking.passengerPlural') : t('booking.passengerSingular')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">{t('booking.specialRequests')}</Label>
        <Textarea
          id="specialRequests"
          value={details.specialRequests || ''}
          onChange={(e) => onUpdateDetail('specialRequests', e.target.value)}
          placeholder={t('booking.driverSpecialRequestsPlaceholder')}
          rows={3}
          maxLength={500}
        />
      </div>
    </div>
  );

  // SERVICE 2: Accommodation Booking Form
  const renderAccommodationForm = () => (
    <div className="space-y-6">
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-sm text-amber-200">
          <strong>{t('common.note')}:</strong> {t('booking.accommodationNote')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t('booking.location')} *
        </Label>
        <Input
          id="location"
          value={details.location || ''}
          onChange={(e) => onUpdateDetail('location', e.target.value)}
          placeholder={t('booking.enterLocation')}
          maxLength={200}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkIn" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('booking.checkIn')} *
          </Label>
          <Input
            id="checkIn"
            type="date"
            value={details.checkIn || ''}
            onChange={(e) => onUpdateDetail('checkIn', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkOut" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('booking.checkOut')} *
          </Label>
          <Input
            id="checkOut"
            type="date"
            value={details.checkOut || ''}
            onChange={(e) => onUpdateDetail('checkOut', e.target.value)}
            min={details.checkIn || new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('booking.guests')} *
          </Label>
          <Select 
            value={details.guests || undefined} 
            onValueChange={(value) => value && onUpdateDetail('guests', value)}
          >
            <SelectTrigger className={!details.guests ? 'text-muted-foreground' : ''}>
              <SelectValue placeholder={t('booking.selectGuests')} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {[1,2,3,4,5,6,7,8,10,12,15,20].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num > 1 ? t('booking.guestPlural') : t('booking.guestSingular')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="roomPreference" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('booking.roomPreference')}
          </Label>
          <Select 
            value={details.roomPreference || undefined} 
            onValueChange={(value) => value && onUpdateDetail('roomPreference', value)}
          >
            <SelectTrigger className={!details.roomPreference ? 'text-muted-foreground' : ''}>
              <SelectValue placeholder={t('booking.selectRoomPreference')} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="standard">{t('booking.standardRoom')}</SelectItem>
              <SelectItem value="deluxe">{t('booking.deluxeRoom')}</SelectItem>
              <SelectItem value="suite">{t('booking.suite')}</SelectItem>
              <SelectItem value="family">{t('booking.familyRoom')}</SelectItem>
              <SelectItem value="apartment">{t('booking.apartment')}</SelectItem>
              <SelectItem value="any">{t('booking.anyAvailable')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">{t('booking.specialRequests')}</Label>
        <Textarea
          id="specialRequests"
          value={details.specialRequests || ''}
          onChange={(e) => onUpdateDetail('specialRequests', e.target.value)}
          placeholder={t('booking.accommodationSpecialRequests')}
          rows={4}
          maxLength={1000}
        />
      </div>
    </div>
  );

  // SERVICE 3: Events & Entertainment Form
  const renderEventsForm = () => (
    <div className="space-y-6">
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-sm text-amber-200">
          <strong>{t('common.note')}:</strong> {t('booking.eventsNote')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventType" className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          {t('booking.eventType')} *
        </Label>
        <Select 
          value={details.eventType || undefined} 
          onValueChange={(value) => value && onUpdateDetail('eventType', value)}
        >
          <SelectTrigger className={!details.eventType ? 'text-muted-foreground' : ''}>
            <SelectValue placeholder={t('booking.selectEventType')} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {EVENT_TYPES.map(event => (
              <SelectItem key={event.id} value={event.id}>{event.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {details.eventType === 'other' && (
        <div className="space-y-2">
          <Label htmlFor="eventName">{t('booking.eventNameCustom')} *</Label>
          <Input
            id="eventName"
            value={details.eventName || ''}
            onChange={(e) => onUpdateDetail('eventName', e.target.value)}
            placeholder={t('booking.eventNamePlaceholder')}
            maxLength={200}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t('booking.location')} *
        </Label>
        <Input
          id="location"
          value={details.location || ''}
          onChange={(e) => onUpdateDetail('location', e.target.value)}
          placeholder={t('booking.enterCityOrVenue')}
          maxLength={200}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('booking.preferredDate')} *
          </Label>
          <Input
            id="date"
            type="date"
            value={details.date || ''}
            onChange={(e) => onUpdateDetail('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="numberOfPeople" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('booking.numberOfPeople')} *
          </Label>
          <Select 
            value={details.numberOfPeople || undefined} 
            onValueChange={(value) => value && onUpdateDetail('numberOfPeople', value)}
          >
            <SelectTrigger className={!details.numberOfPeople ? 'text-muted-foreground' : ''}>
              <SelectValue placeholder={t('booking.selectNumberOfPeople')} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {[1,2,3,4,5,6,7,8,10,12,15,20,25,30,50].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num > 1 ? t('booking.personPlural') : t('booking.personSingular')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">{t('booking.specialRequests')}</Label>
        <Textarea
          id="specialRequests"
          value={details.specialRequests || ''}
          onChange={(e) => onUpdateDetail('specialRequests', e.target.value)}
          placeholder={t('booking.eventsSpecialRequests')}
          rows={4}
          maxLength={1000}
        />
      </div>
    </div>
  );

  // SERVICE 4: Tourist Guide Form
  const renderGuideForm = () => (
    <div className="space-y-6">
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-sm text-amber-200">
          <strong>{t('common.note')}:</strong> {t('booking.guideNote')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('booking.location')} *
          </Label>
          <Input
            id="location"
            value={details.location || ''}
            onChange={(e) => onUpdateDetail('location', e.target.value)}
            placeholder={t('booking.enterCityOrVenue')}
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('booking.preferredDate')} *
          </Label>
          <Input
            id="date"
            type="date"
            value={details.date || ''}
            onChange={(e) => onUpdateDetail('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('booking.duration')} *
          </Label>
          <Select 
            value={details.duration || undefined} 
            onValueChange={(value) => value && onUpdateDetail('duration', value)}
          >
            <SelectTrigger className={!details.duration ? 'text-muted-foreground' : ''}>
              <SelectValue placeholder={t('booking.selectDuration')} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="2">2 {t('common.hours')}</SelectItem>
              <SelectItem value="4">4 {t('common.hours')}</SelectItem>
              <SelectItem value="6">6 {t('common.hours')}</SelectItem>
              <SelectItem value="8">{t('booking.fullDay')} (8 {t('common.hours')})</SelectItem>
              <SelectItem value="custom">{t('booking.custom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="numberOfPeople" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('booking.numberOfPeople')} *
          </Label>
          <Select 
            value={details.numberOfPeople || undefined} 
            onValueChange={(value) => value && onUpdateDetail('numberOfPeople', value)}
          >
            <SelectTrigger className={!details.numberOfPeople ? 'text-muted-foreground' : ''}>
              <SelectValue placeholder={t('booking.selectNumberOfPeople')} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {[1,2,3,4,5,6,7,8,10,12,15,20].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num > 1 ? t('booking.personPlural') : t('booking.personSingular')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">{t('booking.specialRequests')}</Label>
        <Textarea
          id="specialRequests"
          value={details.specialRequests || ''}
          onChange={(e) => onUpdateDetail('specialRequests', e.target.value)}
          placeholder={t('booking.guideSpecialRequests')}
          rows={4}
          maxLength={1000}
        />
      </div>
    </div>
  );

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
      <CardContent className="p-6">
        {/* Legacy hardcoded forms for backward compatibility */}
        {serviceType === 'Driver' && renderDriverForm()}
        {serviceType === 'Accommodation' && renderAccommodationForm()}
        {serviceType === 'Events' && renderEventsForm()}
        {serviceType === 'Guide' && renderGuideForm()}
        
        {/* Dynamic form for any other service type */}
        {!isLegacyType && (
          <DynamicServiceForm
            serviceId={serviceId || null}
            serviceType={serviceType}
            serviceDetails={serviceDetails}
            onUpdateDetail={onUpdateDetail}
          />
        )}
      </CardContent>
    </Card>
  );
};
