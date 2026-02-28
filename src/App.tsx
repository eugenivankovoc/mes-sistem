import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageTitleProvider } from "@/contexts/PageTitleContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ManagerLayout } from "@/layouts/ManagerLayout";
import { AssistLayout } from "@/layouts/AssistLayout";

import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NoWorkstationPage from "@/pages/NoWorkstationPage";
import NotFound from "@/pages/NotFound";

import OrdersPage from "@/pages/placeholder/OrdersPage";
import OrderDetailPage from "@/pages/placeholder/OrderDetailPage";
import ArchivePage from "@/pages/placeholder/ArchivePage";
import ProgressPage from "@/pages/placeholder/ProgressPage";
import BatchesPage from "@/pages/placeholder/BatchesPage";
import ReportsPage from "@/pages/placeholder/ReportsPage";
import AdminPage from "@/pages/placeholder/AdminPage";
import WorkstationViewPage from "@/pages/placeholder/WorkstationViewPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PageTitleProvider>
            <Routes>
              {/* Public routes – no layout */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* No-workstation error page – auth required, no layout */}
              <Route path="/no-workstation" element={
                <AuthGuard>
                  <NoWorkstationPage />
                </AuthGuard>
              } />

              {/* Manager/Planner routes – ManagerLayout */}
              <Route element={
                <AuthGuard>
                  <ProtectedRoute allowedRoles={["administrator", "planner"]}>
                    <ManagerLayout />
                  </ProtectedRoute>
                </AuthGuard>
              }>
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/batches" element={<BatchesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={["administrator"]}>
                    <AdminPage />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Operator routes – AssistLayout */}
              <Route element={
                <AuthGuard>
                  <ProtectedRoute allowedRoles={["operator"]}>
                    <AssistLayout />
                  </ProtectedRoute>
                </AuthGuard>
              }>
                <Route path="/workstation/:id" element={
                  <ProtectedRoute allowedRoles={["operator"]} requireOwnWorkstation>
                    <WorkstationViewPage />
                  </ProtectedRoute>
                } />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTitleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
