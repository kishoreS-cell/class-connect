import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateClass from "./pages/CreateClass";
import JoinClass from "./pages/JoinClass";
import ClassDetail from "./pages/ClassDetail";
import Notifications from "./pages/Notifications";
import GpaCalculator from "./pages/GpaCalculator";
import Calculator from "./pages/Calculator";
import Quiz from "./pages/Quiz";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/class/new" element={<CreateClass />} />
            <Route path="/class/:id" element={<ClassDetail />} />
            <Route path="/join-class" element={<JoinClass />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/gpa-calculator" element={<GpaCalculator />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
