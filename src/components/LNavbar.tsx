import React from 'react';
import { Link } from 'react-router-dom';
import { Salad, LogIn, UserPlus } from 'lucide-react';

export const LNavbar: React.FC = () => {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <Salad className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-800">
                Nutri<span className="text-emerald-500">Assistant</span>
              </span>
            </Link>
          </div>

          {/* Action Links */}
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
              id="btn-login-nav"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all duration-200"
              id="btn-register-nav"
            >
              <UserPlus className="h-4 w-4" />
              <span>Get Started</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
