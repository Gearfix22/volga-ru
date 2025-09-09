import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
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
                <Route path="/enhanced-dashboard" element={<UserDashboard />} />
                <Route path="/enhanced-confirmation" element={<EnhancedConfirmation />} />
                <Route path="/profile-settings" element={<ProfileSettings />} />
                <Route path="/support" element={<Support />} />
                <Route path="/payments-history" element={<PaymentsHistory />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/bookings" element={<BookingsManagement />} />
                
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/reservations" element={<DashboardReservations />} />
                <Route path="/dashboard/activity" element={<DashboardActivity />} />
                <Route path="/dashboard/settings" element={<DashboardSettings />} />
                <Route path="/dashboard/payments" element={<DashboardPayments />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
