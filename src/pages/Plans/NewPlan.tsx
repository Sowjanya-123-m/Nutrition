import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { UnavBar } from '../../components/UnavBar';
import { NewSuggestion } from './NewSuggestion';
import {
  Sparkles,
  TrendingUp,
  Apple,
  TrendingDown,
  Activity,
  Calculator,
  PlusCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const NewPlan: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Form parameters initialized from standard user profile properties
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [height, setHeight] = useState(user?.height ? String(user.height) : '');
  const [weight, setWeight] = useState(user?.weight ? String(user.weight) : '');
  const [activityLevel, setActivityLevel] = useState<'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active'>(
    (user?.activityLevel as any) || 'Moderately Active'
  );
  const [weightGoal, setWeightGoal] = useState<'Weight Loss' | 'Maintain Weight' | 'Weight Gain'>('Weight Loss');

  useEffect(() => {
    if (user) {
      if (!age && user.age) setAge(String(user.age));
      if (!height && user.height) setHeight(String(user.height));
      if (!weight && user.weight) setWeight(String(user.weight));
      if (user.activityLevel) setActivityLevel(user.activityLevel);
    }
  }, [user]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!age || !height || !weight || !weightGoal || !activityLevel) {
      setError('Please fill in all physiological parameters and goals.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        weightGoal,
      };

      const response = await axios.post('/api/suggestions/create', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedPlan = response.data;
      // Delay navigation slightly to let the gorgeous loader perform a complete cycle
      setTimeout(() => {
        navigate(`/suggestion/${savedPlan._id}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to generate plan. Please verify server connectivity.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <UnavBar />
        <div className="flex-grow flex items-center justify-center">
          <NewSuggestion />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <UnavBar />

      <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
          <div className="border-b border-slate-100 pb-5 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono uppercase">
              <PlusCircle className="h-3.5 w-3.5" />
              Configure Health Goals
            </span>
            <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
              Design Nutrition Blueprint
            </h1>
            <p className="text-sm text-slate-500">
              Customize your biological inputs and weight goals. Leave fields as default to use your profile.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-2.5 text-rose-700 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Goal selector cards */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                Target Weight Goal
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Weight Loss */}
                <button
                  type="button"
                  onClick={() => setWeightGoal('Weight Loss')}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all duration-200 active:scale-[0.98] ${
                    weightGoal === 'Weight Loss'
                      ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                  id="btn-goal-loss"
                >
                  <TrendingDown className={`h-6 w-6 ${weightGoal === 'Weight Loss' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-sm">Weight Loss</h3>
                    <p className="text-xs text-slate-400 leading-snug mt-1">Caloric deficit optimized to shed fat and retain lean mass.</p>
                  </div>
                </button>

                {/* Maintain Weight */}
                <button
                  type="button"
                  onClick={() => setWeightGoal('Maintain Weight')}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all duration-200 active:scale-[0.98] ${
                    weightGoal === 'Maintain Weight'
                      ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                  id="btn-goal-maintain"
                >
                  <Activity className={`h-6 w-6 ${weightGoal === 'Maintain Weight' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-sm">Maintain Weight</h3>
                    <p className="text-xs text-slate-400 leading-snug mt-1">Equilibrium energy intake to fuel biological homeostasis.</p>
                  </div>
                </button>

                {/* Weight Gain */}
                <button
                  type="button"
                  onClick={() => setWeightGoal('Weight Gain')}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all duration-200 active:scale-[0.98] ${
                    weightGoal === 'Weight Gain'
                      ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                  id="btn-goal-gain"
                >
                  <TrendingUp className={`h-6 w-6 ${weightGoal === 'Weight Gain' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-sm">Weight Gain</h3>
                    <p className="text-xs text-slate-400 leading-snug mt-1">Structured caloric surplus for muscle building and energy storage.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Overrides form fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Age */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                  Current Age (Years)
                </label>
                <input
                  id="plan-age"
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all"
                />
              </div>

              {/* Height */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                  Height (cm)
                </label>
                <input
                  id="plan-height"
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
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                  Weight (kg)
                </label>
                <input
                  id="plan-weight"
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

            {/* Activity selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono block">
                Active Metabolic Level
              </label>
              <select
                id="plan-activity"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm bg-white"
              >
                <option value="Sedentary">Sedentary (Little or no exercise)</option>
                <option value="Lightly Active">Lightly Active (Exercise 1-3 days/week)</option>
                <option value="Moderately Active">Moderately Active (Exercise 3-5 days/week)</option>
                <option value="Very Active">Very Active (Exercise 6-7 days/week)</option>
                <option value="Extra Active">Extra Active (Very hard work/physical job)</option>
              </select>
            </div>

            {/* Explanatory notice */}
            <div className="p-4 bg-slate-50 rounded-2xl flex items-start space-x-3 text-xs text-slate-500 border border-slate-100">
              <HelpCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                By clicking <strong>Calculate AI Plan</strong>, our systems will perform full biological BMR modeling via Mifflin-St Jeor math. Then, the parameters are sent to Google Gemini AI to construct a high-fidelity dietary roadmap featuring active timing protocols and clean foods.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center space-x-2 py-4 px-4 border border-transparent rounded-2xl text-base font-semibold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-600/30 active:scale-[0.99]"
              id="btn-plan-generate"
            >
              <Sparkles className="h-5 w-5 animate-pulse text-white" />
              <span>Calculate AI Nutrition Plan</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
