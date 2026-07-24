import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Login } from './components/auth/Login';
import { CoordinatorDashboard } from './components/coordinator/CoordinatorDashboard';
import { FinancerDashboard } from './components/financer/FinancerDashboard';
import { PrincipalDashboard } from './components/principal/PrincipalDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

function AuthenticatedRoutes() {
  const { user, role, loading, dbId } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-12 text-slate-500 font-medium font-sans">Verifying security credentials...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route 
            path="/" 
            element={
              role === 'Coordinator' ? <CoordinatorDashboard user={{ id: dbId || 0, name: user.email || '', email: user.email || '', role }} /> :
              role === 'Financer' ? <FinancerDashboard user={{ id: dbId || 0, name: user.email || '', email: user.email || '', role }} /> :
              role === 'Principal' ? <PrincipalDashboard user={{ id: dbId || 0, name: user.email || '', email: user.email || '', role }} /> :
              role === 'Admin' ? <AdminDashboard /> :
              <div className="text-center p-12"><h2 className="text-2xl font-bold">Welcome</h2><p>Your role is {role}. Pending administrator setup.</p></div>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AuthenticatedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
