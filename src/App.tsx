import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from '@/components/DoctorDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import Interview from './pages/Interview';
import Documents from './pages/Documents';
import Training from './pages/Training';
import ProfessionalTraining from '@/components/ProfessionalTraining';
import Profile from './pages/Profile';
import Applications from './pages/admin/Applications';
import Administrators from './pages/admin/Administrators';
import Uploads from './pages/admin/Uploads';
import Settings from './pages/admin/Settings';
import Interviews from './pages/admin/Interviews';
import Forms from './pages/admin/Forms';
import AdminTraining from './pages/admin/Training';
import NotFound from './pages/NotFound';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

function AppContent() {
  // Desabilitando autenticação temporariamente
  const isAuthenticated = true; // Sempre true por enquanto
  const isAuthPage = false; // Sempre false para acessar dashboards

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/professional" element={<DoctorDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/training" element={<ProfessionalTraining />} />
            <Route path="/training/professional" element={<ProfessionalTraining />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/applications" element={<Applications />} />
            <Route path="/admin/interviews" element={<Interviews />} />
            <Route path="/admin/forms" element={<Forms />} />
            <Route path="/admin/training" element={<AdminTraining />} />
            <Route path="/admin/administrators" element={<Administrators />} />
            <Route path="/admin/uploads" element={<Uploads />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
