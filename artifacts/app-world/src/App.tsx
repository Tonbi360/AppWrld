import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import AppDetail from "@/pages/app-detail";
import Submit from "@/pages/submit";
import FeedbackPage from "@/pages/feedback";
import Admin from "@/pages/admin";
import DevPortal from "@/pages/dev";
import Dashboard from "@/pages/dashboard";
import StatusPage from "@/pages/status";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/app/:id" component={AppDetail} />
      <Route path="/submit" component={Submit} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/status/:id" component={StatusPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <Admin />
        </ProtectedRoute>
      </Route>
      <Route path="/dev">
        <ProtectedRoute requiredRole="developer">
          <DevPortal />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <InstallBanner />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
