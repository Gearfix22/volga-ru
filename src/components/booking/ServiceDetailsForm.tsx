
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Car, Building2, Ticket, Globe, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/EnhancedLanguageContext';
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
            <SelectItem value="economy">Economy Car</SelectItem>
            <SelectItem value="comfort">Comfort Car</SelectItem>
            <SelectItem value="business">Business Car</SelectItem>
            <SelectItem value="minivan">Minivan (6-8 seats)</SelectItem>
            <SelectItem value="bus">Bus (20+ seats)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="passengers" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Number of Passengers
        </Label>
        <Select value={details.passengers || ''} onValueChange={(value) => onUpdateDetail('passengers', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select number of passengers" />
          </SelectTrigger>
          <SelectContent>
            {[1,2,3,4,5,6,7,8,10,15,20,25,30].map(num => (
              <SelectItem key={num} value={num.toString()}>{num} passenger{num > 1 ? 's' : ''}</SelectItem>
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
              <SelectItem value="standard">Standard Room</SelectItem>
              <SelectItem value="deluxe">Deluxe Room</SelectItem>
              <SelectItem value="suite">Suite</SelectItem>
              <SelectItem value="family">Family Room</SelectItem>
              <SelectItem value="presidential">Presidential Suite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="guests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Number of Guests
          </Label>
          <Select value={details.guests || ''} onValueChange={(value) => onUpdateDetail('guests', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select number of guests" />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6].map(num => (
                <SelectItem key={num} value={num.toString()}>{num} guest{num > 1 ? 's' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">Special Requests</Label>
        <Textarea
          id="specialRequests"
          value={details.specialRequests || ''}
          onChange={(e) => onUpdateDetail('specialRequests', e.target.value)}
          placeholder="Any special requests or preferences..."
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
              <SelectValue placeholder="Select number of tickets" />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8,9,10,15,20,25,30].map(num => (
                <SelectItem key={num} value={num.toString()}>{num} ticket{num > 1 ? 's' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticketType">Ticket Type Preference</Label>
        <Select value={details.ticketType || ''} onValueChange={(value) => onUpdateDetail('ticketType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select ticket type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General Admission</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="backstage">Backstage Pass</SelectItem>
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
              <SelectItem value="1-3-days">1-3 Days</SelectItem>
              <SelectItem value="4-7-days">4-7 Days (1 Week)</SelectItem>
              <SelectItem value="1-2-weeks">1-2 Weeks</SelectItem>
              <SelectItem value="3-4-weeks">3-4 Weeks (1 Month)</SelectItem>
              <SelectItem value="1-month+">1 Month+</SelectItem>
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
          <Label htmlFor="budget">Budget Range (USD)</Label>
          <Select value={details.budget || ''} onValueChange={(value) => onUpdateDetail('budget', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your budget range" />
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
              'History & Heritage',
              'Culture & Arts', 
              'Nature & Wildlife',
              'Adventure Sports',
              'Local Cuisine',
              'Shopping',
              'Nightlife',
              'Architecture',
              'Museums & Galleries',
              'Religious Sites',
              'Beach & Water Sports',
              'Photography'
            ].map((interest) => (
              <div key={interest} className="flex items-center space-x-2">
                <Checkbox
                  id={interest}
                  checked={interests.includes(interest)}
                  onCheckedChange={(checked) => {
                    const newInterests = checked
                      ? [...interests, interest]
                      : interests.filter((i: string) => i !== interest);
                    onUpdateDetail('interests', newInterests);
                  }}
                />
                <Label htmlFor={interest} className="text-sm cursor-pointer">{interest}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">Additional Information</Label>
          <Textarea
            id="additionalInfo"
            value={details.additionalInfo || ''}
            onChange={(e) => onUpdateDetail('additionalInfo', e.target.value)}
            placeholder="Any additional preferences, accessibility needs, or special requests..."
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
