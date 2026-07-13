import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LNavbar } from '../components/LNavbar';
import { LogIn, Key, Mail, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/users/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
      navigate('/home');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick helper to pre-fill standard credentials for rapid agent and user testing
  const autofillDemo = (role: 'user' | 'admin' | 'sowjanya') => {
    if (role === 'user') {
      setEmail('user@example.com');
      setPassword('password123');
    } else if (role === 'admin') {
      setEmail('admin@nutrition.com');
      setPassword('admin123');
    } else {
      setEmail('mulamurisowjanya31@gmail.com');
      setPassword('sowjanya123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <LNavbar />

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-100/20 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100"
        >
          <div className="text-center space-y-2">
            <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-sm text-slate-500">
              Access your personalized nutrition matrices and history.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-2.5 text-rose-700 text-sm animate-shake">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all bg-slate-50/50"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all bg-slate-50/50"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-600/20 active:scale-[0.99]"
                id="btn-login-submit"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Autofill section */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono block text-center">
              Quick Sandbox Testing Access
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => autofillDemo('user')}
                className="inline-flex flex-col items-center justify-center space-y-1 p-2 border border-slate-100 rounded-xl text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all text-center"
                id="btn-autofill-user"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                <span>User Demo</span>
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('admin')}
                className="inline-flex flex-col items-center justify-center space-y-1 p-2 border border-slate-100 rounded-xl text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all text-center"
                id="btn-autofill-admin"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                <span>Admin Demo</span>
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('sowjanya')}
                className="inline-flex flex-col items-center justify-center space-y-1 p-2 border border-slate-100 rounded-xl text-[10px] font-semibold text-slate-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 active:scale-95 transition-all text-center"
                id="btn-autofill-sowjanya"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span>Clinical Admin</span>
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-500">
              Sign up now
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
