import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  ExternalLink, 
  Send, 
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { supportRequestSchema } from '@/lib/validationSchemas';
import { openExternalLink } from '@/hooks/useWebViewCompat';
import { cn } from '@/lib/utils';

const Support = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = supportRequestSchema.safeParse({
      subject: formData.subject,
      message: formData.message,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: t('toast.validationError'),
        description: firstError.message,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: user?.email || 'User',
          email: user?.email || '',
          subject: validation.data.subject,
          message: validation.data.message,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: t('support.requestSent'),
        description: t('support.requestSentDescription'),
      });

      setFormData({
        subject: '',
        message: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: t('toast.error'),
        description: t('support.sendFailed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout title={t('support.title')}>
      <div className="space-y-6">
        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={isRTL ? "text-right" : ""}>
                  <p className="text-sm font-medium text-muted-foreground">{t('support.whatsappSupport')}</p>
                  <p className="text-lg font-semibold">{t('support.available247')}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <Button 
                className="w-full mt-4 bg-green-600 hover:bg-green-700" 
                onClick={() => openExternalLink('https://wa.me/79522212903')}
              >
                <MessageCircle className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t('support.openWhatsApp')}
                <ExternalLink className={cn("h-4 w-4", isRTL ? "mr-2" : "ml-2")} />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={isRTL ? "text-right" : ""}>
                  <p className="text-sm font-medium text-muted-foreground">{t('support.phoneSupport')}</p>
                  <p className="text-lg font-semibold" dir="ltr">+7 952 221-29-03</p>
                </div>
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => openExternalLink('tel:+79522212903')}
              >
                <Phone className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t('support.callNow')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={isRTL ? "text-right" : ""}>
                  <p className="text-sm font-medium text-muted-foreground">{t('support.emailSupport')}</p>
                  <p className="text-lg font-semibold">{t('support.responseIn24h')}</p>
                </div>
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => openExternalLink('mailto:support@volgaservices.com')}
              >
                <Mail className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t('support.sendEmail')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <HelpCircle className="h-5 w-5" />
              {t('support.submitRequest')}
            </CardTitle>
            <CardDescription>
              {t('support.describeIssue')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">{t('support.subject')} *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                  placeholder={t('support.subjectPlaceholder')}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.subject.length}/200 {t('support.characters')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('support.message')} *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  placeholder={t('support.messagePlaceholder')}
                  rows={6}
                  maxLength={2000}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length}/2000 {t('support.characters')}
                </p>
              </div>

              <div className={cn("flex", isRTL ? "justify-start" : "justify-end")}>
                <Button type="submit" disabled={loading}>
                  <Send className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {loading ? t('support.sending') : t('support.sendRequest')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('support.faq')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-b pb-4">
              <h4 className="font-medium mb-2">{t('support.faqModifyBooking')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('support.faqModifyBookingAnswer')}
              </p>
            </div>
            
            <div className="border-b pb-4">
              <h4 className="font-medium mb-2">{t('support.faqPaymentMethods')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('support.faqPaymentMethodsAnswer')}
              </p>
            </div>
            
            <div className="border-b pb-4">
              <h4 className="font-medium mb-2">{t('support.faqCancelBooking')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('support.faqCancelBookingAnswer')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Support;
