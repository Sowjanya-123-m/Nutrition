import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { UnavBar } from '../../components/UnavBar';
import { Suggestion } from '../../types';
import {
  ArrowLeft,
  Calendar,
  Zap,
  Flame,
  Apple,
  Clock,
  Footprints,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Activity,
  TrendingUp,
} from 'lucide-react';

export const SuggestedNutrition: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Suggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchPlan = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/suggestions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlan(response.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not find the requested nutrition blueprint.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [id, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <UnavBar />
        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 font-mono animate-pulse">Retrieving Biological Formulas...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <UnavBar />
        <div className="flex-grow max-w-lg w-full mx-auto px-4 py-16 text-center space-y-6">
          <AlertCircle className="h-16 w-16 text-rose-500 mx-auto" />
          <h2 className="font-display font-bold text-2xl text-slate-900">Blueprint Fetch Failed</h2>
          <p className="text-sm text-slate-500">{error || 'This nutrition blueprint does not exist.'}</p>
          <Link
            to="/home"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate healthy fats dynamically: Fat (g) = (Calories - (Protein * 4) - (Carbs * 4)) / 9
  const calculatedFats = Math.max(
    10,
    Math.round((plan.calorieIntake - plan.proteinNeeds * 4 - plan.carbohydrateNeeds * 4) / 9)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <UnavBar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Top Header Controls */}
        <div className="flex justify-between items-center">
          <Link
            to="/home"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 uppercase font-mono tracking-wider transition-all"
            id="btn-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Generated on {new Date(plan.date).toLocaleDateString()}
          </span>
        </div>

        {/* Master Cover Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Pane (Span 8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Overview / Clinical Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/30 space-y-5"
            >
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-900">Clinical Evaluation</h2>
                  <p className="text-xs text-slate-400 font-mono">BIOLOGICAL CONTEXT & ADVICE</p>
                </div>
              </div>

              {/* Patient metrics info row */}
              <div className="grid grid-cols-4 gap-4 text-center font-mono py-2 bg-slate-50 rounded-2xl border border-slate-100/50">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">AGE</span>
                  <span className="text-sm font-bold text-slate-800">{plan.age} Yrs</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">BMI</span>
                  <span className="text-sm font-bold text-slate-800">{plan.bmi}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">HEIGHT</span>
                  <span className="text-sm font-bold text-slate-800">{plan.height}cm</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">WEIGHT</span>
                  <span className="text-sm font-bold text-slate-800">{plan.weight}kg</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/30">
                {plan.suggestion}
              </p>
            </motion.div>

            {/* Recommended Foods (Gemini derived) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/30 space-y-5"
            >
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Apple className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-900">Recommended Clean Foods</h2>
                  <p className="text-xs text-slate-400 font-mono">GEMINI MICRO-SENSITIVE COMPLIANCE</p>
                </div>
              </div>

              {/* Wholesome Foods list */}
              <ul className="space-y-3.5">
                {plan.foods.map((food, idx) => (
                  <li
                    key={idx}
                    className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors flex items-start space-x-3 text-sm text-slate-700"
                  >
                    <div className="h-6 w-6 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="leading-relaxed">{food}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Side Panel: Bento Macros & Timings (Span 4) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Bento 1: Energy & Target Macros */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest block uppercase">ENERGY TARGET</span>
                  <h3 className="font-display font-bold text-2xl tracking-tight text-white">Metabolic Limit</h3>
                </div>
                <div className="p-2.5 bg-slate-800 text-emerald-400 rounded-xl">
                  <Flame className="h-6 w-6" />
                </div>
              </div>

              {/* Large Calorie Counter */}
              <div className="space-y-1">
                <span className="text-5xl font-extrabold font-mono text-emerald-400 tracking-tighter">
                  {plan.calorieIntake}
                </span>
                <span className="text-xs text-slate-400 font-mono block">DAILY RECOMMENDED KILOCALORIES</span>
              </div>

              {/* Macro Sliders */}
              <div className="space-y-4 pt-2">
                {/* Protein Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>PROTEIN TARGET</span>
                    <span className="text-emerald-400 font-bold">{plan.proteinNeeds}g / {plan.proteinNeeds * 4} kcal</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>

                {/* Carbohydrates Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>CARBOHYDRATES</span>
                    <span className="text-amber-400 font-bold">{plan.carbohydrateNeeds}g / {plan.carbohydrateNeeds * 4} kcal</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>

                {/* Fats Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>HEALTHY FATS</span>
                    <span className="text-teal-400 font-bold">{calculatedFats}g / {calculatedFats * 9} kcal</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bento 2: Meal Scheduling & Timings */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/30 space-y-4"
            >
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">Meal Timings</h3>
                  <p className="text-[10px] text-slate-400 font-mono">CLINICAL HORARY PROTOCOLS</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono">
                {plan.timing}
              </p>
            </motion.div>

            {/* Bento 3: Walking & Exercise */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/30 space-y-4"
            >
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                  <Footprints className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">Cardio / Steps Goal</h3>
                  <p className="text-[10px] text-slate-400 font-mono">ACTIVITY ADVICE</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono">
                {plan.walk}
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};
