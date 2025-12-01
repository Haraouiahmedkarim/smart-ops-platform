import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import MES from "./pages/MES";
import Equipment from "./pages/Equipment";
import WorkOrders from "./pages/WorkOrders";
import Maintenance from "./pages/Maintenance";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Robots from "./pages/Robots";
import RobotDetail from "./pages/RobotDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/mes" element={<MES />} />
            <Route path="/robots" element={<Robots />} />
            <Route path="/robots/:id" element={<RobotDetail />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/work-orders" element={<WorkOrders />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
