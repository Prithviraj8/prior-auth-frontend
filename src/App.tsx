import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Feature imports
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import LoginPage from "@/features/auth/pages/LoginPage";
import { AuthRequestProvider } from "@/features/prior-auth/contexts/AuthRequestContext";
import Index from "@/features/prior-auth/pages/Index";
import NewRequestPage from "@/features/prior-auth/pages/NewRequestPage";
import RequestDetailPage from "@/features/prior-auth/pages/RequestDetailPage";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AuthRequestProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/request/:id"
                element={
                  <ProtectedRoute>
                    <RequestDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-request"
                element={
                  <ProtectedRoute>
                    <NewRequestPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthRequestProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
