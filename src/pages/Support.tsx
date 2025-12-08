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
  Clock,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { supportRequestSchema } from '@/lib/validationSchemas';

const Support = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with zod schema
    const validation = supportRequestSchema.safeParse({
      subject: formData.subject,
      message: formData.message,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Validation Error',
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
        title: 'Support Request Sent',
        description: 'We will get back to you within 24 hours.',
      });

      setFormData({
        subject: '',
        message: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send support request. Please try again.',
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
    <DashboardLayout title="Support Center">
      <div className="space-y-6">
        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">WhatsApp Support</p>
                  <p className="text-lg font-semibold">24/7 Available</p>
                </div>
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <Button 
                className="w-full mt-4 bg-green-600 hover:bg-green-700" 
                onClick={() => window.open('https://wa.me/79522212903', '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Open WhatsApp
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone Support</p>
                  <p className="text-lg font-semibold">+7 952 221-29-03</p>
                </div>
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => window.open('tel:+79522212903', '_self')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email Support</p>
                  <p className="text-lg font-semibold">Response in 24h</p>
                </div>
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => window.open('mailto:support@volgaservices.com', '_blank')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Submit Support Request
            </CardTitle>
            <CardDescription>
              Describe your issue and we'll help you resolve it quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                  placeholder="Brief description of your issue"
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.subject.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  placeholder="Provide detailed information about your issue, including any error messages..."
                  rows={6}
                  maxLength={2000}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length}/2000 characters
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-b pb-4">
              <h4 className="font-medium mb-2">How do I modify my booking?</h4>
              <p className="text-sm text-muted-foreground">
                You can modify your booking by contacting our support team via WhatsApp or phone. 
                Modifications are subject to availability and may incur additional charges.
              </p>
            </div>
            
            <div className="border-b pb-4">
              <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept cash payments, credit/debit cards via Stripe, and bank transfers. 
                All payment methods are secure and encrypted.
              </p>
            </div>
            
            <div className="border-b pb-4">
              <h4 className="font-medium mb-2">How do I cancel my booking?</h4>
              <p className="text-sm text-muted-foreground">
                Cancellation policies vary by service type. Please contact support for assistance 
                with cancellations and refund information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Support;