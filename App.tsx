import React, { useState, useEffect, useRef } from 'react';
import { translations } from './i18n.ts';
import { Language, Theme, UserPreferences, Priority, TaskStatus, Task } from './types.ts';
import WaterTracker from './components/WaterTracker.tsx';
import SleepOptimizer from './components/SleepOptimizer.tsx';
import KanbanBoard from './components/KanbanBoard.tsx';
import Dashboard from './components/Dashboard.tsx';
import MicroHabits from './components/MicroHabits.tsx';
import GratitudeJar from './components/GratitudeJar.tsx';
import QuranReminder from './components/QuranReminder.tsx';
import Statistics from './components/Statistics.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import { syncUserToSupabase, saveSuggestionToSupabase, checkUserStatus } from './lib/supabase.ts';
import { 
  LayoutDashboard, 
  Droplets, 
  Moon as MoonIcon, 
  Sun, 
  Languages, 
  CheckSquare,
  Zap,
  Heart,
  Settings,
  ChevronRight,
  BarChart3,
  User as UserIcon,
  Book
} from 'lucide-react';

const STORAGE_KEY = 'lifebalance_user_data_v4';

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  theme: 'light',
  waterGoal: 2.0,
  waterIntake: 0,
  lastWaterReset: new Date().toDateString(),
  wakeupTime: '07:00',
  weekendWakeupTime: '09:00',
  isAlarmEnabled: false,
  sleepHistory: [],
  tasks: [],
  archivedTasks: [],
  gratitudeNotes: [],
  streak: 0,
  lastActivityDate: '',
  quranPagesGoal: 5,
  quranPagesRead: 0,
  lastQuranReset: new Date().toDateString(),
  quranEdition: 'kingFahd',
  quranTotalPages: 0,
  quranStreakDays: 0
};

const NewLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md flex-shrink-0`} overflow="visible">
    <defs>
      <clipPath id="logoCircleClip">
        <circle cx="50" cy="50" r="50" />
      </clipPath>
    </defs>
    <g clipPath="url(#logoCircleClip)">
      <path d="M50 50 L50 0 A 50 50 0 0 0 0 50 Z" fill="#1d4d4f" />
      <path d="M50 50 L0 50 A 50 50 0 0 0 50 100 Z" fill="#88a076" />
      <path d="M50 50 L50 100 A 50 50 0 0 0 50 0 Z" fill="#eb945e" />
      <path 
        d="M50 42 c1.6 0 3-1.4 3-3s-1.4-3-3-3-3 1.4-3 3 1.4 3 3 3 z 
           M59 34 c-3 2 -5 8 -5 14 s2 12 5 15 c1 1 2 0 2 -2 s-2 -8 -3 -13 s0 -10 1 -12 c1 -1 1 -2 0 -2 z
           M42 42 c-4 0 -8 2 -11 4 c-1 1 -1 3 1 4 s3 0 4 -1 c3 -2 6 -3 9 -3 c1 0 1 -4 -3 -4 z
           M48 53 c-2 4 -3 8 -3 13 s1 8 4 10 c1 1 2 0 2 -2 s-2 -4 -3 -8 s2 -8 3 -10 c1 -1 0 -3 -3 -3 z" 
        fill="white" 
      />
    </g>
  </svg>
);

const App: React.FC = () => {
  // simple auth state persisted separately from prefs
  const [auth, setAuth] = useState<{ loggedIn: boolean; user?: { name: string; email?: string }; isGuest?: boolean }>(() => {
    try {
      const raw = localStorage.getItem('lifebalance_auth');
      return raw ? JSON.parse(raw) : { loggedIn: false };
    } catch {
      return { loggedIn: false };
    }
  });

  // Blocked user state
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Check if user is blocked or deleted
  useEffect(() => {
    const checkStatus = async () => {
      if (auth.loggedIn && auth.user?.email) {
        const status = await checkUserStatus(auth.user.email);
        if (!status.exists) {
          setIsDeleted(true);
          setIsBlocked(false);
        } else if (status.blocked) {
          setIsBlocked(true);
          setIsDeleted(false);
        } else {
          setIsBlocked(false);
          setIsDeleted(false);
        }
      }
    };
    
    checkStatus();
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [auth.loggedIn, auth.user?.email]);

  // Handle blocked/deleted user - force logout
  const handleLogout = () => {
    localStorage.removeItem('lifebalance_auth');
    setAuth({ loggedIn: false });
    setIsBlocked(false);
    setIsDeleted(false);
  };

  useEffect(() => {
    try { localStorage.setItem('lifebalance_auth', JSON.stringify(auth)); } catch {}
  }, [auth]);

  function readUsers() {
    try {
      const raw = localStorage.getItem('lifebalance_users');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeUsers(obj: Record<string, any>) {
    try { localStorage.setItem('lifebalance_users', JSON.stringify(obj)); } catch {}
  }

  const handleAuth = (user: { name: string; email?: string } | null, isGuest = false) => {
    if (user) {
      setAuth({ loggedIn: true, user, isGuest });
      // load user's prefs if available
      if (user.email) {
        const users = readUsers();
        const u = users[user.email];
        if (u && u.prefs) {
          setPrefs(u.prefs);
        }
      }
    } else {
      setAuth({ loggedIn: false });
    }
  };

  // track session time for logged-in users so host page can show total time spent
  const sessionStartRef = useRef<number | null>(null);

  useEffect(() => {
    const startSession = () => {
      if (auth && auth.loggedIn && auth.user && auth.user.email) {
        sessionStartRef.current = Date.now();
      }
    };

    const flushSession = () => {
      try {
        if (sessionStartRef.current && auth && auth.loggedIn && auth.user && auth.user.email) {
          const delta = Date.now() - sessionStartRef.current;
          const users = readUsers();
          const email = auth.user.email;
          users[email] = users[email] || {};
          users[email].totalTimeSpent = (users[email].totalTimeSpent || 0) + delta;
          users[email].lastLogin = Date.now();
          writeUsers(users);
          sessionStartRef.current = null;
        }
      } catch {}
    };

    startSession();

    const onVisibility = () => {
      if (document.hidden) flushSession();
      else startSession();
    };

    window.addEventListener('beforeunload', flushSession);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      flushSession();
      window.removeEventListener('beforeunload', flushSession);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [auth]);

  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'water' | 'sleep' | 'tasks' | 'habits' | 'gratitude' | 'quran' | 'statistics' | 'settings'>('dashboard');
  
  const t = translations[prefs.language];
  const isRTL = prefs.language === 'ar';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    // if logged in, persist prefs to the user's record so their history is kept
    try {
      const rawAuth = localStorage.getItem('lifebalance_auth');
      const a = rawAuth ? JSON.parse(rawAuth) : null;
      if (a && a.loggedIn && a.user && a.user.email) {
        const usersRaw = localStorage.getItem('lifebalance_users');
        const users = usersRaw ? JSON.parse(usersRaw) : {};
        const email = a.user.email;
        users[email] = users[email] || {};
        users[email].name = a.user.name || users[email].name || '';
        users[email].email = email;
        users[email].prefs = prefs;
        users[email].lastLogin = users[email].lastLogin || Date.now();
        localStorage.setItem('lifebalance_users', JSON.stringify(users));
        
        // Sync ALL data to Supabase for cross-browser host page access
        syncUserToSupabase({
          id: email,
          email: email,
          name: a.user.name || null,
          is_guest: a.isGuest || false,
          water_intake: prefs.waterIntake || 0,
          water_goal: Math.round((prefs.waterGoal || 2) * 1000),
          quran_pages_today: prefs.quranPagesRead || 0,
          quran_daily_goal: prefs.quranPagesGoal || 5,
          quran_total_pages: prefs.quranTotalPages || 0,
          quran_streak: prefs.quranStreakDays || 0,
          tasks_completed: (prefs.tasks || []).filter((t: any) => t.status === 'done').length,
          gratitude_count: (prefs.gratitudeNotes || []).length,
          // Store full data for detailed view
          full_prefs: {
            language: prefs.language,
            theme: prefs.theme,
            waterGoal: prefs.waterGoal,
            wakeupTime: prefs.wakeupTime,
            weekendWakeupTime: prefs.weekendWakeupTime,
            isAlarmEnabled: prefs.isAlarmEnabled,
            streak: prefs.streak,
            lastActivityDate: prefs.lastActivityDate,
            quranEdition: prefs.quranEdition,
          },
          sleep_data: {
            wakeupTime: prefs.wakeupTime,
            weekendWakeupTime: prefs.weekendWakeupTime,
            isAlarmEnabled: prefs.isAlarmEnabled,
            sleepHistory: (prefs.sleepHistory || []).slice(-10), // Last 10 entries
          },
          tasks_data: (prefs.tasks || []).slice(-20), // Last 20 tasks
          gratitude_data: (prefs.gratitudeNotes || []).slice(-20), // Last 20 notes
          habits_data: [], // Will be populated if habits feature exists
        });
      }
    } catch {}
  }, [prefs]);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = prefs.language;
    document.title = `${t.title} App`;
    
    if (prefs.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [prefs.language, prefs.theme, isRTL, t.title]);

  useEffect(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (prefs.lastWaterReset !== today) {
      setPrefs(prev => {
        let newStreak = prev.streak;
        if (prev.lastActivityDate === yesterday) {
          newStreak += 1;
        } else if (prev.lastActivityDate !== today && prev.lastActivityDate !== '') {
          newStreak = 0; 
        }

        const now = Date.now();
        const toArchive = prev.tasks.filter(task => 
          task.status === TaskStatus.DONE && 
          task.completedAt && (now - task.completedAt > 24 * 60 * 60 * 1000)
        );
        const activeTasks = prev.tasks.filter(task => !toArchive.includes(task));

        return {
          ...prev,
          waterIntake: 0,
          lastWaterReset: today,
          lastActivityDate: today,
          streak: newStreak,
          tasks: activeTasks,
          archivedTasks: [...prev.archivedTasks, ...toArchive].slice(-50)
        };
      });
    }
  }, [prefs.lastWaterReset, prefs.lastActivityDate]);

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'water', label: t.waterTracker, icon: Droplets },
    { id: 'sleep', label: t.sleepOptimizer, icon: MoonIcon },
    { id: 'tasks', label: t.tasks, icon: CheckSquare },
    { id: 'habits', label: t.microHabits, icon: Zap },
    { id: 'gratitude', label: t.gratitudeJar, icon: Heart },
    { id: 'quran', label: t.quranReminder, icon: Book },
    { id: 'statistics', label: (t as any).headers?.statistics || (t as any).statistics, icon: BarChart3 },
  ];

  const toggleLanguage = () => {
    setPrefs(prev => ({ ...prev, language: prev.language === 'en' ? 'ar' : 'en' }));
  };

  const toggleTheme = () => {
    setPrefs(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const [showAccountPanel, setShowAccountPanel] = useState(false);

  const getAccountDetails = () => {
    if (!auth.user?.email) return null;
    const users = readUsers();
    return users[auth.user.email.toLowerCase()] || null;
  };

  const [suggestionText, setSuggestionText] = useState('');

  const submitSuggestion = async () => {
    const text = suggestionText.trim();
    if (!text) return alert('Please enter a suggestion.');
    try {
      // Save to localStorage (backup)
      const raw = localStorage.getItem('lifebalance_suggestions') || '[]';
      const arr = JSON.parse(raw);
      const entry = {
        id: Date.now(),
        text,
        ts: Date.now(),
        user: auth && auth.loggedIn && auth.user ? auth.user : null
      };
      arr.unshift(entry);
      localStorage.setItem('lifebalance_suggestions', JSON.stringify(arr));
      
      // Save to Supabase (cloud)
      await saveSuggestionToSupabase({
        user_email: auth?.user?.email || null,
        user_name: auth?.user?.name || null,
        text: text,
      });
      
      setSuggestionText('');
      alert('Thank you — your suggestion was submitted.');
    } catch (e) { alert('Failed to submit suggestion.'); }
  };

  return (
    <>
      {/* Blocked User Screen */}
      {auth.loggedIn && isBlocked && (
        <div className="fixed inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900 z-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-300 mb-4">
              {prefs.language === 'ar' ? 'تم حظر حسابك' : 'Account Blocked'}
            </h1>
            <p className="text-red-500 dark:text-red-200 mb-6">
              {prefs.language === 'ar' 
                ? 'تم حظر حسابك من قبل المسؤول. يرجى التواصل مع الدعم للمساعدة.'
                : 'Your account has been blocked by the administrator. Please contact support for assistance.'}
            </p>
            <button 
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
            >
              {prefs.language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </button>
          </div>
        </div>
      )}

      {/* Deleted User Screen */}
      {auth.loggedIn && isDeleted && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">🗑️</div>
            <h1 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-4">
              {prefs.language === 'ar' ? 'تم حذف حسابك' : 'Account Deleted'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {prefs.language === 'ar' 
                ? 'تم حذف حسابك. يمكنك إنشاء حساب جديد.'
                : 'Your account has been deleted. You can create a new account.'}
            </p>
            <button 
              onClick={handleLogout}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              {prefs.language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
            </button>
          </div>
        </div>
      )}

      {!auth.loggedIn ? (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="w-full h-full">
            {/* Auth Screen with quick toggles */}
            <React.Suspense fallback={<div className="p-8">Loading...</div>}>
              <AuthScreen 
                onAuth={handleAuth} 
                language={prefs.language}
                theme={prefs.theme}
                onToggleLanguage={toggleLanguage}
                onToggleTheme={toggleTheme}
              />
            </React.Suspense>
          </div>
        </div>
      ) : (
        <div className={`relative md:fixed md:inset-0 min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden`}>
          
      {/* Cinematic Ambient Mesh Gradient Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
         {/* Base Gradient */}
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500" />
         
         {/* Animated Mesh Blobs */}
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-300/30 dark:bg-indigo-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-60 animate-blob" />
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-300/30 dark:bg-purple-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-60 animate-blob" style={{ animationDelay: '2s' }} />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-300/30 dark:bg-pink-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-60 animate-blob" style={{ animationDelay: '4s' }} />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-300/30 dark:bg-blue-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-60 animate-blob" style={{ animationDelay: '6s' }} />
         <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-rose-200/20 dark:bg-rose-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-40 animate-blob" style={{ animationDelay: '3s' }} />
      </div>

      {/* Desktop Navigation Rail (Left) */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200/50 dark:border-slate-700/50 h-full z-50">
        <div className="flex items-center gap-3 p-6 h-20">
          <NewLogo className="w-8 h-8 lg:w-10 lg:h-10" />
          <span className="hidden lg:block text-xl font-black text-blue-600 dark:text-blue-500 tracking-tight">{t.title}</span>
        </div>
        
        <nav className="flex-1 px-3 space-y-2 pt-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`
                flex items-center w-full p-4 rounded-2xl transition-all duration-200 active:scale-90 ease-out transform
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-200'}
              `}
            >
              <item.icon size={24} className="flex-shrink-0" />
              <span className={`hidden lg:block ml-4 font-bold ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
              {activeTab === item.id && <ChevronRight size={16} className="hidden lg:block ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-3 mb-6">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`
              flex items-center w-full p-4 rounded-2xl transition-all duration-200 active:scale-90 ease-out transform
              ${activeTab === 'settings' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
            `}
          >
            <Settings size={24} />
            <span className="hidden lg:block ml-4 font-bold">{t.settings}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile Header */}
        <header className="flex md:hidden flex-shrink-0 pt-[env(safe-area-inset-top,1rem)] px-6 pb-2 items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-40">
          <div className="flex items-center gap-2 h-14">
            <NewLogo className="w-8 h-8" />
            <span className="text-xl font-black text-blue-600 dark:text-blue-500 tracking-tight">{t.title}</span>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-3 rounded-2xl transition-all duration-200 active:scale-90 ease-out transform ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 ios-scroll overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-12 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-12">
          <div className="max-w-6xl mx-auto w-full">
            <div key={activeTab} className="slide-up">
              {activeTab === 'dashboard' && <Dashboard prefs={prefs} setPrefs={setPrefs} setActiveTab={setActiveTab} user={auth.user} />}
              {activeTab === 'water' && <WaterTracker prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'sleep' && <SleepOptimizer prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'tasks' && <KanbanBoard prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'habits' && <MicroHabits prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'gratitude' && <GratitudeJar prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'quran' && <QuranReminder prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'statistics' && <Statistics prefs={prefs} setActiveTab={setActiveTab} />}
              {activeTab === 'settings' && (
                <div className="space-y-8">
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 max-w-4xl">
                    <h3 className="text-lg font-bold mb-2">{t.headers?.suggestions || 'Suggestions'}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300 mb-3">{t.descriptions?.sendSuggestions || 'Send suggestions to the host.'}</p>
                    <textarea
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                      className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-900 dark:text-white"
                      rows={3}
                    />
                    <div className="mt-3 flex gap-3">
                      <button onClick={submitSuggestion} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{t.buttons?.send || 'Send'}</button>
                      <button onClick={() => setSuggestionText('')} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">{t.buttons?.clear || 'Clear'}</button>
                    </div>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white">{t.settings}</h2>
                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
                    <button 
                      onClick={toggleLanguage}
                      className="flex items-center justify-between p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700 transition-all hover:ring-2 hover:ring-blue-500/20"
                    >
                      <span className="flex items-center gap-4 font-bold text-xl text-slate-800 dark:text-slate-100"><Languages size={28} className="text-blue-500"/> {t.language}</span>
                      <span className="text-blue-600 font-black px-4 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full text-xs uppercase tracking-widest">Switch</span>
                    </button>
                    <button 
                      onClick={toggleTheme}
                      className="flex items-center justify-between p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700 transition-all hover:ring-2 hover:ring-indigo-500/20"
                    >
                      <span className="flex items-center gap-4 font-bold text-xl text-slate-800 dark:text-slate-100">
                        {prefs.theme === 'dark' ? <Sun size={28} className="text-orange-400"/> : <MoonIcon size={28} className="text-indigo-500"/>}
                        {t.theme}
                      </span>
                      <div className="w-14 h-7 bg-slate-200 dark:bg-slate-700 rounded-full relative">
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${prefs.theme === 'dark' ? 'left-8' : 'left-1'}`} />
                      </div>
                    </button>
                    <button 
                      onClick={() => setShowAccountPanel(true)}
                      className="flex items-center justify-between p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700 transition-all hover:ring-2 hover:ring-purple-500/20"
                    >
                      <span className="flex items-center gap-4 font-bold text-xl text-slate-800 dark:text-slate-100"><UserIcon size={28} className="text-purple-500"/> {t.buttons?.account || 'Account'}</span>
                      <span className="text-slate-600 dark:text-slate-400 font-black text-sm">{auth.user?.name || 'Guest'}</span>
                    </button>
                    <div className="md:col-span-2 pt-6">
                      <button 
                        onClick={() => {
                          if (confirm(t.reset)) {
                            localStorage.removeItem(STORAGE_KEY);
                            window.location.reload();
                          }
                        }}
                        className="w-full flex items-center justify-center p-8 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-3xl border border-rose-100 dark:border-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all font-black text-xl"
                      >
                        {t.reset}
                      </button>
                    </div>
                    {auth.loggedIn && (
                      <div className="md:col-span-2 pt-6">
                        <button 
                          onClick={() => {
                            if (confirm(auth.isGuest ? 'Exit guest mode?' : 'Are you sure you want to logout?')) {
                              handleAuth(null);
                            }
                          }}
                          className="w-full flex items-center justify-center p-8 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-3xl border border-red-100 dark:border-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all font-black text-xl"
                        >
                          {auth.isGuest ? 'Exit Guest Mode' : 'Logout'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Account Panel Modal */}
        {showAccountPanel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <UserIcon size={28} className="text-purple-500" />
                  {t.buttons?.account || 'Account'}
                </h3>
                <button 
                  onClick={() => setShowAccountPanel(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  ✕
                </button>
              </div>

              {auth.loggedIn && auth.user ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.account?.name || 'Name'}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{auth.user.name}</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.account?.emailPhone || 'Email / Phone'}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white break-all">{auth.user.email || t.account?.unknown || 'N/A'}</p>
                  </div>

                  {(() => {
                    const details = getAccountDetails();
                    return details ? (
                      <>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.account?.type || 'Account Type'}</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white">{auth.isGuest ? (t.account?.guest || 'Guest') : (t.account?.registered || 'Registered')}</p>
                        </div>

                        {details.createdAt && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.account?.created || 'Created'}</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{new Date(details.createdAt).toLocaleDateString()}</p>
                          </div>
                        )}

                        {details.lastLogin && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.account?.lastLogin || 'Last Login'}</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{new Date(details.lastLogin).toLocaleDateString()}</p>
                          </div>
                        )}

                        {details.totalTimeSpent && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.account?.totalTime || 'Total Time Spent'}</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">{Math.round(details.totalTimeSpent / 1000 / 60)} {t.account?.minutes || 'minutes'}</p>
                          </div>
                        )}

                        <div className="flex gap-3 mt-6">
                          <button 
                            onClick={() => setShowAccountPanel(false)}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black transition hover:bg-slate-200 dark:hover:bg-slate-600"
                          >
                            {t.account?.close || 'Close'}
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(t.account?.deleteConfirm || 'Are you sure you want to delete your account? This cannot be undone.')) {
                                const users = readUsers();
                                if (auth.user?.email) {
                                  delete users[auth.user.email.toLowerCase()];
                                  writeUsers(users);
                                }
                                handleAuth(null);
                                setShowAccountPanel(false);
                              }
                            }}
                            className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black transition hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800"
                          >
                            {t.account?.delete || 'Delete Account'}
                          </button>
                        </div>
                      </>
                    ) : null;
                  })()}

                  {auth.loggedIn && !auth.user && (
                    <button 
                      onClick={() => setShowAccountPanel(false)}
                      className="w-full mt-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black transition hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      {t.account?.close || 'Close'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400 font-bold mb-4">{t.account?.loginMessage || 'Please login to view account details.'}</p>
                  <button 
                    onClick={() => setShowAccountPanel(false)}
                    className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black transition hover:bg-blue-700"
                  >
                    {t.account?.close || 'Close'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Floating Glass Dock */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 safe-area-pb">
          <div className="flex items-center justify-around px-1 h-16 overflow-x-auto no-scrollbar">
            {menuItems.map(item => {
              const isActive = activeTab === item.id;
              // Short labels for mobile
              const shortLabel = item.id === 'dashboard' ? 'Home' 
                : item.id === 'water' ? 'Water'
                : item.id === 'sleep' ? 'Sleep'
                : item.id === 'tasks' ? 'Tasks'
                : item.id === 'habits' ? 'Habits'
                : item.id === 'gratitude' ? 'Thanks'
                : item.id === 'quran' ? 'Quran'
                : item.id === 'statistics' ? 'Stats'
                : (item.label as string)?.split(' ')[0];
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`
                    flex flex-col items-center justify-center gap-0.5 py-2 px-1.5 min-w-[48px] rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-400 dark:text-slate-500 active:text-slate-600'}
                  `}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[9px] font-bold leading-tight ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
        </div>
      </div>
      )}
    </>
  );
};

export default App;