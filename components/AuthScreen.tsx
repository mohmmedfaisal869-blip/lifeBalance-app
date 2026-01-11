import React, { useState } from 'react';
import { Mail, User, ArrowRight, Sparkles, Shield, Globe, Sun, Moon } from 'lucide-react';

interface AuthScreenProps {
  onAuth: (user: { name: string; email?: string } | null, isGuest?: boolean) => void;
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
}

function readUsers() {
  try {
    const raw = localStorage.getItem('lifebalance_users');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeUsers(obj: Record<string, any>) {
  try {
    localStorage.setItem('lifebalance_users', JSON.stringify(obj));
  } catch {}
}

function defaultPrefs() {
  const now = new Date().toDateString();
  return {
    language: 'en',
    theme: 'light',
    waterGoal: 2.0,
    waterIntake: 0,
    lastWaterReset: now,
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
}

const Logo = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-lg" overflow="visible">
    <defs>
      <clipPath id="authLogoCircle">
        <circle cx="50" cy="50" r="50" />
      </clipPath>
    </defs>
    <g clipPath="url(#authLogoCircle)">
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

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth, language, theme, onToggleLanguage, onToggleTheme }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'guest'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (!name.trim()) {
      showError('Please enter your name');
      setIsLoading(false);
      return;
    }
    if (!email.trim()) {
      showError('Please enter your email');
      setIsLoading(false);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    if (phone.trim() && !/^\+?[0-9\s()-]{7,20}$/.test(phone.trim())) {
      showError('Please enter a valid mobile number');
      setIsLoading(false);
      return;
    }
    
    const users = readUsers();
    if (users[email.toLowerCase()]) {
      showError('An account with this email already exists. Please login.');
      setIsLoading(false);
      return;
    }
    
    const user = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      prefs: defaultPrefs(),
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isGuest: false
    };
    users[email.toLowerCase()] = user;
    writeUsers(users);
    onAuth({ name: user.name, email: user.email }, false);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const identifier = email.trim();
    if (!identifier) {
      showError('Please enter your email or mobile number');
      setIsLoading(false);
      return;
    }
    
    const users = readUsers();
    let user: any = null;
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const phoneRegex = /^\+?[0-9\s()-]{7,20}$/;

    if (emailRegex.test(identifier)) {
      user = users[identifier.toLowerCase()];
    } else if (phoneRegex.test(identifier)) {
      const digits = (s: string) => s.replace(/\D/g, '');
      const wanted = digits(identifier);
      user = Object.values(users).find((u: any) => u && u.phone && digits(String(u.phone)) === wanted);
    } else {
      showError('Please enter a valid email or mobile number');
      setIsLoading(false);
      return;
    }

    if (!user) {
      showError('No account found. Please sign up first.');
      setIsLoading(false);
      return;
    }
    
    user.lastLogin = Date.now();
    users[user.email.toLowerCase()] = user;
    writeUsers(users);
    onAuth({ name: user.name, email: user.email.toLowerCase() }, false);
  };

  const handleGuest = () => {
    const id = `guest_${Date.now()}`;
    const guestEmail = `${id}@guest.local`;
    const users = readUsers();
    const user = {
      name: 'Guest',
      email: guestEmail,
      prefs: defaultPrefs(),
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isGuest: true
    };
    users[guestEmail] = user;
    writeUsers(users);
    onAuth({ name: 'Guest', email: guestEmail }, true);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 overflow-y-auto">
      <div className="w-full max-w-md my-8 relative">
        {/* Top-right quick toggles */}
        <div className="absolute -top-2 right-0 flex items-center gap-2">
          <button
            onClick={onToggleLanguage}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black shadow-sm hover:shadow transition"
            aria-label="Toggle language"
          >
            {language === 'ar' ? 'عربي' : 'EN'} / {language === 'ar' ? 'EN' : 'عربي'}
          </button>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        {/* Logo and Branding Section */}
        <div className="text-center mb-8 animate-in fade-in">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl inline-block">
              <Logo />
            </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            LifeBalance
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">
            Welcome to your wellness journey
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-2xl">
            <button 
              onClick={() => { setMode('login'); setError(null); setName(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all duration-200 ${
                mode === 'login' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(null); setName(''); setEmail(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all duration-200 ${
                mode === 'signup' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-2xl animate-in fade-in">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 text-center">{error}</p>
            </div>
          )}

          {/* Guest Mode */}
          {mode === 'guest' ? (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mb-2 shadow-lg">
                  <Sparkles size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Continue as Guest
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed max-w-sm mx-auto">
                  Explore LifeBalance without creating an account. Your data will be saved locally on this device.
                </p>
              </div>
              <button 
                onClick={handleGuest} 
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles size={20} />
                Continue as Guest
                <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-6">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <User size={22} />
                    </div>
                    <input 
                      type="text"
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-bold text-lg"
                      placeholder="Enter your name"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <Globe size={22} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-bold text-lg"
                      placeholder="e.g. +1 555 123 4567"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                  {mode === 'login' ? 'Email or Mobile Number' : 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <Mail size={22} />
                  </div>
                  <input 
                    type={mode === 'login' ? 'text' : 'email'}
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-bold text-lg"
                    placeholder={mode === 'login' ? 'your.email@example.com or +1 555 123 4567' : 'your.email@example.com'}
                    autoComplete={mode === 'login' ? 'username' : 'email'}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={22} />
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                    OR
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => { setMode('guest'); setError(null); }}
                className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-3 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
              >
                <Shield size={20} />
                Continue as Guest
              </button>
            </form>
          )}

          {/* Security Note */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Shield size={14} />
              <span className="font-bold">Your data is stored securely locally</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 animate-in fade-in">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">
            © {new Date().getFullYear()} LifeBalance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
