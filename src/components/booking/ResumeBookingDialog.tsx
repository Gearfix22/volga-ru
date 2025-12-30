import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getLatestDraft, deleteDraftBooking, DraftBooking } from '@/services/bookingService';
import { Clock, Trash2, Play, ChevronRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ResumeBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeBooking: (draft: DraftBooking) => void;
}

export const ResumeBookingDialog: React.FC<ResumeBookingDialogProps> = ({
  isOpen,
  onClose,
  onResumeBooking
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [draft, setDraft] = useState<DraftBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadDraft();
    }
  }, [isOpen, user]);

  const loadDraft = async () => {
    try {
      setLoading(true);
      const latestDraft = await getLatestDraft();
      setDraft(latestDraft);
    } catch (error) {
      console.error('Error loading draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!draft) return;
    
    try {
      setDeleting(true);
      await deleteDraftBooking(draft.id);
      setDraft(null);
      toast({
        title: t('success'),
        description: t('booking.draftDeleted')
      });
      onClose();
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: t('error'),
        description: t('booking.errorDeletingDraft'),
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleResumeDraft = () => {
    if (!draft) return;
    onResumeBooking(draft);
    onClose();
  };

  const getProgressBadge = (progress: string) => {
    const progressMap: Record<string, { label: string; variant: 'secondary' | 'default' | 'outline' }> = {
      service_selection: { label: 'Service Selection', variant: 'secondary' },
      details_filled: { label: 'Details Filled', variant: 'default' },
      user_info_filled: { label: 'User Info Filled', variant: 'default' },
      ready_for_payment: { label: 'Ready for Payment', variant: 'default' }
    };
    
    const config = progressMap[progress] || progressMap.service_selection;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getServicePreview = (draft: DraftBooking) => {
    const details = draft.service_details as any;
    
    if (draft.service_type === 'Driver') {
      return details.pickupLocation && details.dropoffLocation
        ? `${details.pickupLocation} → ${details.dropoffLocation}`
        : 'Transportation booking in progress';
    }
    if (draft.service_type === 'Accommodation') {
      return details.location
        ? `${details.location} - ${details.guests || 1} guests`
        : 'Accommodation booking in progress';
    }
    if (draft.service_type === 'Events') {
      return details.eventType
        ? `${details.eventType} - ${details.location || 'Location TBD'}`
        : 'Events booking in progress';
    }
    return 'Booking in progress';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('booking.resumeBooking')}
          </DialogTitle>
          <DialogDescription>
            {draft ? 'You have an unfinished booking. Would you like to continue?' : 'No saved bookings found.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ) : !draft ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('booking.noDraftBookings')}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start a new booking to save your progress automatically.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{draft.service_type}</CardTitle>
                    <CardDescription>
                      Last updated {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  {getProgressBadge(draft.booking_progress)}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Service Preview */}
                <div className="text-sm">
                  <span className="font-medium">Details:</span>
                  <p className="text-muted-foreground mt-1">{getServicePreview(draft)}</p>
                </div>

                {/* User Info Preview */}
                {draft.user_info?.fullName && (
                  <div className="text-sm">
                    <span className="font-medium">Contact:</span>
                    <p className="text-muted-foreground mt-1">
                      {draft.user_info.fullName}
                      {draft.user_info.email && ` • ${draft.user_info.email}`}
                    </p>
                  </div>
                )}

                {/* Price */}
                {draft.total_price ? (
                  <div className="text-sm">
                    <span className="font-medium">Estimated Price:</span>
                    <span className="ml-2 text-primary font-semibold">${draft.total_price}</span>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleResumeDraft} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Continue Booking
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    onClick={handleDeleteDraft}
                    variant="outline"
                    size="icon"
                    disabled={deleting}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between border-t pt-4">
          <Button variant="ghost" onClick={onClose}>
            Start Fresh
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
