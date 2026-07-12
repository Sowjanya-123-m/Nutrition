import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Salad, LayoutDashboard, PlusCircle, User, LogOut, ShieldAlert, Sparkles } from 'lucide-react';

export const UnavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm shadow-slate-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand Section */}
          <div className="flex items-center">
            <Link to="/home" className="flex items-center space-x-2">
              <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-md shadow-emerald-500/20">
                <Salad className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-800">
                Nutri<span className="text-emerald-500">Assistant</span>
              </span>
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex ml-10 space-x-2">
              <Link
                to="/home"
                className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive('/home')
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="link-home"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{user?.role === 'admin' ? 'Admin Board' : 'Dashboard'}</span>
              </Link>

              <Link
                to="/new-plan"
                className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive('/new-plan')
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="link-new-plan"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Diet Plan</span>
              </Link>

              <Link
                to="/ai-chat"
                className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive('/ai-chat')
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="link-ai-chat"
              >
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>AI Coach</span>
              </Link>

              <Link
                to="/profile"
                className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive('/profile')
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="link-profile"
              >
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </div>
          </div>

          {/* User Meta & Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end text-right hidden sm:flex">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                {user?.name}
                {user?.role === 'admin' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-100">
                    <ShieldAlert className="h-2.5 w-2.5 mr-0.5" />
                    Admin
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-400 font-mono truncate max-w-[150px]">
                {user?.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-100 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 active:scale-95 transition-all duration-200"
              id="btn-logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
