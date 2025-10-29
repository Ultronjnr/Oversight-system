import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import InviteSignup from "./pages/InviteSignup";
import NotFound from "./pages/NotFound";
import LogoPreloader from "./components/LogoPreloader";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy load pages that use heavy dependencies like recharts
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EmployeePortal = lazy(() => import("./pages/EmployeePortal"));
const HODPortal = lazy(() => import("./pages/HODPortal"));
const FinancePortal = lazy(() => import("./pages/FinancePortal"));
const QuoteHistory = lazy(() => import("./pages/QuoteHistory"));
const PurchaseRequisitionHistory = lazy(() => import("./pages/PurchaseRequisitionHistory"));
const AnalyticsOverview = lazy(() => import("./pages/AnalyticsOverview"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const SuperAdminPanel = lazy(() => import("./pages/SuperAdminPanel"));

// comment out UI imports until alias is confirmed working
import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

// Loading component for lazy-loaded pages - uses Logo Preloader
const LoadingFallback = () => <LogoPreloader />;

const App = () => {
  console.log('App component rendering...');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/invite" element={<InviteSignup />} />
            <Route path="/employee/portal" element={<Suspense fallback={<LoadingFallback />}><EmployeePortal /></Suspense>} />
            <Route path="/hod/portal" element={<Suspense fallback={<LoadingFallback />}><HODPortal /></Suspense>} />
            <Route path="/finance/portal" element={<Suspense fallback={<LoadingFallback />}><FinancePortal /></Suspense>} />
            <Route path="/admin/portal" element={<Suspense fallback={<LoadingFallback />}><AdminPortal /></Suspense>} />
            <Route path="/superuser/portal" element={<Suspense fallback={<LoadingFallback />}><SuperAdminPanel /></Suspense>} />
            <Route path="/super-admin" element={<Suspense fallback={<LoadingFallback />}><SuperAdminPanel /></Suspense>} />
            <Route path="/quotes/history" element={<Suspense fallback={<LoadingFallback />}><QuoteHistory /></Suspense>} />
            <Route path="/pr-history" element={<Suspense fallback={<LoadingFallback />}><PurchaseRequisitionHistory /></Suspense>} />
            <Route path="/analytics" element={<Suspense fallback={<LoadingFallback />}><AnalyticsOverview /></Suspense>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
