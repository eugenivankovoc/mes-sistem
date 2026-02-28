import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ManagerLayout } from "@/layouts/ManagerLayout";
import { WorkstationLayout } from "@/layouts/WorkstationLayout";

import LoginPage from "@/pages/LoginPage";
import NoWorkstationPage from "@/pages/NoWorkstationPage";
import NotFound from "@/pages/NotFound";

import OrdersPage from "@/pages/placeholder/OrdersPage";
import OrderDetailPage from "@/pages/placeholder/OrderDetailPage";
import ArchivePage from "@/pages/placeholder/ArchivePage";
import ProgressPage from "@/pages/placeholder/ProgressPage";
import WorkstationsPage from "@/pages/placeholder/WorkstationsPage";
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
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/no-workstation" element={
              <ProtectedRoute allowedRoles={["operator"]}>
                <NoWorkstationPage />
              </ProtectedRoute>
            } />

            {/* Manager/Planner routes */}
            <Route element={
              <ProtectedRoute allowedRoles={["administrator", "planner"]}>
                <ManagerLayout />
              </ProtectedRoute>
            }>
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/workstations" element={<WorkstationsPage />} />
              <Route path="/batches" element={<BatchesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={["administrator"]}>
                  <AdminPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Workstation (operator) routes */}
            <Route element={
              <ProtectedRoute allowedRoles={["operator"]}>
                <WorkstationLayout />
              </ProtectedRoute>
            }>
              <Route path="/workstation/:id" element={
                <ProtectedRoute allowedRoles={["operator"]} requireOwnWorkstation>
                  <WorkstationViewPage />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
