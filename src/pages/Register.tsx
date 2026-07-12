import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LNavbar } from '../components/LNavbar';
import { UserPlus, User, Mail, Key, Sparkles, Activity, Weight, Ruler, ChevronRight, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<
    'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active'
  >('Moderately Active');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !age || !height || !weight || !activityLevel) {
      setError('Please fill in all health profiles and account details.');
      return;
    }

    if (Number(age) < 1 || Number(age) > 120) {
      setError('Please provide a realistic biological age (1-120).');
      return;
    }

    if (Number(height) < 50 || Number(height) > 280) {
      setError('Please provide a realistic height in cm (50-280).');
      return;
    }

    if (Number(weight) < 10 || Number(weight) > 500) {
      setError('Please provide a realistic weight in kg (10-500).');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        activityLevel,
      };

      const response = await axios.post('/api/users/register', payload);
      const { token, user } = response.data;
      login(token, user);
      navigate('/home');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to complete registration. Try another email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill a sample profile to let the user test instantly with a single button
  const autofillHealthyProfile = () => {
    setName('Sowjanya Mulamuri');
    setEmail('mulamurisowjanya31@gmail.com');
    setPassword('sowjanya123');
    setAge('26');
    setGender('Female');
    setHeight('164');
    setWeight('62');
    setActivityLevel('Moderately Active');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <LNavbar />

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Glow Effects */}
        <div className="absolute top-1/4 right-1/4 w-[30rem] h-[30rem] bg-emerald-100/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 left-1/4 w-[30rem] h-[30rem] bg-teal-100/10 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
                Create Biological Profile
              </h2>
              <p className="text-sm text-slate-500">
                Register to calculate custom calorie and nutrition plans.
              </p>
            </div>
            <button
              type="button"
              onClick={autofillHealthyProfile}
              className="inline-flex items-center space-x-1.5 px-4 py-2 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all self-start sm:self-center shrink-0"
              id="btn-autofill-register"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Fill Sowjanya Sample Profile</span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-2.5 text-rose-700 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            {/* Split layout: Account details and health metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Account Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono border-b border-slate-50 pb-1">
                  1. ACCOUNT CREDENTIALS
                </h3>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

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
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Health Metrics */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono border-b border-slate-50 pb-1">
                  2. PHYSIOLOGICAL METRICS
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Age */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                      Age (Years)
                    </label>
                    <input
                      id="reg-age"
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                      placeholder="28"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                      Gender
                    </label>
                    <select
                      id="reg-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Height */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5 text-slate-400" />
                      Height (cm)
                    </label>
                    <input
                      id="reg-height"
                      type="number"
                      required
                      min="50"
                      max="280"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                      placeholder="175"
                    />
                  </div>

                  {/* Weight */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block flex items-center gap-1">
                      <Weight className="h-3.5 w-3.5 text-slate-400" />
                      Weight (kg)
                    </label>
                    <input
                      id="reg-weight"
                      type="number"
                      required
                      min="10"
                      max="500"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                      placeholder="70"
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    Physical Activity Level
                  </label>
                  <select
                    id="reg-activity"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all bg-white"
                  >
                    <option value="Sedentary">Sedentary (Little or no exercise)</option>
                    <option value="Lightly Active">Lightly Active (Exercise 1-3 days/week)</option>
                    <option value="Moderately Active">Moderately Active (Exercise 3-5 days/week)</option>
                    <option value="Very Active">Very Active (Exercise 6-7 days/week)</option>
                    <option value="Extra Active">Extra Active (Very hard work/physical job)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-600/20 active:scale-[0.99]"
                id="btn-register-submit"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Create My Account & Plan</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center text-sm text-slate-500 pt-2">
            Already have a biological profile?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
