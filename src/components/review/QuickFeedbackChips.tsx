/**
 * Quick Feedback Chips Component
 * Allows users to quickly select feedback options
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickFeedbackChipsProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  type: 'positive' | 'improvement';
  maxSelections?: number;
}

export function QuickFeedbackChips({
  options,
  selected,
  onChange,
  type,
  maxSelections = 3
}: QuickFeedbackChipsProps) {
  const { t } = useTranslation();

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else if (selected.length < maxSelections) {
      onChange([...selected, option]);
    }
  };

  const baseStyles = 'px-3 py-1.5 rounded-full text-sm font-medium transition-all touch-manipulation border';
  
  const getStyles = (isSelected: boolean) => {
    if (isSelected) {
      return type === 'positive'
        ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
        : 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700';
    }
    return 'bg-muted/50 text-muted-foreground border-border hover:bg-muted';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const isDisabled = !isSelected && selected.length >= maxSelections;

        return (
          <button
            key={option}
            type="button"
            onClick={() => !isDisabled && toggleOption(option)}
            disabled={isDisabled}
            className={cn(
              baseStyles,
              getStyles(isSelected),
              isDisabled && 'opacity-50 cursor-not-allowed',
              'active:scale-95'
            )}
          >
            {isSelected && <Check className="h-3 w-3 inline mr-1" />}
            {t(`review.aspects.${option}`, option.replace(/_/g, ' '))}
          </button>
        );
      })}
    </div>
  );
}
