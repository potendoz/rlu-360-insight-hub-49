import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import { AccessDenied } from "./pages/AccessDenied";
import { Dashboard } from "./pages/Dashboard";
import { Doctors } from "./pages/Doctors";
import { Reports } from "./pages/Reports";
import { Analytics } from "./pages/Analytics";
import { Analysis } from "./pages/Analysis";
import { DataInput } from "./pages/DataInput";
import { PerformanceReport } from "./pages/PerformanceReport";
import { Admin } from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/hooks/useAuth";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { SessionTimer } from "@/components/SessionTimer";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Initialize auto logout for authenticated users
  useAutoLogout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // 5 minutes warning
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctors" 
        element={
          <ProtectedRoute>
            <Layout><Doctors /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Layout><Reports /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <Layout><Analytics /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analysis" 
        element={
          <ProtectedRoute>
            <Layout><Analysis /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/data-input" 
        element={
          <ProtectedRoute>
            <Layout><DataInput /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/performance-report" 
        element={
          <ProtectedRoute>
            <Layout><PerformanceReport /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout><Admin /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/presentation" 
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Redirect authenticated users from index to their default route */}
      {isAuthenticated && (
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
      )}
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SessionTimer />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
);

export default App;
