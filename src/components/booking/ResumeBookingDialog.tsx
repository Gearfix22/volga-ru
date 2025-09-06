import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDraftBookings, deleteDraftBooking, DraftBooking } from '@/services/bookingService';
import { Clock, Trash2, Play, ChevronRight } from 'lucide-react';
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
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadDrafts();
    }
  }, [isOpen, user]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const draftBookings = await getDraftBookings();
      setDrafts(draftBookings);
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast({
        title: t('error'),
        description: t('booking.errorLoadingDrafts'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      setDeleting(draftId);
      await deleteDraftBooking(draftId);
      setDrafts(drafts.filter(d => d.id !== draftId));
      toast({
        title: t('success'),
        description: t('booking.draftDeleted')
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: t('error'),
        description: t('booking.errorDeletingDraft'),
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleResumeDraft = (draft: DraftBooking) => {
    onResumeBooking(draft);
    onClose();
    
    // Navigate to booking page with resume parameter
    navigate('/booking', { 
      state: { 
        resumeDraft: draft,
        service: draft.service_type.toLowerCase() 
      } 
    });
  };

  const getProgressBadge = (progress: DraftBooking['booking_progress']) => {
    const progressMap = {
      service_selection: { label: t('booking.serviceSelection'), variant: 'secondary' as const },
      details_filled: { label: t('booking.detailsFilled'), variant: 'default' as const },
      user_info_filled: { label: t('booking.userInfoFilled'), variant: 'default' as const },
      ready_for_payment: { label: t('booking.readyForPayment'), variant: 'default' as const }
    };
    
    const config = progressMap[progress] || progressMap.service_selection;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('booking.resumeBooking')}
          </DialogTitle>
          <DialogDescription>
            {t('booking.resumeBookingDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('booking.noDraftBookings')}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {t('booking.noDraftBookingsDescription')}
                </p>
              </CardContent>
            </Card>
          ) : (
            drafts.map((draft) => (
              <Card key={draft.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{draft.service_type}</CardTitle>
                      <CardDescription>
                        {t('booking.lastUpdated')}: {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    {getProgressBadge(draft.booking_progress)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Service Details Preview */}
                    {Object.keys(draft.service_details).length > 0 && (
                      <div className="text-sm">
                        <strong>{t('booking.serviceDetails')}:</strong>
                        <div className="mt-1 text-gray-600">
                          {draft.service_type === 'Transportation' && (
                            <span>{(draft.service_details as any).pickup} → {(draft.service_details as any).dropoff}</span>
                          )}
                          {draft.service_type === 'Hotels' && (
                            <span>{(draft.service_details as any).city} - {(draft.service_details as any).roomType}</span>
                          )}
                          {draft.service_type === 'Events' && (
                            <span>{(draft.service_details as any).eventName} - {(draft.service_details as any).eventLocation}</span>
                          )}
                          {draft.service_type === 'Custom Trips' && (
                            <span>{(draft.service_details as any).regions} ({(draft.service_details as any).duration})</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* User Info Preview */}
                    {draft.user_info.fullName && (
                      <div className="text-sm">
                        <strong>{t('booking.contactInfo')}:</strong> {draft.user_info.fullName}
                        {draft.user_info.email && ` (${draft.user_info.email})`}
                      </div>
                    )}

                    {/* Price */}
                    {draft.total_price && (
                      <div className="text-sm">
                        <strong>{t('booking.estimatedPrice')}:</strong> ${draft.total_price}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleResumeDraft(draft)}
                        className="flex-1"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {t('booking.continueBooking')}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteDraft(draft.id)}
                        variant="outline"
                        size="sm"
                        disabled={deleting === draft.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};