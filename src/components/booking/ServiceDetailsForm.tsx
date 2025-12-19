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

  // SERVICE 1: Driver Only Booking Form
  const renderDriverForm = () => (
    <div className="space-y-6">
      {/* Trip Type Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Car className="h-4 w-4" />
          Trip Type *
        </Label>
        <RadioGroup 
          value={details.tripType || 'one-way'} 
          onValueChange={(value) => onUpdateDetail('tripType', value)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="one-way" id="one-way" />
            <Label htmlFor="one-way" className="flex items-center gap-2 cursor-pointer">
              <ArrowRight className="h-4 w-4" />
              One Way
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="round-trip" id="round-trip" />
            <Label htmlFor="round-trip" className="flex items-center gap-2 cursor-pointer">
              <ArrowLeftRight className="h-4 w-4" />
              Round Trip
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickupLocation" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-500" />
            Pickup Location *
          </Label>
          <Input
            id="pickupLocation"
            value={details.pickupLocation || ''}
            onChange={(e) => onUpdateDetail('pickupLocation', e.target.value)}
            placeholder="Enter pickup address"
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dropoffLocation" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
            Drop-off Location *
          </Label>
          <Input
            id="dropoffLocation"
            value={details.dropoffLocation || ''}
            onChange={(e) => onUpdateDetail('dropoffLocation', e.target.value)}
            placeholder="Enter destination"
            maxLength={200}
          />
        </div>
      </div>
      
      {/* Pickup Date/Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickupDate" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Pickup Date *
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
            Pickup Time *
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
              Return Date *
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
              Return Time *
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
            Vehicle Type *
          </Label>
          <Select value={details.vehicleType || ''} onValueChange={(value) => onUpdateDetail('vehicleType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy Car</SelectItem>
              <SelectItem value="comfort">Comfort Car</SelectItem>
              <SelectItem value="business">Business Class</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="minivan">Minivan (7 seats)</SelectItem>
              <SelectItem value="van">Van (12 seats)</SelectItem>
              <SelectItem value="bus">Bus (25+ seats)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="passengers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Number of Passengers *
          </Label>
          <Select value={details.passengers || ''} onValueChange={(value) => onUpdateDetail('passengers', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select passengers" />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8,10,12,15,20,25,30].map(num => (
                <SelectItem key={num} value={num.toString()}>{num} {num > 1 ? 'passengers' : 'passenger'}</SelectItem>
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
          placeholder="Any special requirements (child seat, luggage, etc.)"
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
          <strong>Note:</strong> Final price will be set by admin based on your requirements. You will be contacted to confirm the price before proceeding.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location / City *
        </Label>
        <Input
          id="location"
          value={details.location || ''}
          onChange={(e) => onUpdateDetail('location', e.target.value)}
          placeholder="Enter city or area"
          maxLength={200}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkIn" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Check-in Date *
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
            Check-out Date *
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
            Number of Guests *
          </Label>
          <Select value={details.guests || ''} onValueChange={(value) => onUpdateDetail('guests', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select guests" />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8,10,12,15,20].map(num => (
                <SelectItem key={num} value={num.toString()}>{num} {num > 1 ? 'guests' : 'guest'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="roomPreference" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Room Preference
          </Label>
          <Select value={details.roomPreference || ''} onValueChange={(value) => onUpdateDetail('roomPreference', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Room</SelectItem>
              <SelectItem value="deluxe">Deluxe Room</SelectItem>
              <SelectItem value="suite">Suite</SelectItem>
              <SelectItem value="family">Family Room</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="any">Any Available</SelectItem>
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
          placeholder="Describe your requirements (budget range, amenities, location preferences, etc.)"
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
          <strong>Note:</strong> Final price will be set by admin based on event availability and requirements. You will be contacted to confirm the price before proceeding.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventType" className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          Event Type *
        </Label>
        <Select value={details.eventType || ''} onValueChange={(value) => onUpdateDetail('eventType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map(event => (
              <SelectItem key={event.id} value={event.id}>{event.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {details.eventType === 'other' && (
        <div className="space-y-2">
          <Label htmlFor="eventName">Event Name *</Label>
          <Input
            id="eventName"
            value={details.eventName || ''}
            onChange={(e) => onUpdateDetail('eventName', e.target.value)}
            placeholder="Describe the event you're looking for"
            maxLength={200}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location / City *
        </Label>
        <Input
          id="location"
          value={details.location || ''}
          onChange={(e) => onUpdateDetail('location', e.target.value)}
          placeholder="Enter city or venue"
          maxLength={200}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Preferred Date *
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
            Number of People *
          </Label>
          <Select value={details.numberOfPeople || ''} onValueChange={(value) => onUpdateDetail('numberOfPeople', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select number" />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8,10,12,15,20,25,30,50].map(num => (
                <SelectItem key={num} value={num.toString()}>{num} {num > 1 ? 'people' : 'person'}</SelectItem>
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
          placeholder="Any special requirements, preferences, or questions"
          rows={4}
          maxLength={1000}
        />
      </div>
    </div>
  );

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
      <CardContent className="p-6">
        {serviceType === 'Driver' && renderDriverForm()}
        {serviceType === 'Accommodation' && renderAccommodationForm()}
        {serviceType === 'Events' && renderEventsForm()}
      </CardContent>
    </Card>
  );
};
