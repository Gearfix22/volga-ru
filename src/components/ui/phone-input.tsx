import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronDown, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  COUNTRIES, 
  CountryData, 
  getCountryByCode, 
  getOrderedCountries,
  toE164,
  validatePhoneForCountry,
  POPULAR_COUNTRIES
} from '@/data/countryCodes';
import { useLanguage } from '@/contexts/LanguageContext';

interface PhoneInputProps {
  value?: string;
  countryCode?: string;
  onChange: (data: { 
    phone: string; 
    countryCode: string; 
    dialCode: string; 
    phoneE164: string;
    isValid: boolean;
  }) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = '',
  countryCode = 'EG',
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  error,
  className
}) => {
  const { t, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(
    getCountryByCode(countryCode) || getCountryByCode('EG') || null
  );
  const [localPhone, setLocalPhone] = useState(value);

  // Update when external value changes
  useEffect(() => {
    setLocalPhone(value);
  }, [value]);

  useEffect(() => {
    const country = getCountryByCode(countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  }, [countryCode]);

  const handleCountrySelect = (country: CountryData) => {
    setSelectedCountry(country);
    setOpen(false);
    
    const isValid = validatePhoneForCountry(localPhone, country.code);
    const phoneE164 = toE164(localPhone, country.dialCode);
    
    onChange({
      phone: localPhone,
      countryCode: country.code,
      dialCode: country.dialCode,
      phoneE164,
      isValid
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, spaces, and dashes for formatting
    const cleaned = e.target.value.replace(/[^\d\s-]/g, '');
    setLocalPhone(cleaned);
    
    if (selectedCountry) {
      const isValid = validatePhoneForCountry(cleaned, selectedCountry.code);
      const phoneE164 = toE164(cleaned, selectedCountry.dialCode);
      
      onChange({
        phone: cleaned,
        countryCode: selectedCountry.code,
        dialCode: selectedCountry.dialCode,
        phoneE164,
        isValid
      });
    }
  };

  const orderedCountries = getOrderedCountries();
  const popularCountries = orderedCountries.filter(c => POPULAR_COUNTRIES.includes(c.code));
  const otherCountries = orderedCountries.filter(c => !POPULAR_COUNTRIES.includes(c.code));

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
          <Phone className="h-4 w-4" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
        {/* Country Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-[120px] justify-between shrink-0"
            >
              {selectedCountry ? (
                <span className="flex items-center gap-1 truncate">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm">{selectedCountry.dialCode}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">{t('common.select')}</span>
              )}
              <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t('auth.searchCountry') || 'Search country...'} />
              <CommandList>
                <CommandEmpty>{t('common.noResults')}</CommandEmpty>
                
                {/* Popular Countries */}
                <CommandGroup heading={t('common.popular') || 'Popular'}>
                  {popularCountries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.dialCode}`}
                      onSelect={() => handleCountrySelect(country)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedCountry?.code === country.code ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="text-lg mr-2">{country.flag}</span>
                      <span className="flex-1">{country.name}</span>
                      <span className="text-muted-foreground text-sm">{country.dialCode}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                
                {/* All Countries */}
                <CommandGroup heading={t('common.allCountries') || 'All Countries'}>
                  {otherCountries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.dialCode}`}
                      onSelect={() => handleCountrySelect(country)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedCountry?.code === country.code ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="text-lg mr-2">{country.flag}</span>
                      <span className="flex-1">{country.name}</span>
                      <span className="text-muted-foreground text-sm">{country.dialCode}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Phone Number Input */}
        <Input
          type="tel"
          value={localPhone}
          onChange={handlePhoneChange}
          placeholder={placeholder || selectedCountry?.example || '1234567890'}
          disabled={disabled}
          className={cn(
            'flex-1',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          dir="ltr"
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {/* E.164 Preview (dev only) */}
      {selectedCountry && localPhone && process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-muted-foreground">
          E.164: {toE164(localPhone, selectedCountry.dialCode)}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
