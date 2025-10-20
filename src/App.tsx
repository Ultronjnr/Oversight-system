import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import InviteSignup from "./pages/InviteSignup";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy load pages that use heavy dependencies like recharts
const Dashboard = lazy(() => import("./pages/Dashboard"));
const QuoteHistory = lazy(() => import("./pages/QuoteHistory"));
const AnalyticsOverview = lazy(() => import("./pages/AnalyticsOverview"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const SuperAdminPanel = lazy(() => import("./pages/SuperAdminPanel"));

// comment out UI imports until alias is confirmed working
import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

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
            <Route path="/employee/portal" element={<Dashboard />} />
            <Route path="/hod/portal" element={<Dashboard />} />
            <Route path="/finance/portal" element={<Dashboard />} />
            <Route path="/admin/portal" element={<AdminPortal />} />
            <Route path="/superuser/portal" element={<SuperAdminPanel />} />
            <Route path="/super-admin" element={<SuperAdminPanel />} />
            <Route path="/quotes/history" element={<QuoteHistory />} />
            <Route path="/analytics" element={<AnalyticsOverview />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
