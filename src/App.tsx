import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SplashScreen } from "@/components/SplashScreen";
import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";
import { DriverRouteGuard } from "@/components/auth/DriverRouteGuard";
import { CustomerRouteGuard } from "@/components/auth/CustomerRouteGuard";
import { GuideRouteGuard } from "@/components/auth/GuideRouteGuard";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import BookingConfirmation from "./pages/BookingConfirmation";
import EnhancedBooking from "./pages/EnhancedBooking";
import EnhancedPayment from "./pages/EnhancedPayment";
import EnhancedConfirmation from "./pages/EnhancedConfirmation";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import Support from "./pages/Support";
import PaymentsHistory from "./pages/PaymentsHistory";
import AdminDashboard from "./components/admin/AdminDashboard";
import BookingsManagement from "./components/admin/BookingsManagement";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import DriverLogin from "./pages/DriverLogin";
import DriverDashboard from "./pages/DriverDashboard";
import GuideLogin from "./pages/GuideLogin";
import GuideDashboard from "./pages/GuideDashboard";
import { FloatingWhatsAppButton } from "./components/FloatingWhatsAppButton";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <LanguageProvider>
            <ErrorBoundary>
              <BrowserRouter>
              <Routes>
                {/* Customer Pages - Protected from driver-only users */}
                <Route path="/" element={
                  <CustomerRouteGuard>
                    <Index />
                  </CustomerRouteGuard>
                } />
                <Route path="/auth" element={<Auth />} />
                <Route path="/services" element={
                  <CustomerRouteGuard>
                    <Services />
                  </CustomerRouteGuard>
                } />
                <Route path="/gallery" element={
                  <CustomerRouteGuard>
                    <Gallery />
                  </CustomerRouteGuard>
                } />
                <Route path="/about" element={
                  <CustomerRouteGuard>
                    <About />
                  </CustomerRouteGuard>
                } />
                <Route path="/contact" element={
                  <CustomerRouteGuard>
                    <Contact />
                  </CustomerRouteGuard>
                } />
                <Route path="/booking" element={
                  <CustomerRouteGuard>
                    <Booking />
                  </CustomerRouteGuard>
                } />
                <Route path="/payment" element={
                  <CustomerRouteGuard>
                    <Payment />
                  </CustomerRouteGuard>
                } />
                <Route path="/booking-confirmation" element={
                  <CustomerRouteGuard>
                    <BookingConfirmation />
                  </CustomerRouteGuard>
                } />
                <Route path="/enhanced-booking" element={
                  <CustomerRouteGuard>
                    <EnhancedBooking />
                  </CustomerRouteGuard>
                } />
                <Route path="/enhanced-payment" element={
                  <CustomerRouteGuard>
                    <EnhancedPayment />
                  </CustomerRouteGuard>
                } />
                <Route path="/user-dashboard" element={
                  <CustomerRouteGuard>
                    <UserDashboard />
                  </CustomerRouteGuard>
                } />
                <Route path="/enhanced-confirmation" element={
                  <CustomerRouteGuard>
                    <EnhancedConfirmation />
                  </CustomerRouteGuard>
                } />
                <Route path="/profile-settings" element={
                  <CustomerRouteGuard>
                    <ProfileSettings />
                  </CustomerRouteGuard>
                } />
                <Route path="/support" element={
                  <CustomerRouteGuard>
                    <Support />
                  </CustomerRouteGuard>
                } />
                <Route path="/payments-history" element={
                  <CustomerRouteGuard>
                    <PaymentsHistory />
                  </CustomerRouteGuard>
                } />
                
                {/* Auth Routes - Accessible to all */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/driver-login" element={<DriverLogin />} />
                <Route path="/guide-login" element={<GuideLogin />} />
                
                {/* Admin Routes - Protected by AdminRouteGuard */}
                <Route path="/admin" element={
                  <AdminRouteGuard>
                    <AdminPanel />
                  </AdminRouteGuard>
                } />
                <Route path="/admin/dashboard" element={
                  <AdminRouteGuard>
                    <AdminDashboard />
                  </AdminRouteGuard>
                } />
                <Route path="/admin/bookings" element={
                  <AdminRouteGuard>
                    <BookingsManagement />
                  </AdminRouteGuard>
                } />
                
                {/* Driver Routes - Protected by DriverRouteGuard */}
                <Route path="/driver-dashboard" element={
                  <DriverRouteGuard>
                    <DriverDashboard />
                  </DriverRouteGuard>
                } />
                
                {/* Guide Routes - Protected by GuideRouteGuard */}
                <Route path="/guide-dashboard" element={
                  <GuideRouteGuard>
                    <GuideDashboard />
                  </GuideRouteGuard>
                } />
                
                {/* Legacy redirects */}
                <Route path="/dashboard" element={<Navigate to="/user-dashboard" replace />} />
                <Route path="/enhanced-dashboard" element={<Navigate to="/user-dashboard" replace />} />
                <Route path="/dashboard/reservations" element={<Navigate to="/user-dashboard" replace />} />
                <Route path="/dashboard/activity" element={<Navigate to="/user-dashboard" replace />} />
                <Route path="/dashboard/settings" element={<Navigate to="/profile-settings" replace />} />
                <Route path="/dashboard/payments" element={<Navigate to="/payments-history" replace />} />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FloatingWhatsAppButton />
              </BrowserRouter>
            </ErrorBoundary>
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
