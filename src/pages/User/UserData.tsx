import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { UnavBar } from '../../components/UnavBar';
import { BmiCalculator } from '../../components/BmiCalculator';
import {
  User,
  Ruler,
  Weight,
  Activity,
  HeartPulse,
  Save,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';

export const UserData: React.FC = () => {
  const { user, token, updateUserInContext } = useAuth();
  const navigate = useNavigate();

  // Form parameters matching the schema fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<
    'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active'
  >('Moderately Active');

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize fields on load
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (user) {
      setName(user.name);
      setAge(String(user.age));
      setGender(user.gender);
      setHeight(String(user.height));
      setWeight(String(user.weight));
      setActivityLevel(user.activityLevel);
    }
  }, [user, token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !age || !height || !weight || !activityLevel) {
      setError('Please provide all physiological details.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        activityLevel,
      };

      const response = await axios.put('/api/users/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Synchronize state back into global context
      updateUserInContext({
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        age: Number(response.data.age),
        gender: response.data.gender,
        height: Number(response.data.height),
        weight: Number(response.data.weight),
        activityLevel: response.data.activityLevel,
        role: response.data.role,
      });

      setSuccess('Your medical characteristics have been updated successfully.');
      // clear success text after 4 seconds
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update bio profile parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <UnavBar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
          <div className="border-b border-slate-100 pb-5 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono uppercase">
              <Settings className="h-3.5 w-3.5" />
              Manage Profile
            </span>
            <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
              Biometric Characteristics
            </h1>
            <p className="text-sm text-slate-500">
              Update your body metrics to keep calorie equations and diet plan BMR algorithms fully aligned.
            </p>
          </div>

          {/* Toast / Message Indicators */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start space-x-2.5 text-emerald-800 text-sm animate-fade-in">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-2.5 text-rose-700 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleUpdateProfile}>
            {/* Split Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono border-b border-slate-50 pb-1">
                  Primary Information
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
                      id="prof-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono block">
                    Linked Email Address (ReadOnly)
                  </label>
                  <div className="relative">
                    <input
                      id="prof-email"
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="block w-full px-4 py-2.5 border border-slate-100 bg-slate-50/50 rounded-2xl text-slate-400 text-sm cursor-not-allowed font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Physical stats */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono border-b border-slate-50 pb-1">
                  Somatic Measurements
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Age */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                      Age (Years)
                    </label>
                    <input
                      id="prof-age"
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                      Gender
                    </label>
                    <select
                      id="prof-gender"
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
                      id="prof-height"
                      type="number"
                      required
                      min="50"
                      max="280"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                    />
                  </div>

                  {/* Weight */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block flex items-center gap-1">
                      <Weight className="h-3.5 w-3.5 text-slate-400" />
                      Weight (kg)
                    </label>
                    <input
                      id="prof-weight"
                      type="number"
                      required
                      min="10"
                      max="500"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Level */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                Physical Activity Level
              </label>
              <select
                id="prof-activity"
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

            <div className="p-4 bg-slate-50 rounded-2xl flex items-start space-x-3 text-xs text-slate-500 border border-slate-100">
              <HeartPulse className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                By maintaining precise body measurements, any upcoming diet plans you formulate will execute with premium diagnostic accuracy. We advise updating this section whenever your body weight shifts by more than 2 kilograms.
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-600/25 active:scale-[0.99]"
              id="btn-profile-save"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </form>
          </div>

          <div className="lg:col-span-5">
            <BmiCalculator
              initialHeight={Number(height) || undefined}
              initialWeight={Number(weight) || undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
