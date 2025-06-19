
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/EnhancedLanguageContext';
import type { UserInfo } from '@/types/booking';

interface BookingSubmitButtonProps {
  serviceType: string;
  userInfo: UserInfo;
  isSubmitting: boolean;
}

export const BookingSubmitButton: React.FC<BookingSubmitButtonProps> = ({
  serviceType,
  userInfo,
  isSubmitting
}) => {
  const { t } = useLanguage();

  const isDisabled = !serviceType || !userInfo.fullName || !userInfo.email || !userInfo.phone || isSubmitting;

  return (
    <div className="text-center">
      <Button 
        type="submit" 
        size="lg" 
        className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        disabled={isDisabled}
      >
        {isSubmitting ? "Saving..." : t('proceedToPayment')}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};
