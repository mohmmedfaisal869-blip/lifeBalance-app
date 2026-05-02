import React, { useEffect, useState } from 'react';
import { Mail, User, ArrowRight, Sparkles, Shield, Globe, Sun, Moon } from 'lucide-react';
import { translations } from '../i18n';

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

function defaultPrefs(lang: 'en' | 'ar', theme: 'light' | 'dark') {
  const now = new Date().toDateString();
  return {
    language: lang,
    theme,
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
    lastActivityDate: '',
    quranPagesGoal: 5,
    quranPagesRead: 0,
    lastQuranReset: now,
    quranEdition: 'kingFahd',
    quranTotalPages: 0,
    quranStreakDays: 0
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
  const t = translations[language];
  const ta = t.auth;
  const [mode, setMode] = useState<'login' | 'signup' | 'guest'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorTimeoutRef = React.useRef<number | null>(null);

  const showError = (msg: string) => {
    setIsLoading(false);
    setError(msg);
    if (errorTimeoutRef.current) {
      window.clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = window.setTimeout(() => {
      setError(null);
      errorTimeoutRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        window.clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Safety net: never keep auth button stuck in loading state.
  useEffect(() => {
    if (!isLoading) return;
    const timeout = window.setTimeout(() => {
      setIsLoading(false);
      showError(
        language === 'ar'
          ? 'استغرق الطلب وقتًا أطول من المتوقع. حاول مرة أخرى.'
          : 'Request is taking longer than expected. Please try again.'
      );
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, [isLoading, language]);

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!name.trim()) {
        showError(ta.errors.name);
        return;
      }
      if (!email.trim()) {
        showError(ta.errors.email);
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        showError(ta.errors.emailInvalid);
        return;
      }
      if (phone.trim() && !/^\+?[0-9\s()-]{7,20}$/.test(phone.trim())) {
        showError(ta.errors.phoneInvalid);
        return;
      }
      
      const users = readUsers();
      if (users[email.toLowerCase()]) {
        showError(ta.errors.accountExists);
        return;
      }
      
      const user = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        prefs: defaultPrefs(language, theme),
        createdAt: Date.now(),
        lastLogin: Date.now(),
        isGuest: false
      };
      users[email.toLowerCase()] = user;
      writeUsers(users);
      onAuth({ name: user.name, email: user.email }, false);
    } catch {
      showError(language === 'ar' ? 'حدث خطأ غير متوقع. حاول مرة أخرى.' : 'Unexpected error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const identifier = email.trim();
      if (!identifier) {
        showError(ta.errors.idRequired);
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
        showError(ta.errors.idInvalid);
        return;
      }

      if (!user) {
        showError(ta.errors.notFound);
        return;
      }

      if (!user.email || typeof user.email !== 'string') {
        showError(language === 'ar' ? 'بيانات الحساب غير مكتملة. أنشئ حسابًا جديدًا.' : 'Account data is incomplete. Please create a new account.');
        return;
      }
      
      user.lastLogin = Date.now();
      users[user.email.toLowerCase()] = user;
      writeUsers(users);
      onAuth({ name: user.name, email: user.email.toLowerCase() }, false);
    } catch {
      showError(language === 'ar' ? 'حدث خطأ غير متوقع. حاول مرة أخرى.' : 'Unexpected error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    const id = `guest_${Date.now()}`;
    const guestEmail = `${id}@guest.local`;
    const users = readUsers();
    const user = {
      name: ta.guestName,
      email: guestEmail,
      prefs: defaultPrefs(language, theme),
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isGuest: true
    };
    users[guestEmail] = user;
    writeUsers(users);
    onAuth({ name: ta.guestName, email: guestEmail }, true);
  };

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md my-8 relative">
        {/* Top quick toggles (inline end = right in LTR, left in RTL) */}
        <div className="absolute -top-2 end-0 flex items-center gap-2">
          <button
            onClick={onToggleLanguage}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black shadow-sm hover:shadow transition"
            aria-label={ta.ariaToggleLang}
            type="button"
          >
            {language === 'ar' ? 'عربي' : 'EN'} / {language === 'ar' ? 'EN' : 'عربي'}
          </button>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition"
            aria-label={theme === 'dark' ? ta.titleSwitchLight : ta.titleSwitchDark}
            title={theme === 'dark' ? ta.titleSwitchLight : ta.titleSwitchDark}
            type="button"
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
            {t.title}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">
            {ta.brandSubtitle}
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-2xl">
            <button 
              type="button"
              onClick={() => { setMode('login'); setError(null); setName(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all duration-200 ${
                mode === 'login' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {ta.signIn}
            </button>
            <button 
              type="button"
              onClick={() => { setMode('signup'); setError(null); setName(''); setEmail(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all duration-200 ${
                mode === 'signup' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {ta.signUp}
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
                  {ta.guestTitle}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed max-w-sm mx-auto">
                  {ta.guestBody}
                </p>
              </div>
              <button 
                type="button"
                onClick={handleGuest} 
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles size={20} />
                {ta.continueGuest}
                <ArrowRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />
              </button>
            </div>
          ) : (
            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-6">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    {ta.fullName}
                  </label>
                  <div className="relative">
                    <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                      <User size={22} />
                    </div>
                    <input 
                      type="text"
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full ps-14 pe-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-bold text-lg"
                      placeholder={ta.phName}
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    {ta.mobileNumber}
                  </label>
                  <div className="relative">
                    <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                      <Globe size={22} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full ps-14 pe-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-bold text-lg"
                      placeholder={ta.phPhone}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                  {mode === 'login' ? ta.emailOrMobile : ta.emailAddress}
                </label>
                <div className="relative">
                  <div className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Mail size={22} />
                  </div>
                  <input 
                    type={mode === 'login' ? 'text' : 'email'}
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full ps-14 pe-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-bold text-lg"
                    placeholder={mode === 'login' ? ta.phLoginId : ta.phEmail}
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
                    <span>{ta.processing}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? ta.signIn : ta.createAccount}</span>
                    <ArrowRight size={22} className={language === 'ar' ? 'rotate-180' : ''} />
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                    {ta.or}
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => { setMode('guest'); setError(null); }}
                className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-3 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
              >
                <Shield size={20} />
                {ta.continueGuest}
              </button>
            </form>
          )}

          {/* Security Note */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Shield size={14} />
              <span className="font-bold">{ta.securityNote}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 animate-in fade-in">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">
            © {new Date().getFullYear()} {t.title}. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
