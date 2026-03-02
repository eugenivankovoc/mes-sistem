import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageTitleProvider } from "@/contexts/PageTitleContext";
import { AuthGuard } from "@/components/AuthGuard";
import { PublicRoute } from "@/components/PublicRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ManagerLayout } from "@/layouts/ManagerLayout";
import { AssistLayout } from "@/layouts/AssistLayout";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NoWorkstationPage from "@/pages/NoWorkstationPage";
import NotFound from "@/pages/NotFound";

// Lazy-loaded route pages
const OrdersPage = React.lazy(() => import("@/pages/placeholder/OrdersPage"));
const OrderDetailPage = React.lazy(() => import("@/pages/placeholder/OrderDetailPage"));
const ArchivePage = React.lazy(() => import("@/pages/placeholder/ArchivePage"));
const ProgressPage = React.lazy(() => import("@/pages/placeholder/ProgressPage"));
const BatchesPage = React.lazy(() => import("@/pages/placeholder/BatchesPage"));
const ReportsPage = React.lazy(() => import("@/pages/placeholder/ReportsPage"));
const AdminPage = React.lazy(() => import("@/pages/placeholder/AdminPage"));
const WorkstationViewPage = React.lazy(() => import("@/pages/placeholder/WorkstationViewPage"));

const queryClient = new QueryClient();

function RouteSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function AppShell() {
  useKeyboardShortcuts();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/no-workstation" element={<AuthGuard><NoWorkstationPage /></AuthGuard>} />

      {/* Manager/Planner routes */}
      <Route element={
        <AuthGuard>
          <ProtectedRoute allowedRoles={["administrator", "planner"]}>
            <ManagerLayout />
          </ProtectedRoute>
        </AuthGuard>
      }>
        <Route path="/orders" element={<RouteSuspense><OrdersPage /></RouteSuspense>} />
        <Route path="/orders/:id" element={<RouteSuspense><OrderDetailPage /></RouteSuspense>} />
        <Route path="/archive" element={<RouteSuspense><ArchivePage /></RouteSuspense>} />
        <Route path="/progress" element={<RouteSuspense><ProgressPage /></RouteSuspense>} />
        <Route path="/batches" element={<RouteSuspense><BatchesPage /></RouteSuspense>} />
        <Route path="/reports" element={<RouteSuspense><ReportsPage /></RouteSuspense>} />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["administrator"]} showForbidden>
            <RouteSuspense><AdminPage /></RouteSuspense>
          </ProtectedRoute>
        } />
      </Route>

      {/* Operator routes */}
      <Route element={
        <AuthGuard>
          <ProtectedRoute allowedRoles={["operator"]}>
            <AssistLayout />
          </ProtectedRoute>
        </AuthGuard>
      }>
        <Route path="/workstation/:id" element={
          <ProtectedRoute allowedRoles={["operator"]} requireOwnWorkstation>
            <RouteSuspense><WorkstationViewPage /></RouteSuspense>
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PageTitleProvider>
            <AppShell />
          </PageTitleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
