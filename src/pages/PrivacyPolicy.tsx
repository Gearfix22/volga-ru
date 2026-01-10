import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/BackButton';
import { Shield, MapPin, Phone, CreditCard, Bell, Trash2, Download, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <BackButton />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Privacy Policy
            </CardTitle>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-8">
            
            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Phone Number Usage
              </h2>
              <p className="text-muted-foreground mb-3">
                <strong>We collect your phone number for the following purposes:</strong>
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Account authentication and verification</li>
                <li>Booking confirmations and updates via SMS</li>
                <li>Driver/guide communication during active trips</li>
                <li>Emergency contact during service delivery</li>
                <li>Customer support communications</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                Your phone number is stored securely and never shared with third parties for marketing purposes.
              </p>
            </section>

            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location Services
              </h2>
              <p className="text-muted-foreground mb-3">
                <strong>Location access is requested ONLY during active trips for:</strong>
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Real-time driver/guide tracking during your booking</li>
                <li>Estimated arrival time calculations</li>
                <li>Route optimization for transportation services</li>
                <li>AI Tourist Guide location-based recommendations</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-sm bg-green-500/10 p-2 rounded">
                ✓ Location data is collected ONLY during active bookings<br />
                ✓ Location data is NOT stored after trip completion<br />
                ✓ You can revoke location permission at any time in your device settings
              </p>
            </section>

            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Information
              </h2>
              <p className="text-muted-foreground mb-3">
                <strong>We process payments securely:</strong>
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Credit/debit card payments processed via secure third-party payment processors</li>
                <li>Bank transfer details verified by our admin team</li>
                <li>Cash payments recorded upon service completion</li>
                <li>Payment receipts stored for booking verification</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                We do NOT store full credit card numbers. All payment processing is PCI-DSS compliant.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Personal:</strong> Name, email, phone number</li>
                <li><strong>Booking:</strong> Service preferences, travel dates, special requests</li>
                <li><strong>Location:</strong> GPS coordinates during active trips only</li>
                <li><strong>Payment:</strong> Transaction records (not full card details)</li>
                <li><strong>Device:</strong> Device type, OS version for app optimization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Data Security</h2>
              <p className="text-muted-foreground">
                All data transmission is encrypted using HTTPS/TLS. Your data is stored on secure 
                Supabase servers with industry-standard security measures including encryption at rest, 
                role-based access control, and regular security audits.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Third-Party Services</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Supabase:</strong> Database and authentication</li>
                <li><strong>Mapbox:</strong> Maps and location services</li>
                <li><strong>Payment Processors:</strong> Secure payment handling</li>
              </ul>
              <p className="text-muted-foreground mt-2 text-sm">
                Each service operates under their own privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
              <p className="text-muted-foreground">
                Booking data retained for 2 years for legal/tax purposes. Location data deleted 
                immediately after trip completion. You may request data deletion at any time.
              </p>
            </section>

            <section className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export your data
                </div>
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Request data deletion
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Opt-out of notifications
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Revoke location access
                </div>
              </div>
            </section>

            <section className="p-4 bg-primary/5 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </h2>
              <p className="text-muted-foreground">
                For privacy-related inquiries:<br />
                <strong>Email:</strong> info@volgaservices.com<br />
                <strong>Phone:</strong> +7 952 221 29 03<br />
                <strong>Address:</strong> Russian Federation
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Policy Updates</h2>
              <p className="text-muted-foreground">
                We may update this policy periodically. Continued use of the app after changes 
                constitutes acceptance of the updated policy.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;