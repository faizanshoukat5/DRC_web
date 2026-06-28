import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import AnalysisPage from "@/pages/analysis";
import ResultsPage from "@/pages/results";
import SettingsPage from "@/pages/settings";
import LandingPage from "@/pages/landing";
import PatientDashboard from "@/pages/patient-dashboard";
import DoctorDashboard from "@/pages/doctor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import PendingDoctor from "@/pages/pending-doctor";
import SelectDoctor from "@/pages/select-doctor";
import FAQPage from "@/pages/faq";
import HistoryPage from "@/pages/history";
import PrivacyPage from "@/pages/privacy";
import DeleteAccountPage from "@/pages/delete-account";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import AuthConfirmPage from "@/pages/auth-confirm";

function Router() {
  const { isAuthenticated, isLoading, isPasswordRecovery, role, doctorStatus } = useAuth();
  const [location] = useLocation();

  // Email-confirmation links land here; render regardless of auth state so the
  // verifyOtp handler runs cleanly without a NotFound flash during the
  // unauthenticated -> authenticated transition.
  if (location === "/auth/confirm") {
    return <AuthConfirmPage />;
  }

  // Always show reset-password page when coming from a reset email link
  if (isPasswordRecovery) {
    return <ResetPasswordPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/delete-account" component={DeleteAccountPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (role === "patient") {
    return (
      <Switch>
        <Route path="/" component={PatientDashboard} />
        <Route path="/patient" component={PatientDashboard} />
        <Route path="/select-doctor" component={SelectDoctor} />
        <Route path="/results" component={HistoryPage} />
        <Route path="/results/:id" component={ResultsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/delete-account" component={DeleteAccountPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (role === "doctor") {
    if (doctorStatus !== "approved") {
      return (
        <Switch>
          <Route path="/" component={PendingDoctor} />
          <Route component={PendingDoctor} />
        </Switch>
      );
    }

    return (
      <Switch>
        <Route path="/" component={DoctorDashboard} />
        <Route path="/results" component={HistoryPage} />
        <Route path="/results/:id" component={ResultsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/delete-account" component={DeleteAccountPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (role === "admin") {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/results" component={HistoryPage} />
        <Route path="/results/:id" component={ResultsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/delete-account" component={DeleteAccountPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
