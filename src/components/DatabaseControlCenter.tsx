import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Database, 
  Server, 
  RefreshCw, 
  Settings, 
  Key, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  UserCheck
} from 'lucide-react';

interface DbStatus {
  isMongoConnected: boolean;
  firebaseConfig: {
    projectId: string;
    appId: string;
    apiKey: string;
    authDomain: string;
    firestoreDatabaseId: string;
    storageBucket: string;
    oAuthClientId?: string;
  } | null;
}

interface DatabaseControlCenterProps {
  token: string | null;
  onSyncComplete?: () => void;
}

export const DatabaseControlCenter: React.FC<DatabaseControlCenterProps> = ({ 
  token,
  onSyncComplete 
}) => {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'none' | 'mongo' | 'firebase'>('none');

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/db-status');
      setStatus(res.data);
    } catch (err) {
      console.error('Error fetching database status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Poll status every 15s
    return () => clearInterval(interval);
  }, []);

  const handleSyncDatabase = async () => {
    if (!token) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await axios.post(
        '/api/users/sync', 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSyncMessage(`✅ Synced! ${res.data.summary.usersSynced} users, ${res.data.summary.suggestionsSynced} suggestions, and ${res.data.summary.mealsSynced} meals copied into MongoDB.`);
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncMessage(`❌ Sync unsuccessful: ${res.data.message}`);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      setSyncMessage(
        `❌ Sync failed: ${err.response?.data?.message || 'Please make sure a live MongoDB Atlas instance is connected.'}`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center space-y-3">
        <div className="h-6 w-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Checking cloud adapters...</p>
      </div>
    );
  }

  const isMongo = status?.isMongoConnected ?? false;
  const hasFirebase = !!status?.firebaseConfig;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-emerald-500" />
          <h2 className="font-display font-bold text-base text-slate-800">
            Database Control Center
          </h2>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
          Dual-Adapter active
        </span>
      </div>

      {/* MongoDB Connection Status Card */}
      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider block">
              PRIMARY DATABASE (MONGODB)
            </span>
            <div className="flex items-center space-x-2">
              <Server className={`h-4 w-4 ${isMongo ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className="text-sm font-bold text-slate-800">
                {isMongo ? 'MongoDB Atlas (Live)' : 'Local File Sandbox'}
              </span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            isMongo 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isMongo ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {isMongo ? 'Connected' : 'Fallback Active'}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {isMongo 
            ? 'All profiles, generated nutrition plans, and meal journals are synchronizing directly to your secure cloud MongoDB database instance.' 
            : 'Using lightweight, offline-first local JSON files as a fallback database. Your data is preserved locally in the sandbox container.'
          }
        </p>

        <button
          type="button"
          onClick={() => setExpandedSection(expandedSection === 'mongo' ? 'none' : 'mongo')}
          className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-800 font-semibold pt-1 border-t border-slate-200/50"
        >
          <span className="flex items-center gap-1">
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            How to configure a custom MongoDB?
          </span>
          {expandedSection === 'mongo' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expandedSection === 'mongo' && (
          <div className="p-3.5 mt-2 bg-white rounded-xl border border-slate-100 space-y-3.5 text-xs text-slate-600 leading-relaxed font-sans">
            <div className="flex gap-2">
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <div>
                <strong>Deploy a MongoDB Atlas Cluster:</strong> Create a database cluster in MongoDB Atlas (free tier) and retrieve your connection URL.
              </div>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <div>
                <strong>Set Environment Variable:</strong> Open the <strong>Settings menu</strong> inside the AI Studio developer workspace, locate the Environment Secrets section, and declare:
                <code className="block mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-mono text-rose-600 select-all">
                  MONGODB_URI="mongodb+srv://&lt;username&gt;:&lt;password&gt;@&lt;cluster&gt;.mongodb.net/nutrition-db"
                </code>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <div>
                <strong>Sync Database:</strong> The server will automatically connect to Atlas. Use the synchronization engine below to move all current local records directly into your new MongoDB database.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Firebase Firestore Status Card */}
      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider block">
              CLOUD DATA STORAGE (FIREBASE FIRESTORE)
            </span>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 text-orange-500 font-bold font-mono">F</div>
              <span className="text-sm font-bold text-slate-800">
                Firebase Firestore
              </span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            hasFirebase 
              ? 'bg-orange-50 text-orange-700 border-orange-100' 
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${hasFirebase ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'}`} />
            {hasFirebase ? 'Active & Ready' : 'Unconfigured'}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {hasFirebase 
            ? `Your cloud project ID is securely configured as ${status.firebaseConfig?.projectId}. Persistent authentication metadata is active.`
            : 'Firebase cloud setup is ready. Click below to begin provisioning a persistent cloud Firestore.'
          }
        </p>

        {hasFirebase && (
          <div className="space-y-2">
            <a
              href={`https://console.firebase.google.com/project/${status.firebaseConfig?.projectId}/firestore/databases/${status.firebaseConfig?.firestoreDatabaseId || '(default)'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <span>Access Firestore Console</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'firebase' ? 'none' : 'firebase')}
              className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-800 font-semibold pt-2 border-t border-slate-200/50"
            >
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                What is this for?
              </span>
              {expandedSection === 'firebase' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {expandedSection === 'firebase' && (
              <div className="p-3.5 mt-2 bg-white rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600 leading-relaxed font-sans">
                <p>
                  <strong>Durable Authentication:</strong> Firebase Authentication handles session credentials, secure password recovery, and third-party login flows with high-grade safety.
                </p>
                <p>
                  <strong>Firestore Syncing:</strong> Firestore database operates as a fast, globally distributed key-value and document cache to sync user somatic configurations, calories, and plans seamlessly across devices.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync local data back to Mongo widget */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>LOCAL REPLICATION ENGINE</span>
          <span className="font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Standby
          </span>
        </div>

        <button
          onClick={handleSyncDatabase}
          disabled={isSyncing}
          className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-sm"
          id="btn-sync-database-control"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronizing records...' : 'Sync Local Database to MongoDB'}</span>
        </button>

        {syncMessage && (
          <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-mono leading-relaxed text-slate-600 mt-2">
            {syncMessage}
          </p>
        )}
      </div>
    </div>
  );
};
