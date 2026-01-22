/**
 * Star Rating Component
 * Touch-friendly star rating input
 */

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
}

export function StarRating({ 
  value, 
  onChange, 
  size = 'md', 
  disabled = false,
  label 
}: StarRatingProps) {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9'
  };

  const gaps = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2'
  };

  const handleClick = (rating: number) => {
    if (disabled) return;
    // Toggle off if clicking same value
    onChange(value === rating ? 0 : rating);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <div className={cn('flex items-center', gaps[size])}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={disabled}
            className={cn(
              'transition-all duration-150 touch-manipulation',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 active:scale-95'
            )}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={cn(
                sizes[size],
                'transition-colors',
                star <= value
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-muted-foreground/40'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
