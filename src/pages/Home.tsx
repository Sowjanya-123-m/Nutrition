import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UnavBar } from '../components/UnavBar';
import { DatabaseControlCenter } from '../components/DatabaseControlCenter';
import { Suggestion, User } from '../types';
import {
  Activity,
  Calendar,
  ChevronRight,
  TrendingUp,
  Trash2,
  Users,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Send,
  UserCheck,
  ShieldCheck,
  Zap,
  Database,
  RefreshCw,
  Plus,
  Utensils,
  Flame,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Unified lists
  const [userSuggestions, setUserSuggestions] = useState<Suggestion[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminSuggestions, setAdminSuggestions] = useState<Suggestion[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: `Hi ${user?.name || 'there'}! I am NutriBot, your AI nutrition assistant. How can I help you reach your dietary goals today?` }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Database Sync states and handlers
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Meal tracking states
  const [meals, setMeals] = useState<any[]>([]);
  const [mealType, setMealType] = useState('Breakfast');
  const [mealDescription, setMealDescription] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [mealStatus, setMealStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await axios.post('/api/users/sync', {}, getAxiosConfig());
      if (res.data.success) {
        setSyncMessage(`✅ Synchronization completed successfully. ${res.data.summary.usersSynced} users, ${res.data.summary.suggestionsSynced} suggestions, and ${res.data.summary.mealsSynced} meals copied into MongoDB.`);
        fetchData();
      } else {
        setSyncMessage(`❌ Synchronization failed: ${res.data.message}`);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      setSyncMessage(`❌ Sync failed: ${err.response?.data?.message || 'Please make sure a live MongoDB Atlas instance is connected.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Axios config with headers
  const getAxiosConfig = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchMeals = async () => {
    try {
      const res = await axios.get('/api/meals/my-meals', getAxiosConfig());
      setMeals(res.data);
    } catch (err) {
      console.error('Error fetching meals:', err);
    }
  };

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealDescription.trim()) {
      setMealStatus({ type: 'error', message: 'Please provide a description of what you ate.' });
      return;
    }

    setIsLoggingMeal(true);
    setMealStatus(null);

    try {
      const res = await axios.post('/api/meals/create', {
        mealName: mealType,
        description: mealDescription,
        calories: mealCalories ? Number(mealCalories) : undefined,
        protein: mealProtein ? Number(mealProtein) : undefined,
        carbs: mealCarbs ? Number(mealCarbs) : undefined,
        fat: mealFat ? Number(mealFat) : undefined,
      }, getAxiosConfig());

      if (res.data.success) {
        setMealStatus({ 
          type: 'success', 
          message: `Logged successfully! ${res.data.meal.calories} kcal estimated/saved.` 
        });
        setMealDescription('');
        setMealCalories('');
        setMealProtein('');
        setMealCarbs('');
        setMealFat('');
        fetchMeals();
      }
    } catch (err: any) {
      console.error('Error logging meal:', err);
      setMealStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to log meal. Please try again.' 
      });
    } finally {
      setIsLoggingMeal(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!window.confirm('Are you sure you want to delete this meal entry?')) {
      return;
    }

    try {
      await axios.delete(`/api/meals/${mealId}`, getAxiosConfig());
      setMeals(prev => prev.filter(m => m._id !== mealId));
    } catch (err) {
      console.error('Error deleting meal:', err);
      alert('Failed to delete meal entry.');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (user) {
        await fetchMeals();
      }
      if (user?.role === 'admin') {
        // Fetch Admin datasets
        const [usersRes, suggRes] = await Promise.all([
          axios.get('/api/users/all', getAxiosConfig()),
          axios.get('/api/suggestions/all', getAxiosConfig())
        ]);
        setAdminUsers(usersRes.data);
        setAdminSuggestions(suggRes.data);
      } else if (user) {
        // Fetch User suggestions history
        const res = await axios.get(`/api/suggestions/user/${user.id}`, getAxiosConfig());
        setUserSuggestions(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not retrieve database records. Please try logging in again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, user]);

  useEffect(() => {
    if (user?.name && chatHistory.length === 1 && chatHistory[0].text.startsWith('Hi there!')) {
      setChatHistory([
        { sender: 'ai', text: `Hi ${user.name}! I am NutriBot, your AI nutrition assistant. How can I help you reach your dietary goals today?` }
      ]);
    }
  }, [user]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatOpen]);

  // Delete suggestions (Standard User deleting their own, or Admin deleting any)
  const handleDeleteSuggestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this nutrition plan entry? This action is permanent.')) {
      return;
    }

    try {
      await axios.delete(`/api/suggestions/${id}`, getAxiosConfig());
      // Re-fetch or local update
      setUserSuggestions(prev => prev.filter(s => s._id !== id));
      setAdminSuggestions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete the suggestion.');
    }
  };

  // Admin delete User
  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
      alert('You cannot delete your own administrative account.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user? All their login records will be wiped.')) {
      return;
    }

    try {
      await axios.delete(`/api/users/${id}`, getAxiosConfig());
      setAdminUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  // Chat submission
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const response = await axios.post(
        '/api/ai/chat',
        { message: userText, history: chatHistory },
        getAxiosConfig()
      );
      setChatHistory(prev => [...prev, { sender: 'ai', text: response.data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        { sender: 'ai', text: 'Sorry, I am having trouble connecting to the dietary grid right now.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Calculate BMI metrics for standard user display
  const userBmi = user ? parseFloat((user.weight / ((user.height / 100) * (user.height / 100))).toFixed(1)) : 0;
  
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { name: 'Underweight', color: 'bg-amber-100 text-amber-700 border-amber-200', range: '< 18.5', offset: '15%' };
    if (bmi >= 18.5 && bmi <= 24.9) return { name: 'Normal', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', range: '18.5 - 24.9', offset: '45%' };
    if (bmi >= 25.0 && bmi <= 29.9) return { name: 'Overweight', color: 'bg-amber-100 text-amber-700 border-amber-200', range: '25.0 - 29.9', offset: '70%' };
    return { name: 'Obese', color: 'bg-rose-100 text-rose-700 border-rose-200', range: '>= 30.0', offset: '90%' };
  };

  const bmiCat = getBmiCategory(userBmi);

  // Filter today's meals
  const todayMeals = meals.filter((m) => {
    try {
      const mealDateStr = new Date(m.date).toDateString();
      const todayStr = new Date().toDateString();
      return mealDateStr === todayStr;
    } catch {
      return false;
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <UnavBar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500 font-mono animate-pulse">Syncing clinical databases...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl max-w-lg mx-auto text-center space-y-4 my-12">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
            <h3 className="font-display font-bold text-xl text-rose-800">Database Sync Failed</h3>
            <p className="text-sm text-rose-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold"
            >
              Retry Sync
            </button>
          </div>
        ) : user?.role === 'admin' ? (
          /* ======================================================== */
          /* ADMINISTRATIVE VIEWS                                     */
          /* ======================================================== */
          <div className="space-y-10">
            {/* Admin Banner */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-lg border border-slate-800">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Systems Administrator Mode
                </span>
                <h1 className="font-display font-bold text-3xl tracking-tight">System Logs & Control Panel</h1>
                <p className="text-slate-400 text-sm">Review full system-wide registrations, metrics, and generated AI plans.</p>
              </div>
              <div className="flex gap-4">
                <div className="px-5 py-3.5 bg-slate-800 rounded-2xl border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">SYSTEM USERS</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">{adminUsers.length}</span>
                </div>
                <div className="px-5 py-3.5 bg-slate-800 rounded-2xl border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">GENERATED PLANS</span>
                  <span className="text-2xl font-bold font-mono text-teal-400">{adminSuggestions.length}</span>
                </div>
              </div>
            </div>

            {/* Admin Database Sync Widget */}
            <DatabaseControlCenter token={token} onSyncComplete={fetchData} />

            {/* Admin Grid: 1. Users Table */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/40 space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-900">User Registrations Directory</h2>
                  <p className="text-xs text-slate-400 font-mono">CRITICAL CLIENT INDEX</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-50">
                      <th className="py-3 px-4">Name / ID</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4 text-center">Age / Sex</th>
                      <th className="py-3 px-4 text-center">Height (cm)</th>
                      <th className="py-3 px-4 text-center">Weight (kg)</th>
                      <th className="py-3 px-4">Activity</th>
                      <th className="py-3 px-4 text-center">Role</th>
                      <th className="py-3 px-4 text-center">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {adminUsers.map((u) => (
                      <tr key={u.id || (u as any)._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{u.id || (u as any)._id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">{u.email}</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">{u.age} ({u.gender[0]})</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600">{u.height}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600">{u.weight}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{u.activityLevel}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            u.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteUser(u.id || (u as any)._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete User Account"
                            id={`btn-del-user-${u.id || (u as any)._id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Grid: 2. Suggestions Table */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/40 space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-900">Nutrition Plan Logs</h2>
                  <p className="text-xs text-slate-400 font-mono">AI GENERATED MATRICES INDEX</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-50">
                      <th className="py-3 px-4">Subject Name</th>
                      <th className="py-3 px-4 text-center">Goal Type</th>
                      <th className="py-3 px-4 text-center">BMI Score</th>
                      <th className="py-3 px-4 text-center">Daily Calories</th>
                      <th className="py-3 px-4 text-center">Protein (g)</th>
                      <th className="py-3 px-4 text-center">Carbs (g)</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-center">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {adminSuggestions.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{s.userName}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            s.weightGain === 'Weight Loss' ? 'bg-amber-50 text-amber-700' :
                            s.weightGain === 'Weight Gain' ? 'bg-indigo-50 text-indigo-700' :
                            'bg-emerald-50 text-emerald-700'
                          }`}>
                            {s.weightGain}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">{s.bmi}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{s.calorieIntake} kcal</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600">{s.proteinNeeds}g</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600">{s.carbohydrateNeeds}g</td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteSuggestion(s._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Wipe Plan Logs"
                            id={`btn-del-sugg-${s._id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STANDARD USER VIEWS                                      */
          /* ======================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Health Profile Stats & BMI Metric (Span 4) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Profile Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/40 space-y-6">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-slate-900">Health Profile</h2>
                    <p className="text-xs text-slate-400 font-mono">BIOLOGICAL CONTEXT</p>
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider block">HEIGHT</span>
                    <span className="text-lg font-bold text-slate-800">{user?.height} cm</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider block">WEIGHT</span>
                    <span className="text-lg font-bold text-slate-800">{user?.weight} kg</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider block">BIOLOGICAL AGE</span>
                    <span className="text-lg font-bold text-slate-800">{user?.age} Yrs</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider block">GENDER</span>
                    <span className="text-lg font-bold text-slate-800">{user?.gender}</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-100/30 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 font-mono tracking-wider block">ACTIVITY FACTOR</span>
                  <p className="text-sm font-semibold text-slate-700">{user?.activityLevel}</p>
                </div>

                {/* User Database Integration Info */}
                <div className="pt-4 border-t border-slate-100 flex flex-col space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider block">
                    DATABASE STATE
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Local files and live cloud storage synchronize dynamically using our dual-adapter configuration.
                  </p>
                </div>
              </div>

              {/* Cloud Database Control Center Card */}
              <DatabaseControlCenter token={token} onSyncComplete={fetchData} />

              {/* BMI Widget */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/40 space-y-6">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="h-10 w-10 bg-teal-50 text-teal-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-slate-900">Body Mass Index</h2>
                    <p className="text-xs text-slate-400 font-mono">CLINICAL INDEX</p>
                  </div>
                </div>

                {/* Score Dial Display */}
                <div className="flex flex-col items-center justify-center space-y-3 py-4">
                  <div className="text-5xl font-extrabold font-mono text-slate-800 tracking-tighter">
                    {userBmi}
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${bmiCat.color}`}>
                    {bmiCat.name}
                  </span>
                </div>

                {/* Meter graphic */}
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-100 rounded-full relative overflow-visible border border-slate-200/50">
                    {/* Active dial dot */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-5 w-5 bg-slate-900 border-2 border-white rounded-full shadow-md z-10 -ml-2.5 transition-all duration-1000"
                      style={{ left: bmiCat.offset }}
                    />
                    <div className="h-full w-full rounded-full flex overflow-hidden">
                      <div className="h-full bg-sky-300 w-[20%]" title="Underweight" />
                      <div className="h-full bg-emerald-400 w-[35%]" title="Normal" />
                      <div className="h-full bg-amber-400 w-[25%]" title="Overweight" />
                      <div className="h-full bg-rose-400 w-[20%]" title="Obese" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>15.0</span>
                    <span>18.5</span>
                    <span>25.0</span>
                    <span>30.0</span>
                    <span>35.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Nutrition Plans & History (Span 8) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Daily Meal Tracker Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/40 space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-xl text-slate-900">Daily Meal Journal</h2>
                      <p className="text-xs text-slate-400 font-mono">TRACK MEALS & ESTIMATE CALORIES</p>
                    </div>
                  </div>
                  {/* Quick stats for calories */}
                  <div className="flex items-center space-x-3 bg-amber-50/50 border border-amber-100/30 px-3 py-1.5 rounded-xl font-mono text-xs">
                    <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span className="text-slate-600">Today:</span>
                    <strong className="text-slate-800">{todayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0)}</strong>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-500">{userSuggestions.length > 0 ? userSuggestions[0].calorieIntake : 2000} kcal</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Calorie Target Progress</span>
                    <span className="font-bold text-slate-700">
                      {Math.min(
                        Math.round(
                          (todayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0) /
                            (userSuggestions.length > 0 ? userSuggestions[0].calorieIntake : 2000)) *
                            100
                        ),
                        100
                      )}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        todayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0) >
                        (userSuggestions.length > 0 ? userSuggestions[0].calorieIntake : 2000)
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.round(
                            (todayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0) /
                              (userSuggestions.length > 0 ? userSuggestions[0].calorieIntake : 2000)) *
                              100
                          ),
                          100
                        )}%`
                      }}
                    />
                  </div>
                  {todayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0) >
                    (userSuggestions.length > 0 ? userSuggestions[0].calorieIntake : 2000) && (
                    <p className="text-[10px] text-rose-500 font-mono mt-1">⚠️ You have exceeded today's suggested calorie target.</p>
                  )}
                </div>

                {/* Macros Breakdown Today */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Protein</span>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-sm font-bold font-mono text-slate-700">
                        {todayMeals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0)}g
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        / {userSuggestions.length > 0 ? userSuggestions[0].proteinNeeds : 130}g
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Carbs</span>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-sm font-bold font-mono text-slate-700">
                        {todayMeals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0)}g
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        / {userSuggestions.length > 0 ? userSuggestions[0].carbohydrateNeeds : 225}g
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Fat</span>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-sm font-bold font-mono text-slate-700">
                        {todayMeals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0)}g
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">est.</span>
                    </div>
                  </div>
                </div>

                {/* Log Meal Form */}
                <form onSubmit={handleLogMeal} className="space-y-4 p-5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <h3 className="font-display font-bold text-slate-800 text-sm font-mono uppercase tracking-wider">Log A Meal</h3>
                  
                  {mealStatus && (
                    <div className={`p-3 rounded-xl text-xs font-mono border ${
                      mealStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : 'bg-rose-50 text-rose-800 border-rose-100'
                    }`}>
                      {mealStatus.message}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Meal type pills */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">Meal Category</label>
                      <div className="flex flex-wrap gap-2">
                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setMealType(type)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              mealType === type
                                ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/15'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Meal description */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">What did you eat?</label>
                      <input
                        type="text"
                        value={mealDescription}
                        onChange={(e) => setMealDescription(e.target.value)}
                        placeholder="e.g. 2 scrambled eggs, 1 slice whole wheat bread, half avocado"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400"
                        required
                        id="input-meal-desc"
                      />
                    </div>

                    {/* Caloric & optional macros row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">Calories (kcal)</label>
                        <input
                          type="number"
                          value={mealCalories}
                          onChange={(e) => setMealCalories(e.target.value)}
                          placeholder="AI Estimate"
                          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 font-mono"
                          min="0"
                          id="input-meal-calories"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">Protein (g)</label>
                        <input
                          type="number"
                          value={mealProtein}
                          onChange={(e) => setMealProtein(e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 font-mono"
                          min="0"
                          id="input-meal-protein"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">Carbs (g)</label>
                        <input
                          type="number"
                          value={mealCarbs}
                          onChange={(e) => setMealCarbs(e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 font-mono"
                          min="0"
                          id="input-meal-carbs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">Fat (g)</label>
                        <input
                          type="number"
                          value={mealFat}
                          onChange={(e) => setMealFat(e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder-slate-400 font-mono"
                          min="0"
                          id="input-meal-fat"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                      {!mealCalories ? 'AI will estimate calorie & macros' : 'Manual caloric values logged'}
                    </span>
                    <button
                      type="submit"
                      disabled={isLoggingMeal}
                      className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-md shadow-amber-500/10 hover:shadow-amber-600/25 active:scale-95 transition-all duration-200"
                      id="btn-log-meal-submit"
                    >
                      {isLoggingMeal ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>AI Estimating...</span>
                        </>
                      ) : !mealCalories ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>AI Estimate & Log</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Log Meal Entry</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Logged meals list */}
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                    <span>Today's Meal Entries</span>
                    <span className="h-5 px-1.5 bg-slate-100 text-slate-500 rounded text-[10px] font-mono flex items-center justify-center font-bold">
                      {todayMeals.length}
                    </span>
                  </h3>

                  {meals.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                      <p className="text-xs text-slate-400 max-w-xs mx-auto font-mono">NO MEAL LOGS YET TODAY</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {meals.map((meal) => (
                        <div
                          key={meal._id || meal.id}
                          className="p-4 border border-slate-100 rounded-2xl bg-white hover:border-slate-200 hover:shadow-sm transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1.5 min-w-0 flex-grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                                meal.mealName === 'Breakfast' ? 'bg-amber-50 text-amber-700 border border-amber-100/50' :
                                meal.mealName === 'Lunch' ? 'bg-sky-50 text-sky-700 border border-sky-100/50' :
                                meal.mealName === 'Dinner' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50' :
                                'bg-rose-50 text-rose-700 border border-rose-100/50'
                              }`}>
                                {meal.mealName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(meal.date).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : new Date(meal.date).toLocaleDateString()} at {new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-700 truncate" title={meal.description}>
                              {meal.description}
                            </p>
                            {/* Macros row */}
                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                              <span>P: <strong className="text-slate-600">{meal.protein || 0}g</strong></span>
                              <span>C: <strong className="text-slate-600">{meal.carbs || 0}g</strong></span>
                              <span>F: <strong className="text-slate-600">{meal.fat || 0}g</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold font-mono">
                              <Flame className="h-3 w-3 text-amber-500" />
                              <span>{meal.calories} kcal</span>
                            </div>
                            <button
                              onClick={() => handleDeleteMeal(meal._id || meal.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete meal log"
                              id={`btn-del-meal-${meal._id || meal.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nutrition Plans History card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/40 space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-xl text-slate-900">Nutrition Plans History</h2>
                      <p className="text-xs text-slate-400 font-mono">PERSONAL LOG</p>
                    </div>
                  </div>
                  <Link
                    to="/new-plan"
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-600/25 active:scale-95 transition-all duration-200 text-center"
                    id="btn-trigger-new-plan"
                  >
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span>Generate Diet Plan</span>
                  </Link>
                </div>

                {userSuggestions.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-semibold text-slate-800">No Nutrition Plans Found</h3>
                      <p className="text-sm text-slate-400 max-w-xs mx-auto">
                        Generate your first biological plan to calculate custom macros and dietary schedules.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userSuggestions.map((s) => (
                      <div
                        key={s._id}
                        className="p-5 border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-md hover:shadow-slate-100/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-slate-50 text-slate-500 rounded-xl font-mono text-center shrink-0">
                            <span className="text-[10px] block font-bold text-slate-400 uppercase">BMI</span>
                            <span className="text-lg font-bold text-slate-800">{s.bmi}</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                s.weightGain === 'Weight Loss' ? 'bg-amber-50 text-amber-700' :
                                s.weightGain === 'Weight Gain' ? 'bg-indigo-50 text-indigo-700' :
                                'bg-emerald-50 text-emerald-700'
                              }`}>
                                {s.weightGain}
                              </span>
                              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(s.date).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-display font-bold text-slate-800 text-lg group-hover:text-emerald-500 transition-colors">
                              {s.calorieIntake} Daily Calories Suggested
                            </h3>
                            <p className="text-xs text-slate-400 font-mono flex gap-3">
                              <span>Protein: <strong>{s.proteinNeeds}g</strong></span>
                              <span>Carbs: <strong>{s.carbohydrateNeeds}g</strong></span>
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <Link
                            to={`/suggestion/${s._id}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 text-xs font-semibold rounded-lg transition-all"
                            id={`btn-view-${s._id}`}
                          >
                            <span>View Plan</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteSuggestion(s._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Entry"
                            id={`btn-del-user-sugg-${s._id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* FLOATING CHATBOT WIDGET (STANDARD USER ONLY)             */}
      {/* ======================================================== */}
      {user && user.role !== 'admin' && (
        <div className="fixed bottom-6 right-6 z-50">
          {chatOpen ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white w-[350px] sm:w-[400px] h-[500px] rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="h-9 w-9 bg-emerald-500 rounded-xl flex items-center justify-center relative">
                    <MessageSquare className="h-4.5 w-4.5 text-white" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-sm">NutriBot Assistant</h4>
                    <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">GEMINI COUNSELOR</span>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-slate-400 hover:text-white transition-all text-xs font-mono font-bold px-2 py-1 rounded-lg hover:bg-slate-800"
                >
                  Minimize
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-sm ${
                        msg.sender === 'user'
                          ? 'bg-emerald-500 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm shadow-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 text-slate-400 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2 text-xs font-mono">
                      <Zap className="h-3 w-3 animate-bounce text-emerald-500" />
                      <span>NutriBot is analyzing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 bg-white shrink-0 flex gap-2">
                <input
                  type="text"
                  required
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask me anything about your diet..."
                  className="flex-grow px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  id="chat-input-text"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50 transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0"
                  id="chat-submit-btn"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setChatOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-2xl flex items-center justify-center space-x-2 border border-slate-800"
              id="btn-open-chat"
            >
              <MessageSquare className="h-5 w-5 text-emerald-400 animate-pulse" />
              <span className="font-semibold text-sm pr-1 hidden sm:inline">Ask NutriBot</span>
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};
