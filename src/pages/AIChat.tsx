import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UnavBar } from '../components/UnavBar';
import { ChatMessage } from '../components/ChatMessage';
import { TypingIndicator } from '../components/TypingIndicator';
import {
  Sparkles,
  Send,
  Calendar,
  RefreshCw,
  Droplet,
  BookOpen,
  Compass,
  UserCheck,
  TrendingUp,
  Flame,
  Scale
} from 'lucide-react';

interface HistoryItem {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const AIChat: React.FC = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<HistoryItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userBmi, setUserBmi] = useState<string>('Calculated');
  const [weightGoal, setWeightGoal] = useState<string>('Loading...');
  const [calTarget, setCalTarget] = useState<number>(2000);
  const [proteinTarget, setProteinTarget] = useState<number>(130);
  const [carbsTarget, setCarbsTarget] = useState<number>(225);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Axios Authorization Config
  const getAxiosConfig = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load User Stats & Suggestions for UI telemetry
  useEffect(() => {
    if (user) {
      setMessages([
        {
          sender: 'ai',
          text: `Hello **${user.name}**! I have successfully loaded your clinical profile and metabolic journal. 

I'm ready to assist you. You can chat with me naturally, or use the **Quick AI Clinical Actions** to instantly generate full plans, nutrition guides, and healthy food alternatives!`,
          timestamp: new Date()
        }
      ]);

      // Calculate BMI
      const heightM = user.height / 100;
      const calculatedBmi = (user.weight / (heightM * heightM)).toFixed(1);
      setUserBmi(calculatedBmi);

      // Load target calories from suggestions
      axios.get(`/api/suggestions/user/${user.id}`, getAxiosConfig())
        .then((res) => {
          if (res.data && res.data.length > 0) {
            const latest = res.data[0];
            setWeightGoal(latest.weightGain);
            setCalTarget(latest.calorieIntake);
            setProteinTarget(latest.proteinNeeds);
            setCarbsTarget(latest.carbohydrateNeeds);
          } else {
            setWeightGoal('Setup Required');
          }
        })
        .catch((err) => console.error('Error fetching suggestions for chat page:', err));
    }
  }, [user]);

  // Handle standard message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await axios.post(
        '/api/ai/chat',
        {
          message: userMessage,
          history: messages.map(m => ({ sender: m.sender, text: m.text }))
        },
        getAxiosConfig()
      );

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: response.data.reply,
          timestamp: new Date()
        }
      ]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: '⚠️ **Clinical Network Congestion**: I was unable to connect to the AI model. Please verify your internet connection or try re-submitting your query.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger specialized AI features (e.g. weekly meal plan, healthy alternatives, etc.)
  const handleTriggerSpecialized = async (featureName: string, displayLabel: string) => {
    if (isLoading) return;

    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: `Command: Generate ${displayLabel}`,
        timestamp: new Date()
      }
    ]);
    setIsLoading(true);

    try {
      const response = await axios.post(
        '/api/ai/feature',
        { feature: featureName },
        getAxiosConfig()
      );

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: response.data.reply,
          timestamp: new Date()
        }
      ]);
    } catch (error: any) {
      console.error('Specialized feature error:', error);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ **Feature Generation Failure**: Failed to compile the clinical advice for *${displayLabel}*. Please try again shortly.`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <UnavBar />

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-80px)] overflow-hidden">
        {/* Left Side: Personal Clinical Context & Actions (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1">
          {/* AI Telemetry Header */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">Clinical AI Engine</h2>
                <p className="text-[10px] text-amber-400 font-mono tracking-wider uppercase">Context-Aware Core</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your profile statistics and daily meal journals are automatically synced into NutriBot's cognitive memory block to formulate personalized guidelines.
            </p>
          </div>

          {/* User Stats Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-md space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center space-x-2 border-b border-slate-50 pb-3">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <span>Synchronized Biological Profile</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono block">BMI Score</span>
                <span className="font-bold text-slate-800 font-mono">{userBmi} kg/m²</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono block">Dietary Goal</span>
                <span className="font-bold text-slate-800">{weightGoal}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono block">Calorie Target</span>
                <span className="font-bold text-slate-800 font-mono">{calTarget} kcal</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono block">Daily Protein</span>
                <span className="font-bold text-slate-800 font-mono">{proteinTarget}g</span>
              </div>
            </div>
          </div>

          {/* Quick clinical actions */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-md space-y-3">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center space-x-2 border-b border-slate-50 pb-3">
              <Compass className="h-4 w-4 text-amber-500" />
              <span>Quick AI Clinical Actions</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => handleTriggerSpecialized('weekly_meal_plan', 'Weekly Meal Plan')}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-amber-500 hover:text-white rounded-2xl border border-slate-100 transition-all flex items-center justify-between text-xs font-semibold text-slate-700 group disabled:opacity-50"
              >
                <div className="flex items-center space-x-2.5">
                  <Calendar className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>🗓️ Create Weekly Meal Plan</span>
                </div>
              </button>

              <button
                onClick={() => handleTriggerSpecialized('healthy_alternatives', 'Healthy Swaps')}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-amber-500 hover:text-white rounded-2xl border border-slate-100 transition-all flex items-center justify-between text-xs font-semibold text-slate-700 group disabled:opacity-50"
              >
                <div className="flex items-center space-x-2.5">
                  <RefreshCw className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>🔄 10 Healthy Alternatives Swaps</span>
                </div>
              </button>

              <button
                onClick={() => handleTriggerSpecialized('water_and_exercise', 'Water & Exercise Prescription')}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-amber-500 hover:text-white rounded-2xl border border-slate-100 transition-all flex items-center justify-between text-xs font-semibold text-slate-700 group disabled:opacity-50"
              >
                <div className="flex items-center space-x-2.5">
                  <Droplet className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>💧 Hydration & Fitness Workout Guide</span>
                </div>
              </button>

              <button
                onClick={() => handleTriggerSpecialized('nutrients_explained', 'Nutrients Breakdown')}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-amber-500 hover:text-white rounded-2xl border border-slate-100 transition-all flex items-center justify-between text-xs font-semibold text-slate-700 group disabled:opacity-50"
              >
                <div className="flex items-center space-x-2.5">
                  <BookOpen className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>🧪 Explain Nutrient Functions</span>
                </div>
              </button>

              <button
                onClick={() => handleTriggerSpecialized('motivational_tips', 'Motivational Tips')}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-amber-500 hover:text-white rounded-2xl border border-slate-100 transition-all flex items-center justify-between text-xs font-semibold text-slate-700 group disabled:opacity-50"
              >
                <div className="flex items-center space-x-2.5">
                  <TrendingUp className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>🎯 Motivational Health Habits Tips</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Main Chat Console (Span 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 flex flex-col overflow-hidden h-full">
          {/* Chat Panel Header */}
          <div className="p-4 sm:p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100/30">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-800 text-sm sm:text-base">Conversing with NutriBot</h2>
                <p className="text-[10px] text-emerald-500 font-mono tracking-wider uppercase flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Active Clinical Session
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-100/30 px-3 py-1 rounded-xl text-[10px] font-mono text-amber-800 font-bold">
              <span>Model: gemini-3.5-flash</span>
            </div>
          </div>

          {/* Messages stream */}
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-slate-50/30 space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                sender={msg.sender}
                text={msg.text}
                timestamp={msg.timestamp}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input form */}
          <div className="p-4 border-t border-slate-50 bg-white shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <input
                type="text"
                required
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask clinical queries, nutrition plan ideas, recipe guides, calorie estimates..."
                className="flex-grow px-4 py-3 bg-slate-50 hover:bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder-slate-400"
                id="input-ai-chat-prompt"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="inline-flex items-center justify-center p-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white rounded-2xl shadow-lg shadow-amber-500/10 hover:shadow-amber-600/25 active:scale-95 transition-all duration-200 shrink-0"
                id="btn-ai-chat-send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
