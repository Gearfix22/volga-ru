/**
 * DYNAMIC SERVICE FORM
 * 
 * Renders form inputs dynamically based on service_inputs from database
 * Supports any service type without hardcoded fields
 * Falls back to legacy forms for backward compatibility
 */

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, MapPin, FileText, Users, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { ServiceDetails } from '@/types/booking';

interface ServiceInputOption {
  value: string;
  label: string;
}

interface ServiceInput {
  id: string;
  input_key: string;
  label: string;
  label_en: string | null;
  label_ar: string | null;
  label_ru: string | null;
  input_type: string;
  placeholder: string | null;
  placeholder_en: string | null;
  placeholder_ar: string | null;
  placeholder_ru: string | null;
  options: ServiceInputOption[] | null;
  is_required: boolean;
  validation_rules: Record<string, any> | null;
  default_value: string | null;
  display_order: number;
}

// Transform database row to typed ServiceInput
const transformServiceInput = (row: any): ServiceInput => ({
  id: row.id,
  input_key: row.input_key,
  label: row.label,
  label_en: row.label_en,
  label_ar: row.label_ar,
  label_ru: row.label_ru,
  input_type: row.input_type,
  placeholder: row.placeholder,
  placeholder_en: row.placeholder_en,
  placeholder_ar: row.placeholder_ar,
  placeholder_ru: row.placeholder_ru,
  options: row.options as ServiceInputOption[] | null,
  is_required: row.is_required ?? false,
  validation_rules: row.validation_rules as Record<string, any> | null,
  default_value: row.default_value,
  display_order: row.display_order ?? 0
});

interface DynamicServiceFormProps {
  serviceId: string | null;
  serviceType: string;
  serviceDetails: ServiceDetails;
  onUpdateDetail: (key: string, value: string | string[]) => void;
}

export const DynamicServiceForm: React.FC<DynamicServiceFormProps> = ({
  serviceId,
  serviceType,
  serviceDetails,
  onUpdateDetail
}) => {
  const { t, language, isRTL } = useLanguage();
  const [inputs, setInputs] = useState<ServiceInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const details = serviceDetails as Record<string, any>;

  // Ref to track if defaults have been applied to prevent infinite loops
  const defaultsAppliedRef = React.useRef(false);
  const onUpdateDetailRef = React.useRef(onUpdateDetail);
  onUpdateDetailRef.current = onUpdateDetail;
  
  // Fetch service inputs from database
  useEffect(() => {
    const fetchInputs = async () => {
      if (!serviceId && !serviceType) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('service_inputs')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (serviceId) {
          query = query.eq('service_id', serviceId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('Error fetching service inputs:', fetchError);
          setError('Failed to load form fields');
          setInputs([]);
        } else {
          // Transform raw data to typed ServiceInput
          const transformedInputs = (data || []).map(transformServiceInput);
          setInputs(transformedInputs);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load form fields');
      } finally {
        setLoading(false);
      }
    };

    fetchInputs();
  }, [serviceId, serviceType]);
  
  // Apply default values ONCE after inputs load - separate effect to prevent loops
  useEffect(() => {
    if (inputs.length === 0 || defaultsAppliedRef.current) return;
    
    // Mark defaults as applied immediately to prevent re-runs
    defaultsAppliedRef.current = true;
    
    // Apply defaults for inputs that need them
    inputs.forEach((input) => {
      if (input.default_value && !details[input.input_key]) {
        onUpdateDetailRef.current(input.input_key, input.default_value);
      }
    });
  }, [inputs, details]);

  // Get localized label
  const getLocalizedLabel = (input: ServiceInput): string => {
    switch (language) {
      case 'ar':
        return input.label_ar || input.label_en || input.label;
      case 'ru':
        return input.label_ru || input.label_en || input.label;
      default:
        return input.label_en || input.label;
    }
  };

  // Get localized placeholder
  const getLocalizedPlaceholder = (input: ServiceInput): string => {
    switch (language) {
      case 'ar':
        return input.placeholder_ar || input.placeholder_en || input.placeholder || '';
      case 'ru':
        return input.placeholder_ru || input.placeholder_en || input.placeholder || '';
      default:
        return input.placeholder_en || input.placeholder || '';
    }
  };

  // Get icon for input type
  const getInputIcon = (inputKey: string, inputType: string) => {
    if (inputKey.toLowerCase().includes('location') || inputKey.toLowerCase().includes('city') || inputKey.toLowerCase().includes('address')) {
      return <MapPin className="h-4 w-4" />;
    }
    if (inputType === 'date') {
      return <Calendar className="h-4 w-4" />;
    }
    if (inputType === 'time') {
      return <Clock className="h-4 w-4" />;
    }
    if (inputKey.toLowerCase().includes('people') || inputKey.toLowerCase().includes('guest') || inputKey.toLowerCase().includes('passenger')) {
      return <Users className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  // Render individual input based on type
  const renderInput = (input: ServiceInput) => {
    const label = getLocalizedLabel(input);
    const placeholder = getLocalizedPlaceholder(input);
    const value = details[input.input_key] || '';
    const icon = getInputIcon(input.input_key, input.input_type);

    switch (input.input_type) {
      case 'select':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.input_key} className="flex items-center gap-2">
              {icon}
              {label} {input.is_required && '*'}</Label>
            <Select
              value={value || undefined}
              onValueChange={(val) => val && onUpdateDetail(input.input_key, val)}
            >
              <SelectTrigger className={!value ? 'text-muted-foreground' : ''}>
                <SelectValue placeholder={placeholder || `Select ${label}`} />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {(input.options || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'textarea':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.input_key} className="flex items-center gap-2">
              {icon}
              {label} {input.is_required && '*'}</Label>
            <Textarea
              id={input.input_key}
              value={value}
              onChange={(e) => onUpdateDetail(input.input_key, e.target.value)}
              placeholder={placeholder}
              rows={4}
              maxLength={input.validation_rules?.maxLength || 1000}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div key={input.id} className="flex items-center space-x-2">
            <Checkbox
              id={input.input_key}
              checked={value === 'true' || value === true}
              onCheckedChange={(checked) => onUpdateDetail(input.input_key, String(checked))}
            />
            <Label htmlFor={input.input_key} className="cursor-pointer">
              {label} {input.is_required && '*'}</Label>
          </div>
        );

      case 'number':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.input_key} className="flex items-center gap-2">
              {icon}
              {label} {input.is_required && '*'}</Label>
            <Input
              id={input.input_key}
              type="number"
              value={value}
              onChange={(e) => onUpdateDetail(input.input_key, e.target.value)}
              placeholder={placeholder}
              min={input.validation_rules?.min}
              max={input.validation_rules?.max}
            />
          </div>
        );

      case 'date':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.input_key} className="flex items-center gap-2">
              {icon}
              {label} {input.is_required && '*'}</Label>
            <Input
              id={input.input_key}
              type="date"
              value={value}
              onChange={(e) => onUpdateDetail(input.input_key, e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        );

      case 'time':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.input_key} className="flex items-center gap-2">
              {icon}
              {label} {input.is_required && '*'}</Label>
            <Input
              id={input.input_key}
              type="time"
              value={value}
              onChange={(e) => onUpdateDetail(input.input_key, e.target.value)}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.input_key} className="flex items-center gap-2">
              {icon}
              {label} {input.is_required && '*'}</Label>
            <Input
              id={input.input_key}
              type="text"
              value={value}
              onChange={(e) => onUpdateDetail(input.input_key, e.target.value)}
              placeholder={placeholder}
              maxLength={input.validation_rules?.maxLength || 200}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (inputs.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('booking.noCustomFieldsConfigured') || 'Please fill in your requirements below.'}
          </AlertDescription>
        </Alert>
        
        {/* Fallback: generic request field */}
        <div className="space-y-2">
          <Label htmlFor="requirements" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('booking.requirements') || 'Your Requirements'} *
          </Label>
          <Textarea
            id="requirements"
            value={details.requirements || ''}
            onChange={(e) => onUpdateDetail('requirements', e.target.value)}
            placeholder={t('booking.describeYourNeeds') || 'Please describe what you need...'}
            rows={5}
            maxLength={2000}
          />
        </div>
      </div>
    );
  }

  // Group inputs by type for better layout
  const dateTimeInputs = inputs.filter(i => i.input_type === 'date' || i.input_type === 'time');
  const selectInputs = inputs.filter(i => i.input_type === 'select');
  const textInputs = inputs.filter(i => i.input_type === 'text' || i.input_type === 'number');
  const otherInputs = inputs.filter(i => !['date', 'time', 'select', 'text', 'number'].includes(i.input_type));

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Text inputs */}
      {textInputs.length > 0 && (
        <div className="space-y-4">
          {textInputs.map(renderInput)}
        </div>
      )}

      {/* Date/Time inputs in grid */}
      {dateTimeInputs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dateTimeInputs.map(renderInput)}
        </div>
      )}

      {/* Select inputs in grid */}
      {selectInputs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectInputs.map(renderInput)}
        </div>
      )}

      {/* Other inputs (textarea, checkbox, etc.) */}
      {otherInputs.length > 0 && (
        <div className="space-y-4">
          {otherInputs.map(renderInput)}
        </div>
      )}
    </div>
  );
};

export default DynamicServiceForm;
