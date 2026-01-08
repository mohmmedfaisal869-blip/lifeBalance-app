import React, { useState, useEffect, useRef } from 'react';
import { translations } from './i18n.ts';
import { Language, Theme, UserPreferences, Priority, TaskStatus, Task } from './types.ts';
import WaterTracker from './components/WaterTracker.tsx';
import SleepOptimizer from './components/SleepOptimizer.tsx';
import KanbanBoard from './components/KanbanBoard.tsx';
import Dashboard from './components/Dashboard.tsx';
import MicroHabits from './components/MicroHabits.tsx';
import GratitudeJar from './components/GratitudeJar.tsx';
import AuthScreen from './components/AuthScreen.tsx';
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
  ChevronRight
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
  lastActivityDate: ''
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'water' | 'sleep' | 'tasks' | 'habits' | 'gratitude' | 'settings'>('dashboard');
  
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
  ];

  const toggleLanguage = () => {
    setPrefs(prev => ({ ...prev, language: prev.language === 'en' ? 'ar' : 'en' }));
  };

  const toggleTheme = () => {
    setPrefs(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const [suggestionText, setSuggestionText] = useState('');

  const submitSuggestion = () => {
    const text = suggestionText.trim();
    if (!text) return alert('Please enter a suggestion.');
    try {
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
      setSuggestionText('');
      alert('Thank you — your suggestion was submitted.');
    } catch (e) { alert('Failed to submit suggestion.'); }
  };

  return (
    <>
      {!auth.loggedIn ? (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="w-full h-full">
            {/* lazy-load AuthScreen to avoid circular noise */}
            <React.Suspense fallback={<div className="p-8">Loading...</div>}>
              <AuthScreen onAuth={handleAuth} />
            </React.Suspense>
          </div>
        </div>
      ) : (
        <div className={`relative md:fixed md:inset-0 min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
      
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
                flex items-center w-full p-4 rounded-2xl transition-all
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
              flex items-center w-full p-4 rounded-2xl transition-all
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="flex md:hidden flex-shrink-0 pt-[env(safe-area-inset-top,1rem)] px-6 pb-2 items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-40">
          <div className="flex items-center gap-2 h-14">
            <NewLogo className="w-8 h-8" />
            <span className="text-xl font-black text-blue-600 dark:text-blue-500 tracking-tight">{t.title}</span>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-3 rounded-2xl transition-all active:scale-90 ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 ios-scroll overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-12 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-12">
          <div className="max-w-6xl mx-auto w-full">
            <div key={activeTab} className="slide-up">
              {activeTab === 'dashboard' && <Dashboard prefs={prefs} setPrefs={setPrefs} setActiveTab={setActiveTab} />}
              {activeTab === 'water' && <WaterTracker prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'sleep' && <SleepOptimizer prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'tasks' && <KanbanBoard prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'habits' && <MicroHabits prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'gratitude' && <GratitudeJar prefs={prefs} setPrefs={setPrefs} />}
              {activeTab === 'settings' && (
                <div className="space-y-8">
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 max-w-4xl">
                    <h3 className="text-lg font-bold mb-2">Suggestions</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300 mb-3">Send suggestions to the host page.</p>
                    <textarea
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                      className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-900 dark:text-white"
                      rows={3}
                    />
                    <div className="mt-3 flex gap-3">
                      <button onClick={submitSuggestion} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Send</button>
                      <button onClick={() => setSuggestionText('')} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">Clear</button>
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 fixed bottom-0 left-0 right-0 z-50 h-[calc(5rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center justify-around h-20 px-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`
                  flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all active:scale-75
                  ${activeTab === item.id ? 'text-blue-600 dark:text-blue-400 scale-110 font-bold' : 'text-slate-400 font-medium'}
                `}
              >
                <div className="relative">
                  <item.icon size={26} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                  {activeTab === item.id && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_0_8px_rgba(37,99,235,1)] animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] mt-1 uppercase tracking-tighter truncate max-w-full px-1">
                  {item.id === 'dashboard' ? 'Home' : item.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </nav>
        </div>
      </div>
      )}
    </>
  );
};

export default App;