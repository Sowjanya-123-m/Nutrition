import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LNavbar } from '../components/LNavbar';
import {
  Sparkles,
  Apple,
  TrendingUp,
  Brain,
  ShieldCheck,
  ChevronRight,
  Calculator,
  Utensils,
  Footprints,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden">
      <LNavbar />

      {/* Hero Section */}
      <section className="flex-grow flex items-center relative py-12 md:py-24">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-100/30 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-teal-100/20 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-emerald-100"
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
                <span>AI-Powered Precision Nutrition</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-none"
              >
                Your Personal Clinically Verified{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                  Nutritionist
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-slate-600 max-w-xl leading-relaxed"
              >
                Unlock customized metabolic plans, calculated daily macro goals, and automated meal timings backed by the clinical reasoning of Gemini AI. Discover clean food recommendations customized directly for your biology.
              </motion.p>

              {/* Action Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-600/30 transition-all duration-200 group active:scale-[0.98]"
                  id="btn-hero-cta"
                >
                  <span>Build Your Free Diet Plan</span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 px-6 py-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all duration-200 active:scale-[0.98]"
                  id="btn-hero-secondary"
                >
                  <span>Sign In</span>
                </Link>
              </motion.div>

              {/* Badges / Micro-stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100 max-w-lg"
              >
                <div>
                  <h4 className="font-display font-bold text-2xl text-slate-800 font-mono">100%</h4>
                  <p className="text-xs text-slate-500">Clinical Focus</p>
                </div>
                <div>
                  <h4 className="font-display font-bold text-2xl text-slate-800 font-mono">Mifflin</h4>
                  <p className="text-xs text-slate-500">BMR Formulas</p>
                </div>
                <div>
                  <h4 className="font-display font-bold text-2xl text-slate-800 font-mono">24/7</h4>
                  <p className="text-xs text-slate-500">Gemini Counseling</p>
                </div>
              </motion.div>
            </div>

            {/* Right Graphic/Preview Column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 max-w-md mx-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-bl-xl font-mono">
                  ACTIVE PREVIEW
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                    <Apple className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800">NutriBot Report</h3>
                    <p className="text-xs text-slate-400">Biological Synthesis</p>
                  </div>
                </div>

                {/* Simulated Data */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>DAILY CALORIES</span>
                      <span className="font-mono text-emerald-600">1,850 kcal</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase font-mono">PROTEIN</span>
                      <span className="text-lg font-bold text-slate-800 font-mono">145g</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase font-mono">CARBS</span>
                      <span className="text-lg font-bold text-slate-800 font-mono style={{ fontFamily: 'monospace' }}">230g</span>
                    </div>
                  </div>

                  {/* Bullet tips */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start space-x-2 text-slate-600">
                      <Calculator className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span><strong>Metabolic BMI:</strong> Under control at 22.4 (Normal Range).</span>
                    </div>
                    <div className="flex items-start space-x-2 text-slate-600">
                      <Utensils className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span><strong>Timing:</strong> Pre-load protein at 8:30 AM to stabilize morning insulin levels.</span>
                    </div>
                    <div className="flex items-start space-x-2 text-slate-600">
                      <Footprints className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span><strong>Walk:</strong> Perform a brisk 15-minute walk after lunch.</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-white py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
              Clinically Focused Features for Health Optimization
            </h2>
            <p className="text-slate-500">
              Our triple-layered processing pipeline ensures mathematical accuracy under classical formulas combined with clinical intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
              <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900">Mifflin BMR Formulas</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Uses the golden standard clinical math equations to determine exactly how many calories your physical structure burns passively, tailored by gender, height, and age.
              </p>
            </div>

            <div className="p-8 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
              <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900">Gemini Synthesis</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aggregates your bio-metrics and cross-references thousands of wholesome clinical compounds to draft specific food selections instead of plain numbers.
              </p>
            </div>

            <div className="p-8 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
              <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900">Secure Logs & History</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Keep historical entries of your diet plans in a secured MERN database. Review your progress, BMI curves, and track targets over time safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500 text-white p-1.5 rounded-lg">
              <Apple className="h-4 w-4" />
            </div>
            <span className="font-display font-bold text-white tracking-tight">
              Nutri<span className="text-emerald-400">Assistant</span>
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            &copy; 2026 NutriAssistant. All rights reserved. Clinically designed, powered by Gemini.
          </span>
        </div>
      </footer>
    </div>
  );
};
