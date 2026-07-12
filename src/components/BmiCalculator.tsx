import React, { useState, useEffect } from 'react';
import { Ruler, Weight, Info, Scale, Check } from 'lucide-react';

interface BmiCalculatorProps {
  initialWeight?: number; // in kg
  initialHeight?: number; // in cm
  onCalculate?: (bmi: number, category: string) => void;
  showTitle?: boolean;
}

export const BmiCalculator: React.FC<BmiCalculatorProps> = ({
  initialWeight,
  initialHeight,
  onCalculate,
  showTitle = true,
}) => {
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  // Metric states
  const [weightKg, setWeightKg] = useState<number>(initialWeight || 70);
  const [heightCm, setHeightCm] = useState<number>(initialHeight || 170);

  // Imperial states
  const [weightLbs, setWeightLbs] = useState<number>(
    initialWeight ? Math.round(initialWeight * 2.20462) : 154
  );
  const [heightFt, setHeightFt] = useState<number>(
    initialHeight ? Math.floor(initialHeight / 30.48) : 5
  );
  const [heightIn, setHeightIn] = useState<number>(
    initialHeight ? Math.round((initialHeight / 2.54) % 12) : 7
  );

  // Sync with initial props when they change
  useEffect(() => {
    if (initialWeight) {
      setWeightKg(initialWeight);
      setWeightLbs(Math.round(initialWeight * 2.20462));
    }
  }, [initialWeight]);

  useEffect(() => {
    if (initialHeight) {
      setHeightCm(initialHeight);
      setHeightFt(Math.floor(initialHeight / 30.48));
      setHeightIn(Math.round((initialHeight / 2.54) % 12));
    }
  }, [initialHeight]);

  // Handle switching units and convert values to prevent desync
  const handleUnitChange = (newUnit: 'metric' | 'imperial') => {
    if (newUnit === 'metric') {
      const totalInches = heightFt * 12 + heightIn;
      const convertedCm = Math.round(totalInches * 2.54);
      const convertedKg = Math.round(weightLbs / 2.20462);
      setHeightCm(convertedCm || 170);
      setWeightKg(convertedKg || 70);
    } else {
      const totalInches = heightCm / 2.54;
      setHeightFt(Math.floor(totalInches / 12) || 5);
      setHeightIn(Math.round(totalInches % 12) || 7);
      setWeightLbs(Math.round(weightKg * 2.20462) || 154);
    }
    setUnit(newUnit);
  };

  // Compute BMI
  let bmi = 0;
  let currentHeightInM = 0;

  if (unit === 'metric') {
    currentHeightInM = heightCm / 100;
    if (currentHeightInM > 0 && weightKg > 0) {
      bmi = weightKg / (currentHeightInM * currentHeightInM);
    }
  } else {
    const totalInches = heightFt * 12 + heightIn;
    currentHeightInM = (totalInches * 2.54) / 100;
    if (totalInches > 0 && weightLbs > 0) {
      bmi = (weightLbs / (totalInches * totalInches)) * 703;
    }
  }

  const roundedBmi = parseFloat(bmi.toFixed(1));

  // Health Category mappings
  let category = 'Normal';
  let categoryColor = 'text-emerald-600';
  let categoryBg = 'bg-emerald-50 border-emerald-100';
  let indicatorPosition = 50; // percentage on gauge bar (0 to 100)

  if (roundedBmi < 18.5) {
    category = 'Underweight';
    categoryColor = 'text-sky-600';
    categoryBg = 'bg-sky-50 border-sky-100';
    // scale: 10 to 18.5 maps to 0 to 25% of the gauge width
    const pct = ((roundedBmi - 10) / 8.5) * 25;
    indicatorPosition = Math.max(2, Math.min(23, pct));
  } else if (roundedBmi >= 18.5 && roundedBmi < 25) {
    category = 'Normal Weight';
    categoryColor = 'text-emerald-600';
    categoryBg = 'bg-emerald-50 border-emerald-100';
    // scale: 18.5 to 25 maps to 25% to 50%
    const pct = 25 + ((roundedBmi - 18.5) / 6.5) * 25;
    indicatorPosition = Math.max(27, Math.min(48, pct));
  } else if (roundedBmi >= 25 && roundedBmi < 30) {
    category = 'Overweight';
    categoryColor = 'text-amber-600';
    categoryBg = 'bg-amber-50 border-amber-100';
    // scale: 25 to 30 maps to 50% to 75%
    const pct = 50 + ((roundedBmi - 25) / 5) * 25;
    indicatorPosition = Math.max(52, Math.min(73, pct));
  } else {
    category = 'Obese';
    categoryColor = 'text-rose-600';
    categoryBg = 'bg-rose-50 border-rose-100';
    // scale: 30 to 45 maps to 75% to 100%
    const pct = 75 + ((roundedBmi - 30) / 15) * 25;
    indicatorPosition = Math.max(77, Math.min(98, pct));
  }

  // Handle reporting back results
  useEffect(() => {
    if (onCalculate && roundedBmi > 0 && roundedBmi < 100) {
      onCalculate(roundedBmi, category);
    }
  }, [roundedBmi, category, onCalculate]);

  // Ideal weight range calculation (BMI 18.5 to 24.9)
  let idealMinWeight = 0;
  let idealMaxWeight = 0;
  let idealRangeLabel = '';

  if (currentHeightInM > 0) {
    const minKg = 18.5 * currentHeightInM * currentHeightInM;
    const maxKg = 24.9 * currentHeightInM * currentHeightInM;
    if (unit === 'metric') {
      idealMinWeight = Math.round(minKg * 10) / 10;
      idealMaxWeight = Math.round(maxKg * 10) / 10;
      idealRangeLabel = `${idealMinWeight} kg - ${idealMaxWeight} kg`;
    } else {
      idealMinWeight = Math.round(minKg * 2.20462);
      idealMaxWeight = Math.round(maxKg * 2.20462);
      idealRangeLabel = `${idealMinWeight} lbs - ${idealMaxWeight} lbs`;
    }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      {showTitle && (
        <div className="flex items-center space-x-2 pb-4 mb-5 border-b border-slate-50">
          <Scale className="h-5 w-5 text-emerald-500" />
          <h2 className="font-display font-bold text-lg text-slate-800">
            Interactive BMI Calculator
          </h2>
        </div>
      )}

      {/* Unit Selector Toggle */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => handleUnitChange('metric')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
            unit === 'metric'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Metric Units (cm / kg)
        </button>
        <button
          type="button"
          onClick={() => handleUnitChange('imperial')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
            unit === 'imperial'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Imperial Units (ft / in / lbs)
        </button>
      </div>

      {/* Dynamic Input Adjusters */}
      <div className="space-y-5">
        {/* Height Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 text-slate-400" />
              Height
            </label>
            <span className="text-sm font-semibold text-slate-800">
              {unit === 'metric' ? (
                `${heightCm} cm`
              ) : (
                `${heightFt} ft ${heightIn} in`
              )}
            </span>
          </div>

          {unit === 'metric' ? (
            <div className="space-y-2">
              <input
                type="range"
                min="100"
                max="230"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>100 cm</span>
                <span>165 cm</span>
                <span>230 cm</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Feet</label>
                <select
                  value={heightFt}
                  onChange={(e) => setHeightFt(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {[3, 4, 5, 6, 7, 8].map((ft) => (
                    <option key={ft} value={ft}>
                      {ft} ft
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Inches</label>
                <select
                  value={heightIn}
                  onChange={(e) => setHeightIn(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                    <option key={inch} value={inch}>
                      {inch} in
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Weight Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Weight className="h-3.5 w-3.5 text-slate-400" />
              Weight
            </label>
            <span className="text-sm font-semibold text-slate-800">
              {unit === 'metric' ? `${weightKg} kg` : `${weightLbs} lbs`}
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={unit === 'metric' ? '30' : '66'}
              max={unit === 'metric' ? '180' : '396'}
              value={unit === 'metric' ? weightKg : weightLbs}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (unit === 'metric') {
                  setWeightKg(val);
                } else {
                  setWeightLbs(val);
                }
              }}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{unit === 'metric' ? '30 kg' : '66 lbs'}</span>
              <span>{unit === 'metric' ? '105 kg' : '231 lbs'}</span>
              <span>{unit === 'metric' ? '180 kg' : '396 lbs'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Panel */}
      <div className="mt-8 pt-6 border-t border-slate-50 space-y-6">
        <div className="text-center space-y-1">
          <div className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">
            Body Mass Index (BMI)
          </div>
          <div className="flex items-baseline justify-center space-x-2">
            <span className="font-display font-black text-4xl text-slate-950 tracking-tight">
              {roundedBmi ? roundedBmi : '—'}
            </span>
            <span className="text-sm text-slate-400 font-medium">kg/m²</span>
          </div>
          <div className="inline-block">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-colors ${categoryBg} ${categoryColor}`}
            >
              {category}
            </span>
          </div>
        </div>

        {/* Visual Gauge Scale */}
        <div className="space-y-2.5">
          <div className="relative h-2.5 bg-slate-100 rounded-full overflow-visible">
            {/* Colored Segment Backgrounds */}
            <div className="absolute inset-0 flex rounded-full overflow-hidden">
              <div className="w-[25%] h-full bg-sky-200/80" />
              <div className="w-[25%] h-full bg-emerald-200/80 border-l border-white" />
              <div className="w-[25%] h-full bg-amber-200/80 border-l border-white" />
              <div className="w-[25%] h-full bg-rose-200/80 border-l border-white" />
            </div>

            {/* Dynamic Slider Needle Pointer */}
            {roundedBmi > 0 && roundedBmi < 100 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
                style={{ left: `${indicatorPosition}%` }}
              >
                <div className="relative">
                  {/* Pin Circle */}
                  <div className="h-4 w-4 bg-white border-2 border-slate-800 rounded-full shadow-md -ml-2" />
                  {/* Down pointing tiny triangle indicator */}
                  <div className="absolute -top-1 left-0 -ml-0.5 border-x-4 border-x-transparent border-b-4 border-b-slate-800" />
                </div>
              </div>
            )}
          </div>

          {/* Scale range descriptors */}
          <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 tracking-wide uppercase font-mono text-center">
            <span className="text-sky-500/80">Under &lt;18.5</span>
            <span className="text-emerald-500/80">Normal 18.5-25</span>
            <span className="text-amber-500/80">Over 25-30</span>
            <span className="text-rose-500/80">Obese &ge;30</span>
          </div>
        </div>

        {/* Dynamic Context Card */}
        {roundedBmi > 0 && (
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 block">
                  Physiological Diagnosis
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {category === 'Underweight' &&
                    'Your weight falls within the underweight range. It is recommended to consult a nutritionist to establish custom dietary goals for gradual weight gain.'}
                  {category === 'Normal Weight' &&
                    'Outstanding! Your body mass index is securely within the healthy and optimal zone. Continue maintaining your active habit profile.'}
                  {category === 'Overweight' &&
                    'Your weight falls within the overweight range. Consider incorporating calorie-conscious meal logs and tracking BMR calculations.'}
                  {category === 'Obese' &&
                    'Your BMI classifies under obesity. We highly recommend consulting clinical professionals to devise a personalized diet plan and movement schedule.'}
                </p>
              </div>
            </div>

            {idealRangeLabel && (
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Healthy Weight Range:</span>
                <span className="font-semibold text-slate-700">{idealRangeLabel}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
