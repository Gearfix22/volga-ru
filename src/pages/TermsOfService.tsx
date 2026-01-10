import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/BackButton';
import { FileText, AlertTriangle, CreditCard, MapPin, Ban, Scale } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <BackButton />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Terms of Service
            </CardTitle>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using the Volga Services mobile application ("App"), you agree to be 
                bound by these Terms of Service. If you do not agree, do not use the App.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Services Provided</h2>
              <p className="text-muted-foreground mb-3">
                Volga Services provides tourism-related booking services in Russia including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Transportation services with professional drivers</li>
                <li>Accommodation booking assistance</li>
                <li>Event tickets and entertainment access</li>
                <li>Tourist guide services</li>
              </ul>
            </section>

            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                3. Payments & Pricing
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>All prices are quoted in USD and subject to admin confirmation</li>
                <li>Final pricing is set by our admin team after reviewing your booking request</li>
                <li>Payment is required before service confirmation</li>
                <li>Accepted payment methods: Credit/Debit Card, Bank Transfer, Cash</li>
                <li>Refunds are handled on a case-by-case basis</li>
              </ul>
            </section>

            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                4. Location Services
              </h2>
              <p className="text-muted-foreground">
                During active bookings, we may collect location data to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Provide real-time driver/guide tracking</li>
                <li>Calculate estimated arrival times</li>
                <li>Optimize routes for transportation services</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                Location access is only requested during active trips and can be disabled in your device settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. User Responsibilities</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate personal and booking information</li>
                <li>Be present at designated pickup locations on time</li>
                <li>Treat drivers and guides with respect</li>
                <li>Comply with local laws and regulations</li>
                <li>Not use the App for any illegal purposes</li>
              </ul>
            </section>

            <section className="p-4 border border-destructive/30 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" />
                6. Prohibited Activities
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Fraudulent bookings or payment information</li>
                <li>Harassment of drivers, guides, or staff</li>
                <li>Misuse of the App or its services</li>
                <li>Attempting to bypass security measures</li>
                <li>Sharing account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                7. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                Volga Services acts as an intermediary connecting tourists with service providers. 
                We are not liable for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Actions of independent drivers or guides</li>
                <li>Weather-related service disruptions</li>
                <li>Third-party service failures</li>
                <li>Personal injury during services (except where legally required)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cancellation Policy</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>24+ hours before:</strong> Full refund minus processing fees</li>
                <li><strong>12-24 hours before:</strong> 50% refund</li>
                <li><strong>Less than 12 hours:</strong> No refund</li>
                <li>Emergency cancellations reviewed individually</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                9. Dispute Resolution
              </h2>
              <p className="text-muted-foreground">
                Any disputes will first be handled through our customer support. 
                If unresolved, disputes shall be settled under Russian Federation law, 
                with jurisdiction in Leningrad Region courts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Continued use of the App 
                after changes constitutes acceptance of new terms.
              </p>
            </section>

            <section className="p-4 bg-primary/5 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms:<br />
                <strong>Email:</strong> info@volgaservices.com<br />
                <strong>Phone:</strong> +7 952 221 29 03
              </p>
            </section>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;