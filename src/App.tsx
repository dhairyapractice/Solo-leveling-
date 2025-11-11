import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Stats from "./pages/Stats";
import Quests from "./pages/Quests";
import Battles from "./pages/Battles";
import Shop from "./pages/Shop";
import Rewards from "./pages/Rewards";
import Badges from "./pages/Badges";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Stats />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Quests />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/battles"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Battles />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Shop />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Rewards />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/badges"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Badges />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
