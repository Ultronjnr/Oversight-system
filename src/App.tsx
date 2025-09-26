import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import QuoteHistory from "./pages/QuoteHistory";
import AnalyticsOverview from "./pages/AnalyticsOverview";
import AdminPortal from "./pages/AdminPortal";
import SuperAdminPanel from "./pages/SuperAdminPanel";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

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
