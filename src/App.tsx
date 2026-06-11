import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import GuardLogin from "./pages/GuardLogin";
import GuardDashboard from "./pages/GuardDashboard";
import VisitorForm from "./pages/VisitorForm";
import ResidentLogin from "./pages/ResidentLogin";
import ResidentPortal from "./pages/ResidentPortal";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import Register from "./pages/Register";
import SocietyRegister from "./pages/SocietyRegister";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <main>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-society" element={<SocietyRegister />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Super admin */}
            <Route path="/super-admin" element={<SuperAdminDashboard />} />

            {/* Guard */}
            <Route path="/guard" element={<GuardLogin />} />
            <Route path="/guard/dashboard" element={
              <ProtectedRoute requiredRole="guard" loginPath="/guard">
                <GuardDashboard />
              </ProtectedRoute>
            } />

            {/* Visitor - public form, no login required */}
            <Route path="/visitor/form" element={<VisitorForm />} />

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
          </main>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
