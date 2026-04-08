import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import GuardLogin from "./pages/GuardLogin";
import GuardDashboard from "./pages/GuardDashboard";
import VisitorLogin from "./pages/VisitorLogin";
import VisitorForm from "./pages/VisitorForm";
import ResidentLogin from "./pages/ResidentLogin";
import ResidentPortal from "./pages/ResidentPortal";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Each role has its own login URL - no shared landing page */}
            <Route path="/" element={<Navigate to="/guard" replace />} />
            
            {/* Guard */}
            <Route path="/guard" element={<GuardLogin />} />
            <Route path="/guard/dashboard" element={
              <ProtectedRoute requiredRole="guard" loginPath="/guard">
                <GuardDashboard />
              </ProtectedRoute>
            } />

            {/* Visitor */}
            <Route path="/visitor" element={<VisitorLogin />} />
            <Route path="/visitor/form" element={
              <ProtectedRoute requiredRole="visitor" loginPath="/visitor">
                <VisitorForm />
              </ProtectedRoute>
            } />

            {/* Resident */}
            <Route path="/resident" element={<ResidentLogin />} />
            <Route path="/resident/dashboard" element={
              <ProtectedRoute requiredRole="resident" loginPath="/resident">
                <ResidentPortal />
              </ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin" loginPath="/admin">
                <AdminPanel />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
