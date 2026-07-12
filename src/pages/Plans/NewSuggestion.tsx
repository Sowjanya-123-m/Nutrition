import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Calculator, HeartPulse, ShieldAlert } from 'lucide-react';

const clinicalQuotes = [
  "Calibrating active metabolic factors...",
  "Running Mifflin-St Jeor basal metabolic equations...",
  "Consulting Gemini clinical food compound databases...",
  "Structuring macronutrient and essential protein requirements...",
  "Optimizing postprandial insulin response timelines...",
  "Assembling specific wholesome organic selections...",
];

export const NewSuggestion: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % clinicalQuotes.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-8">
      {/* Visual Pulsing Circle */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl"
        />
        <div className="relative h-24 w-24 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
          <Brain className="h-10 w-10 animate-pulse" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display font-bold text-2xl text-slate-800">
          Synthesizing Personal Plan
        </h2>
        <p className="text-sm text-slate-400 font-mono tracking-wider uppercase flex items-center justify-center gap-1.5">
          <Sparkles className="h-4 w-4 text-emerald-500 animate-spin" />
          <span>Gemini Intelligence Active</span>
        </p>
      </div>

      {/* Cycling clinical quotes */}
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl w-full min-h-[70px] flex items-center justify-center">
        <motion.p
          key={quoteIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-sm font-semibold text-slate-600 font-mono"
        >
          {clinicalQuotes[quoteIndex]}
        </motion.p>
      </div>

      {/* Loading bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
          className="h-full w-1/3 bg-emerald-500 rounded-full"
        />
      </div>

      <div className="flex justify-center gap-6 text-[11px] text-slate-400 font-mono pt-4">
        <span className="flex items-center gap-1">
          <Calculator className="h-3 w-3 text-emerald-500" />
          BMR Engine
        </span>
        <span className="flex items-center gap-1">
          <HeartPulse className="h-3 w-3 text-rose-500" />
          Macro Ratio
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Gemini 3.5
        </span>
      </div>
    </div>
  );
};
