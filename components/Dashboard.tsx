import React, { useMemo } from 'react';
import { UserPreferences, TaskStatus } from '../types';
import { translations } from '../i18n';
import { Droplets, Moon, CheckCircle2, ArrowUpRight, Flame, Heart, Sparkles, Zap } from 'lucide-react';

const NewLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md flex-shrink-0`} overflow="visible">
    <defs>
      <clipPath id="dashLogoCircleClip">
        <circle cx="50" cy="50" r="50" />
      </clipPath>
    </defs>
    <g clipPath="url(#dashLogoCircleClip)">
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

interface DashboardProps {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  setActiveTab: (tab: any) => void;
  user?: { name: string; email?: string };
}

const Dashboard: React.FC<DashboardProps> = ({ prefs, setPrefs, setActiveTab, user }) => {
  const t = translations[prefs.language];
  const goalMl = prefs.waterGoal * 1000;
  const waterPercent = Math.min(100, (prefs.waterIntake / goalMl) * 100);
  const pendingTasks = prefs.tasks.filter(t => t.status !== TaskStatus.DONE).length;
  const lastSleep = prefs.sleepHistory[prefs.sleepHistory.length - 1];
  const latestGratitude = prefs.gratitudeNotes[0];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetings.morning;
    if (hour < 17) return t.greetings.afternoon;
    if (hour < 21) return t.greetings.evening;
    return t.greetings.night;
  }, [t.greetings]);

  const dailyTip = useMemo(() => {
    const tipIndex = new Date().getDate() % t.tips.length;
    return t.tips[tipIndex];
  }, [t.tips]);

  const cards = [
    {
      id: 'water',
      title: t.waterTracker,
      value: `${prefs.waterIntake} / ${goalMl}`,
      subtitle: t.ml,
      progress: waterPercent,
      icon: Droplets,
      color: 'bg-blue-500',
      tab: 'water'
    },
    {
      id: 'sleep',
      title: t.sleepOptimizer,
      value: lastSleep ? t[lastSleep.quality] : '--',
      subtitle: prefs.isAlarmEnabled ? t.alarmOn : t.alarmOff,
      progress: lastSleep ? 100 : 0,
      icon: Moon,
      color: 'bg-indigo-500',
      tab: 'sleep'
    },
    {
      id: 'tasks',
      title: t.tasks,
      value: pendingTasks.toString(),
      subtitle: t.todo,
      progress: (prefs.tasks.filter(t => t.status === TaskStatus.DONE).length / (prefs.tasks.length || 1)) * 100,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      tab: 'tasks'
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="w-full lg:w-auto flex items-center gap-5 md:gap-8 flex-col md:flex-row text-center md:text-left">
          <NewLogo className="hidden md:block w-16 h-16 md:w-24 md:h-24" />
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-1 tracking-tight text-slate-900 dark:text-white">
              {greeting}, <span className="text-blue-600 dark:text-blue-500">{user?.name || 'User'}</span>
            </h2>
            <p className="text-slate-500 text-base md:text-lg font-bold opacity-80">
              {new Date().toLocaleDateString(prefs.language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <div className="order-first md:order-none w-full lg:w-80 flex items-center justify-between lg:justify-end gap-6 bg-gradient-to-br from-orange-500 to-red-600 p-6 md:p-8 rounded-[2rem] text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md">
              <Flame size={48} className="animate-pulse fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-5xl font-black leading-none tabular-nums">{prefs.streak}</span>
              <span className="text-sm uppercase font-black tracking-widest opacity-80">{t.days} {t.streak}</span>
            </div>
          </div>
          <Sparkles className="absolute top-4 right-4 text-white/40" size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => setActiveTab(card.tab)}
            className="group relative bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700/50 hover:-translate-y-2 transition-all text-left overflow-hidden"
          >
            <div className={`absolute top-0 ${prefs.language === 'ar' ? 'left-0' : 'right-0'} w-40 h-40 ${card.color} opacity-[0.03] rounded-bl-[4rem] group-hover:scale-150 transition-transform duration-700`} />
            
            <div className="flex justify-between items-start mb-8">
              <div className={`${card.color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-current/20`}>
                <card.icon size={32} />
              </div>
              <ArrowUpRight className="text-slate-200 group-hover:text-blue-500 transition-colors" size={28} />
            </div>

            <h3 className="text-slate-400 font-black mb-1 uppercase tracking-[0.1em] text-[10px]">{card.title}</h3>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-black tabular-nums text-slate-900 dark:text-white leading-none">{card.value}</span>
              <span className="text-slate-400 font-bold text-sm">{card.subtitle}</span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
              <div 
                className={`${card.color} h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]`} 
                style={{ width: `${card.progress}%` }} 
              />
            </div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-10 rounded-[3rem] text-emerald-600 dark:text-emerald-400 shadow-inner">
             <Heart size={72} className="animate-bounce" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h4 className="text-emerald-500 uppercase font-black tracking-[0.2em] text-xs">{t.dailyTip}</h4>
              <Sparkles size={18} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">{dailyTip}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
          <button 
            onClick={() => setActiveTab('habits')}
            className="group flex items-center justify-between p-10 bg-blue-600 rounded-[3rem] text-white shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-transform text-left"
          >
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md">
                <Zap size={40} />
              </div>
              <div>
                <h4 className="font-black text-2xl leading-none mb-2">{t.microHabits}</h4>
                <p className="opacity-80 font-bold text-base">{t.habitChallenge}</p>
              </div>
            </div>
            <ArrowUpRight className="opacity-40 group-hover:opacity-100 transition-opacity" size={28} />
          </button>

          <button 
            onClick={() => setActiveTab('gratitude')}
            className="group p-10 bg-rose-500 rounded-[3rem] text-white shadow-2xl shadow-rose-500/20 hover:scale-[1.02] transition-transform text-left relative overflow-hidden"
          >
            <div className="flex items-center gap-6 mb-6">
              <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md">
                <Heart size={40} />
              </div>
              <h4 className="font-black text-2xl leading-none">{t.gratitudeJar}</h4>
            </div>
            {latestGratitude ? (
              <div className="bg-white/10 p-6 rounded-[2rem] backdrop-blur-md border border-white/10">
                <p className="text-xs uppercase font-black tracking-widest mb-2 opacity-60">{t.recentGratitude}</p>
                <p className="font-bold text-xl line-clamp-1 italic">"{latestGratitude.text}"</p>
              </div>
            ) : (
              <p className="font-bold opacity-80 text-lg">{t.jarEmpty}</p>
            )}
            <Sparkles className="absolute bottom-6 right-6 opacity-20" size={32} />
          </button>
        </div>
      </div>

      {/* Mobile quick actions */}
      <div className="md:hidden mt-6 flex items-center gap-3 overflow-x-auto py-2">
        <button onClick={() => setActiveTab('water')} className="min-w-[110px] flex-shrink-0 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex flex-col items-center gap-2">
          <Droplets size={20} />
          <span className="text-xs font-black">Water</span>
        </button>
        <button onClick={() => setActiveTab('sleep')} className="min-w-[110px] flex-shrink-0 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex flex-col items-center gap-2">
          <Moon size={20} />
          <span className="text-xs font-black">Sleep</span>
        </button>
        <button onClick={() => setActiveTab('tasks')} className="min-w-[110px] flex-shrink-0 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex flex-col items-center gap-2">
          <CheckCircle2 size={20} />
          <span className="text-xs font-black">Tasks</span>
        </button>
        <button onClick={() => setActiveTab('habits')} className="min-w-[110px] flex-shrink-0 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex flex-col items-center gap-2">
          <Zap size={20} />
          <span className="text-xs font-black">Habits</span>
        </button>
        <button onClick={() => setActiveTab('gratitude')} className="min-w-[110px] flex-shrink-0 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex flex-col items-center gap-2">
          <Heart size={20} />
          <span className="text-xs font-black">Gratitude</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;