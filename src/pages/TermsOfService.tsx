import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/BackButton';
import { FileText, AlertTriangle, CreditCard, MapPin, Ban, Scale } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const TermsOfService = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />
      
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <BackButton />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className={cn("text-3xl flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <FileText className="h-8 w-8 text-primary" />
              {t('termsOfService.title')}
            </CardTitle>
            <p className="text-muted-foreground">{t('termsOfService.lastUpdated')}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold mb-3">{t('termsOfService.acceptanceTerms')}</h2>
              <p className="text-muted-foreground">
                {t('termsOfService.acceptanceDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t('termsOfService.servicesProvided')}</h2>
              <p className="text-muted-foreground mb-3">
                {t('termsOfService.servicesProvidedIntro')}
              </p>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li>{t('termsOfService.servicesList1')}</li>
                <li>{t('termsOfService.servicesList2')}</li>
                <li>{t('termsOfService.servicesList3')}</li>
                <li>{t('termsOfService.servicesList4')}</li>
              </ul>
            </section>

            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <CreditCard className="h-5 w-5 text-primary" />
                {t('termsOfService.paymentsPricing')}
              </h2>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li>{t('termsOfService.paymentsList1')}</li>
                <li>{t('termsOfService.paymentsList2')}</li>
                <li>{t('termsOfService.paymentsList3')}</li>
                <li>{t('termsOfService.paymentsList4')}</li>
                <li>{t('termsOfService.paymentsList5')}</li>
              </ul>
            </section>

            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <MapPin className="h-5 w-5 text-primary" />
                {t('termsOfService.locationServicesTerms')}
              </h2>
              <p className="text-muted-foreground">
                {t('termsOfService.locationServicesIntro')}
              </p>
              <ul className={cn("list-disc text-muted-foreground space-y-2 mt-2", isRTL ? "pr-6" : "pl-6")}>
                <li>{t('termsOfService.locationTermsList1')}</li>
                <li>{t('termsOfService.locationTermsList2')}</li>
                <li>{t('termsOfService.locationTermsList3')}</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                {t('termsOfService.locationTermsNote')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t('termsOfService.userResponsibilities')}</h2>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li>{t('termsOfService.userResp1')}</li>
                <li>{t('termsOfService.userResp2')}</li>
                <li>{t('termsOfService.userResp3')}</li>
                <li>{t('termsOfService.userResp4')}</li>
                <li>{t('termsOfService.userResp5')}</li>
              </ul>
            </section>

            <section className="p-4 border border-destructive/30 rounded-lg">
              <h2 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Ban className="h-5 w-5 text-destructive" />
                {t('termsOfService.prohibitedActivities')}
              </h2>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li>{t('termsOfService.prohibitedList1')}</li>
                <li>{t('termsOfService.prohibitedList2')}</li>
                <li>{t('termsOfService.prohibitedList3')}</li>
                <li>{t('termsOfService.prohibitedList4')}</li>
                <li>{t('termsOfService.prohibitedList5')}</li>
              </ul>
            </section>

            <section>
              <h2 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <AlertTriangle className="h-5 w-5 text-warning" />
                {t('termsOfService.limitationLiability')}
              </h2>
              <p className="text-muted-foreground">
                {t('termsOfService.limitationIntro')}
              </p>
              <ul className={cn("list-disc text-muted-foreground space-y-2 mt-2", isRTL ? "pr-6" : "pl-6")}>
                <li>{t('termsOfService.limitationList1')}</li>
                <li>{t('termsOfService.limitationList2')}</li>
                <li>{t('termsOfService.limitationList3')}</li>
                <li>{t('termsOfService.limitationList4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t('termsOfService.cancellationPolicy')}</h2>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li><strong>{t('termsOfService.cancellation24h')}</strong> {t('termsOfService.cancellation24hDesc')}</li>
                <li><strong>{t('termsOfService.cancellation12h')}</strong> {t('termsOfService.cancellation12hDesc')}</li>
                <li><strong>{t('termsOfService.cancellationLess12h')}</strong> {t('termsOfService.cancellationLess12hDesc')}</li>
                <li>{t('termsOfService.cancellationEmergency')}</li>
              </ul>
            </section>

            <section>
              <h2 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Scale className="h-5 w-5 text-primary" />
                {t('termsOfService.disputeResolution')}
              </h2>
              <p className="text-muted-foreground">
                {t('termsOfService.disputeDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t('termsOfService.changesToTerms')}</h2>
              <p className="text-muted-foreground">
                {t('termsOfService.changesToTermsDesc')}
              </p>
            </section>

            <section className="p-4 bg-primary/5 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">{t('termsOfService.contact')}</h2>
              <p className="text-muted-foreground">
                {t('termsOfService.contactIntro')}<br />
                <strong>{t('privacyPolicy.contactEmail')}</strong> info@volgaservices.com<br />
                <strong>{t('privacyPolicy.contactPhone')}</strong> +7 952 221 29 03
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