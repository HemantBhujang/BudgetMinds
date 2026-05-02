import { BrainCircuit, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Navbar() {
  const { user, role, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
            <BrainCircuit size={20} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            BudgetMinds
          </h1>
        </div>

        {user && (
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-900">{user.email}</span>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1 self-end">
                {role || 'Loading...'}
              </span>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2"
              title="Sign Out"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium sr-only sm:not-sr-only">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
