import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/BackButton';
import { Shield, MapPin, Phone, CreditCard, Bell, Trash2, Download, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const PrivacyPolicy = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />
      
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <BackButton />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className={cn("text-3xl flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <Shield className="h-8 w-8 text-primary" />
              {t('privacyPolicy.title')}
            </CardTitle>
            <p className="text-muted-foreground">{t('privacyPolicy.lastUpdated')}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-8">
            
            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Phone className="h-5 w-5 text-primary" />
                {t('privacyPolicy.phoneUsage')}
              </h2>
              <p className="text-muted-foreground mb-3">
                <strong>{t('privacyPolicy.phoneUsageIntro')}</strong>
              </p>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li>{t('privacyPolicy.phoneUsageList1')}</li>
                <li>{t('privacyPolicy.phoneUsageList2')}</li>
                <li>{t('privacyPolicy.phoneUsageList3')}</li>
                <li>{t('privacyPolicy.phoneUsageList4')}</li>
                <li>{t('privacyPolicy.phoneUsageList5')}</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                {t('privacyPolicy.phoneUsageNote')}
              </p>
            </section>

            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <MapPin className="h-5 w-5 text-primary" />
                {t('privacyPolicy.locationServices')}
              </h2>
              <p className="text-muted-foreground mb-3">
                <strong>{t('privacyPolicy.locationServicesIntro')}</strong>
              </p>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li>{t('privacyPolicy.locationServicesList1')}</li>
                <li>{t('privacyPolicy.locationServicesList2')}</li>
                <li>{t('privacyPolicy.locationServicesList3')}</li>
                <li>{t('privacyPolicy.locationServicesList4')}</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-sm bg-green-500/10 p-2 rounded">
                {t('privacyPolicy.locationServicesNote1')}<br />
                {t('privacyPolicy.locationServicesNote2')}<br />
                {t('privacyPolicy.locationServicesNote3')}
              </p>
            </section>

            <section className="p-4 bg-muted/50 rounded-lg">
              <h2 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <CreditCard className="h-5 w-5 text-primary" />
                {t('privacyPolicy.paymentInfo')}
              </h2>
              <p className="text-muted-foreground mb-3">
                <strong>{t('privacyPolicy.paymentInfoIntro')}</strong>
              </p>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li>{t('privacyPolicy.paymentInfoList1')}</li>
                <li>{t('privacyPolicy.paymentInfoList2')}</li>
                <li>{t('privacyPolicy.paymentInfoList3')}</li>
                <li>{t('privacyPolicy.paymentInfoList4')}</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                {t('privacyPolicy.paymentInfoNote')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t('privacyPolicy.infoWeCollect')}</h2>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li><strong>{t('privacyPolicy.infoPersonal')}</strong> {t('privacyPolicy.infoPersonalDesc')}</li>
                <li><strong>{t('privacyPolicy.infoBooking')}</strong> {t('privacyPolicy.infoBookingDesc')}</li>
                <li><strong>{t('privacyPolicy.infoLocation')}</strong> {t('privacyPolicy.infoLocationDesc')}</li>
                <li><strong>{t('privacyPolicy.infoPayment')}</strong> {t('privacyPolicy.infoPaymentDesc')}</li>
                <li><strong>{t('privacyPolicy.infoDevice')}</strong> {t('privacyPolicy.infoDeviceDesc')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t('privacyPolicy.dataSecurity')}</h2>
              <p className="text-muted-foreground">
                {t('privacyPolicy.dataSecurityDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t('privacyPolicy.thirdPartyServices')}</h2>
              <ul className={cn("list-disc text-muted-foreground space-y-2", isRTL ? "pr-6" : "pl-6")}>
                <li><strong>{t('privacyPolicy.thirdPartySupabase')}</strong> {t('privacyPolicy.thirdPartySupabaseDesc')}</li>
                <li><strong>{t('privacyPolicy.thirdPartyMapbox')}</strong> {t('privacyPolicy.thirdPartyMapboxDesc')}</li>
                <li><strong>{t('privacyPolicy.thirdPartyPayment')}</strong> {t('privacyPolicy.thirdPartyPaymentDesc')}</li>
              </ul>
              <p className="text-muted-foreground mt-2 text-sm">
                {t('privacyPolicy.thirdPartyNote')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t('privacyPolicy.dataRetention')}</h2>
              <p className="text-muted-foreground">
                {t('privacyPolicy.dataRetentionDesc')}
              </p>
            </section>

            <section className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-3">{t('privacyPolicy.yourRights')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Download className="h-4 w-4" />
                  {t('privacyPolicy.rightExport')}
                </div>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Trash2 className="h-4 w-4" />
                  {t('privacyPolicy.rightDelete')}
                </div>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <Bell className="h-4 w-4" />
                  {t('privacyPolicy.rightNotify')}
                </div>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <MapPin className="h-4 w-4" />
                  {t('privacyPolicy.rightLocation')}
                </div>
              </div>
            </section>

            <section className="p-4 bg-primary/5 rounded-lg">
              <h2 className={cn("text-xl font-semibold mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Mail className="h-5 w-5" />
                {t('privacyPolicy.contactUs')}
              </h2>
              <p className="text-muted-foreground">
                {t('privacyPolicy.contactUsIntro')}<br />
                <strong>{t('privacyPolicy.contactEmail')}</strong> info@volgaservices.com<br />
                <strong>{t('privacyPolicy.contactPhone')}</strong> +7 952 221 29 03<br />
                <strong>{t('privacyPolicy.contactAddress')}</strong> {t('privacyPolicy.contactAddressValue')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t('privacyPolicy.policyUpdates')}</h2>
              <p className="text-muted-foreground">
                {t('privacyPolicy.policyUpdatesDesc')}
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