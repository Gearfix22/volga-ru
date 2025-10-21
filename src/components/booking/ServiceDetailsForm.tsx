
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Car, Building2, Ticket, Globe, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ServiceDetails } from '@/types/booking';

interface ServiceDetailsFormProps {
  serviceType: string;
  serviceDetails: ServiceDetails;
  onUpdateDetail: (key: string, value: string | string[]) => void;
}

export const ServiceDetailsForm: React.FC<ServiceDetailsFormProps> = ({
  serviceType,
  serviceDetails,
  onUpdateDetail
}) => {
  const { t } = useLanguage();
  const details = serviceDetails as any;

  const renderTransportationForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickup" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('pickupLocation')} *
          </Label>
          <Input
            id="pickup"
            value={details.pickup || ''}
            onChange={(e) => onUpdateDetail('pickup', e.target.value)}
            placeholder={t('enterPickupLocation')}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dropoff" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('dropoffLocation')} *
          </Label>
          <Input
            id="dropoff"
            value={details.dropoff || ''}
            onChange={(e) => onUpdateDetail('dropoff', e.target.value)}
            placeholder={t('enterDropoffLocation')}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('date')} *
          </Label>
          <Input
            id="date"
            type="date"
            value={details.date || ''}
            onChange={(e) => onUpdateDetail('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('time')} *
          </Label>
          <Input
            id="time"
            type="time"
            value={details.time || ''}
            onChange={(e) => onUpdateDetail('time', e.target.value)}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicleType" className="flex items-center gap-2">
          <Car className="h-4 w-4" />
          {t('vehicleType')} *
        </Label>
        <Select value={details.vehicleType || ''} onValueChange={(value) => onUpdateDetail('vehicleType', value)}>
          <SelectTrigger className="focus:ring-2 focus:ring-primary">
            <SelectValue placeholder={t('selectVehicleType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="economy">{t('economyCar')}</SelectItem>
            <SelectItem value="comfort">{t('comfortCar')}</SelectItem>
            <SelectItem value="business">{t('businessCar')}</SelectItem>
            <SelectItem value="minivan">{t('minivan')}</SelectItem>
            <SelectItem value="bus">{t('bus')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="passengers" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('numberOfPassengers')}
        </Label>
        <Select value={details.passengers || ''} onValueChange={(value) => onUpdateDetail('passengers', value)}>
          <SelectTrigger>
            <SelectValue placeholder={t('selectNumberOfPassengers')} />
          </SelectTrigger>
          <SelectContent>
            {[1,2,3,4,5,6,7,8,10,15,20,25,30].map(num => (
              <SelectItem key={num} value={num.toString()}>{num} {num > 1 ? t('passengers') : t('passenger')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderHotelForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('city')} *
          </Label>
          <Input
            id="city"
            value={details.city || ''}
            onChange={(e) => onUpdateDetail('city', e.target.value)}
            placeholder={t('enterCityName')}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hotel" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('hotel')}
          </Label>
          <Input
            id="hotel"
            value={details.hotel || ''}
            onChange={(e) => onUpdateDetail('hotel', e.target.value)}
            placeholder={t('preferredHotel')}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkin" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('checkinDate')} *
          </Label>
          <Input
            id="checkin"
            type="date"
            value={details.checkin || ''}
            onChange={(e) => onUpdateDetail('checkin', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('checkoutDate')} *
          </Label>
          <Input
            id="checkout"
            type="date"
            value={details.checkout || ''}
            onChange={(e) => onUpdateDetail('checkout', e.target.value)}
            min={details.checkin || new Date().toISOString().split('T')[0]}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roomType" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('roomType')} *
          </Label>
          <Select value={details.roomType || ''} onValueChange={(value) => onUpdateDetail('roomType', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder={t('selectRoomType')} />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="standard">{t('standardRoom')}</SelectItem>
            <SelectItem value="deluxe">{t('deluxeRoom')}</SelectItem>
            <SelectItem value="suite">{t('suite')}</SelectItem>
            <SelectItem value="family">{t('familyRoom')}</SelectItem>
            <SelectItem value="presidential">{t('presidentialSuite')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
        <Label htmlFor="guests" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('numberOfGuests')}
        </Label>
        <Select value={details.guests || ''} onValueChange={(value) => onUpdateDetail('guests', value)}>
          <SelectTrigger>
            <SelectValue placeholder={t('selectNumberOfGuests')} />
          </SelectTrigger>
            <SelectContent>
            {[1,2,3,4,5,6].map(num => (
              <SelectItem key={num} value={num.toString()}>{num} {num > 1 ? t('guests') : t('guest')}</SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">{t('specialRequests')}</Label>
        <Textarea
          id="specialRequests"
          value={details.specialRequests || ''}
          onChange={(e) => onUpdateDetail('specialRequests', e.target.value)}
          placeholder={t('specialRequestsPlaceholder')}
          rows={3}
          className="focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );

  const renderEventForm = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="eventName" className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          {t('eventName')} *
        </Label>
        <Input
          id="eventName"
          value={details.eventName || ''}
          onChange={(e) => onUpdateDetail('eventName', e.target.value)}
          placeholder={t('enterEventName')}
          className="focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="eventLocation" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t('eventLocation')} *
        </Label>
        <Input
          id="eventLocation"
          value={details.eventLocation || ''}
          onChange={(e) => onUpdateDetail('eventLocation', e.target.value)}
          placeholder={t('enterEventLocation')}
          className="focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventDate" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('eventDate')} *
          </Label>
          <Input
            id="eventDate"
            type="date"
            value={details.eventDate || ''}
            onChange={(e) => onUpdateDetail('eventDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            {t('numberOfTickets')} *
          </Label>
          <Select value={details.tickets || ''} onValueChange={(value) => onUpdateDetail('tickets', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder={t('selectNumberOfTickets')} />
            </SelectTrigger>
            <SelectContent>
            {[1,2,3,4,5,6,7,8,9,10,15,20,25,30].map(num => (
              <SelectItem key={num} value={num.toString()}>{num} {num > 1 ? t('tickets') : t('ticket')}</SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticketType">{t('ticketTypePreference')}</Label>
        <Select value={details.ticketType || ''} onValueChange={(value) => onUpdateDetail('ticketType', value)}>
          <SelectTrigger>
            <SelectValue placeholder={t('selectTicketType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">{t('generalAdmission')}</SelectItem>
            <SelectItem value="vip">{t('vip')}</SelectItem>
            <SelectItem value="premium">{t('premium')}</SelectItem>
            <SelectItem value="backstage">{t('backstagePass')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTripForm = () => {
    const interests = details.interests || [];
    
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="duration" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('tripDuration')} *
          </Label>
          <Select value={details.duration || ''} onValueChange={(value) => onUpdateDetail('duration', value)}>
            <SelectTrigger className="focus:ring-2 focus:ring-primary">
              <SelectValue placeholder={t('selectDuration')} />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="1-3-days">{t('1to3Days')}</SelectItem>
            <SelectItem value="4-7-days">{t('4to7Days')}</SelectItem>
            <SelectItem value="1-2-weeks">{t('1to2Weeks')}</SelectItem>
            <SelectItem value="3-4-weeks">{t('3to4Weeks')}</SelectItem>
            <SelectItem value="1-month+">{t('1MonthPlus')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="regions" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('regionsToVisit')} *
          </Label>
          <Textarea
            id="regions"
            value={details.regions || ''}
            onChange={(e) => onUpdateDetail('regions', e.target.value)}
            placeholder={t('describeRegions')}
            rows={3}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">{t('budgetRange')}</Label>
          <Select value={details.budget || ''} onValueChange={(value) => onUpdateDetail('budget', value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectBudgetRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500-1000">$500 - $1,000</SelectItem>
              <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
              <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
              <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
              <SelectItem value="10000+">$10,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('interests')}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'historyHeritage', label: t('historyHeritage') },
              { key: 'cultureArts', label: t('cultureArts') },
              { key: 'natureWildlife', label: t('natureWildlife') },
              { key: 'adventureSports', label: t('adventureSports') },
              { key: 'localCuisine', label: t('localCuisine') },
              { key: 'shopping', label: t('shopping') },
              { key: 'nightlife', label: t('nightlife') },
              { key: 'architecture', label: t('architecture') },
              { key: 'museumsGalleries', label: t('museumsGalleries') },
              { key: 'religiousSites', label: t('religiousSites') },
              { key: 'beachWaterSports', label: t('beachWaterSports') },
              { key: 'photography', label: t('photography') }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={interests.includes(label)}
                  onCheckedChange={(checked) => {
                    const newInterests = checked
                      ? [...interests, label]
                      : interests.filter((i: string) => i !== label);
                    onUpdateDetail('interests', newInterests);
                  }}
                />
                <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">{t('additionalInformation')}</Label>
          <Textarea
            id="additionalInfo"
            value={details.additionalInfo || ''}
            onChange={(e) => onUpdateDetail('additionalInfo', e.target.value)}
            placeholder={t('additionalInfoPlaceholder')}
            rows={3}
            className="focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
      <CardContent className="p-6">
        {serviceType === 'Transportation' && renderTransportationForm()}
        {serviceType === 'Hotels' && renderHotelForm()}
        {serviceType === 'Events' && renderEventForm()}
        {serviceType === 'Custom Trips' && renderTripForm()}
      </CardContent>
    </Card>
  );
};
