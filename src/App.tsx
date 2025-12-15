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
import { UserRouteGuard } from "@/components/auth/UserRouteGuard";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import BookingConfirmation from "./pages/BookingConfirmation";
import DashboardActivity from "./pages/DashboardActivity";
import Dashboard from "./pages/Dashboard";
import DashboardReservations from "./pages/DashboardReservations";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardPayments from "./pages/DashboardPayments";
import EnhancedBooking from "./pages/EnhancedBooking";
import EnhancedPayment from "./pages/EnhancedPayment";
import EnhancedDashboard from "./pages/EnhancedDashboard";
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
import DriverDashboard from "./pages/DriverDashboard";
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
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/services" element={<Services />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/enhanced-booking" element={<EnhancedBooking />} />
                <Route path="/enhanced-payment" element={<EnhancedPayment />} />
                <Route path="/user-dashboard" element={<UserDashboard />} />
                <Route path="/enhanced-confirmation" element={<EnhancedConfirmation />} />
                <Route path="/profile-settings" element={<ProfileSettings />} />
                <Route path="/support" element={<Support />} />
                <Route path="/payments-history" element={<PaymentsHistory />} />
                
                {/* Admin Routes - Protected by AdminRouteGuard */}
                <Route path="/admin-login" element={<AdminLogin />} />
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
                
                {/* Legacy Dashboard Routes - Redirect to user dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/enhanced-dashboard" element={<Navigate to="/user-dashboard" replace />} />
                <Route path="/dashboard/reservations" element={<DashboardReservations />} />
                <Route path="/dashboard/activity" element={<DashboardActivity />} />
                <Route path="/dashboard/settings" element={<DashboardSettings />} />
                <Route path="/dashboard/payments" element={<DashboardPayments />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
