import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import Index from './pages/Index';
import AdminAuth from './pages/AdminAuth';
import ProfessionalAuth from './pages/ProfessionalAuth';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from '@/components/DoctorDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import Interview from './pages/Interview';
import Documents from './pages/Documents';
import Training from './pages/Training';
import ProfessionalTraining from '@/components/ProfessionalTraining';
import WorkTools from './pages/WorkTools';
import Profile from './pages/Profile';
import Applications from './pages/admin/Applications';
import Administrators from './pages/admin/Administrators';
import Uploads from './pages/admin/Uploads';
import Settings from './pages/admin/Settings';
import Interviews from './pages/admin/Interviews';
import Forms from './pages/admin/Forms';
import AdminTraining from './pages/admin/Training';
import EditTraining from './pages/admin/EditTraining';
import SystemTesterPage from './pages/admin/SystemTester';
import NotFound from './pages/NotFound';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

function AppContent() {
  const { user, loading, profile } = useAuth();
  const isAuthenticated = !!user;
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath === '/auth' || currentPath === '/admin/auth' || currentPath === '/professional/auth' || currentPath === '/';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  // If not authenticated, check which login to show based on path
  if (!isAuthenticated) {
    // If trying to access admin routes, redirect to admin auth
    if (currentPath.startsWith('/admin') || currentPath === '/dashboard/admin') {
      return (
        <div className="min-h-screen">
          <Routes>
            <Route path="*" element={<AdminAuth />} />
          </Routes>
        </div>
      );
    }
    
    // For all other unauthenticated routes, show appropriate auth pages
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<ProfessionalAuth />} />
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route path="/professional/auth" element={<ProfessionalAuth />} />
          <Route path="*" element={<ProfessionalAuth />} />
        </Routes>
      </div>
    );
  }

  // If authenticated but trying to access auth pages, redirect based on role
  if (isAuthPage && isAuthenticated && profile) {
    if (profile.role === 'admin') {
      window.location.href = '/dashboard/admin';
      return null;
    } else {
      window.location.href = '/dashboard/professional';
      return null;
    }
  }

  // Protected routes with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        {/* Mobile Header */}
        <header className="lg:hidden bg-background border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <img 
            src="/lovable-uploads/2336be0c-c6ff-4907-8e1e-6b26e1176660.png" 
            alt="Lasmar Telemed" 
            className="h-8 w-auto"
          />
          <SidebarTrigger className="p-2 hover:bg-muted rounded-md" />
        </header>

        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/professional" element={<DoctorDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/training" element={<ProfessionalTraining />} />
              <Route path="/training/professional" element={<ProfessionalTraining />} />
              <Route path="/work-tools" element={<WorkTools />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/applications" element={<Applications />} />
              <Route path="/admin/interviews" element={<Interviews />} />
              <Route path="/admin/forms" element={<Forms />} />
              <Route path="/admin/training" element={<AdminTraining />} />
              <Route path="/admin/edit-interview" element={<div className="p-8">Em desenvolvimento</div>} />
              <Route path="/admin/edit-forms" element={<div className="p-8">Em desenvolvimento</div>} />
              <Route path="/admin/edit-training" element={<EditTraining />} />
              <Route path="/admin/administrators" element={<Administrators />} />
              <Route path="/admin/uploads" element={<Uploads />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/system-tester" element={<SystemTesterPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
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
