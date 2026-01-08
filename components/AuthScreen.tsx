import React, { useState } from 'react';

interface AuthScreenProps {
  onAuth: (user: { name: string; email?: string } | null, isGuest?: boolean) => void;
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

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'guest'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const showError = (msg: string) => alert(msg);

  const handleSignup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name) return showError('Please enter your name');
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showError('Please enter a valid email');

    const users = readUsers();
    if (users[email]) return showError('An account with this email already exists. Please login.');

    const user = {
      name,
      email,
      prefs: defaultPrefs(),
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isGuest: false
    };
    users[email] = user;
    writeUsers(users);
    onAuth({ name, email }, false);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showError('Please enter a valid email');
    const users = readUsers();
    const user = users[email];
    if (!user) return showError('No account found for this email. Please sign up.');
    // update lastLogin
    user.lastLogin = Date.now();
    users[email] = user;
    writeUsers(users);
    onAuth({ name: user.name, email }, false);
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
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-black mb-4 text-slate-900 dark:text-white">Welcome to LifeBalance</h2>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-2xl ${mode === 'login' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>Login</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 rounded-2xl ${mode === 'signup' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>Sign Up</button>
          <button onClick={() => setMode('guest')} className={`flex-1 py-2 rounded-2xl ${mode === 'guest' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>Guest</button>
        </div>

        {mode === 'guest' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Continue as a guest. Your data will be saved locally.</p>
            <button onClick={handleGuest} className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-black">Continue as Guest</button>
          </div>
        ) : (
          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-white">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-white">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black">{mode === 'login' ? 'Login' : 'Create Account'}</button>
              <button type="button" onClick={handleGuest} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-2xl">Guest</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
