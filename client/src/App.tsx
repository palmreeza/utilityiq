import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AssessmentList from "./pages/AssessmentList";
import AssessmentCreate from "./pages/AssessmentCreate";
import AssessmentWorkspace from "./pages/AssessmentWorkspace";
import ResultsDashboard from "./pages/ResultsDashboard";
import RoadmapPage from "./pages/RoadmapPage";
import ReportPage from "./pages/ReportPage";
import AuditLogPage from "./pages/AuditLogPage";
import AdminPanel from "./pages/AdminPanel";
import OrganisationSettings from "./pages/OrganisationSettings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/org/:orgId/assessments" component={AssessmentList} />
      <Route path="/org/:orgId/assessments/create" component={AssessmentCreate} />
      <Route path="/assessment/:id/workspace" component={AssessmentWorkspace} />
      <Route path="/assessment/:id/results" component={ResultsDashboard} />
      <Route path="/assessment/:id/roadmap" component={RoadmapPage} />
      <Route path="/assessment/:id/report" component={ReportPage} />
      <Route path="/assessment/:id/audit" component={AuditLogPage} />
      <Route path="/org/:orgId/settings" component={OrganisationSettings} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.16 0.012 240)",
                border: "1px solid oklch(0.22 0.015 240)",
                color: "oklch(0.96 0.005 240)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
