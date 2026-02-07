import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences } from '../types';
import { translations } from '../i18n';
import { 
  Zap, Play, RotateCcw, Droplets, Wind, Smile, User, 
  CheckCircle, Hand, Brain, Layout, Coffee, Footprints, MoveRight, Sparkles 
} from 'lucide-react';

interface MicroHabitsProps {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const HABITS = ['neck', 'eyes', 'water', 'breath', 'posture', 'hand', 'face', 'desk', 'fruit', 'stand', 'walk'];

const MicroHabits: React.FC<MicroHabitsProps> = ({ prefs, setPrefs }) => {
  const t = translations[prefs.language];
  const [currentHabit, setCurrentHabit] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(t.habitFinished);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, t.habitFinished]);

  const startChallenge = () => {
    const randomHabit = HABITS[Math.floor(Math.random() * HABITS.length)];
    setCurrentHabit(randomHabit);
    setTimeLeft(600);
    setIsActive(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderIllustration = (habit: string) => {
    const iconSize = 80;
    const baseClass = "relative w-48 h-48 rounded-full flex items-center justify-center overflow-hidden border-4 shadow-inner";
    
    switch (habit) {
      case 'neck':
        return (
          <div className={`${baseClass} bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800`}>
            <User size={iconSize} className="text-blue-600 dark:text-blue-400 animate-pulse" />
            <div className="absolute top-1/4 w-full flex justify-between px-4">
              <RotateCcw className="text-blue-400/50 animate-spin" size={32} style={{ animationDuration: '4s' }} />
              <RotateCcw className="text-blue-400/50 animate-spin" size={32} style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
            </div>
          </div>
        );
      case 'eyes':
        return (
          <div className={`${baseClass} bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800`}>
            <Smile size={iconSize} className="text-indigo-600 dark:text-indigo-400" />
            <div className="absolute inset-0 bg-indigo-900/10 backdrop-blur-sm opacity-60 flex items-center justify-center">
              <Zap size={40} className="text-white" />
            </div>
          </div>
        );
      case 'water':
        return (
          <div className={`${baseClass} bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800`}>
            <Droplets size={iconSize} className="text-cyan-600 dark:text-cyan-400 animate-bounce" />
          </div>
        );
      case 'breath':
        return (
          <div className={`${baseClass} bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800`}>
            <Wind size={iconSize} className="text-emerald-600 dark:text-emerald-400 scale-125 animate-pulse" />
          </div>
        );
      case 'posture':
        return (
          <div className={`${baseClass} bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800`}>
            <MoveRight size={iconSize} className="text-amber-600 dark:text-amber-400 -rotate-90" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-1 bg-amber-600/20 rotate-45" />
          </div>
        );
      case 'hand':
        return (
          <div className={`${baseClass} bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800`}>
            <Hand size={iconSize} className="text-rose-600 dark:text-rose-400 animate-pulse" />
          </div>
        );
      case 'face':
        return (
          <div className={`${baseClass} bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800`}>
            <Smile size={iconSize} className="text-purple-600 dark:text-purple-400" />
            <div className="absolute bottom-4 flex gap-1">
              <Sparkles size={16} className="text-purple-400 animate-ping" />
              <Sparkles size={16} className="text-purple-400 animate-ping delay-100" />
            </div>
          </div>
        );
      case 'desk':
        return (
          <div className={`${baseClass} bg-slate-100 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600`}>
            <Layout size={iconSize} className="text-slate-600 dark:text-slate-400" />
            <CheckCircle className="absolute top-4 right-4 text-emerald-500" size={24} />
          </div>
        );
      case 'fruit':
        return (
          <div className={`${baseClass} bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800`}>
            <Coffee size={iconSize} className="text-orange-600 dark:text-orange-400 animate-pulse" />
          </div>
        );
      case 'stand':
        return (
          <div className={`${baseClass} bg-lime-100 dark:bg-lime-900/30 border-lime-200 dark:border-lime-800`}>
            <User size={iconSize} className="text-lime-600 dark:text-lime-400 -translate-y-2 transition-transform" />
          </div>
        );
      case 'walk':
        return (
          <div className={`${baseClass} bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800`}>
            <Footprints size={iconSize} className="text-sky-600 dark:text-sky-400 animate-bounce" />
          </div>
        );
      default:
        return <Zap size={iconSize} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black mb-1 tracking-tight text-slate-900 dark:text-white">{t.microHabits}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">{t.habitChallenge}</p>
        </div>
        {!isActive && (
          <button 
            onClick={startChallenge}
            className="group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black transition-all shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95"
          >
            <Play size={20} fill="currentColor" />
            {t.generateHabit}
          </button>
        )}
      </div>

      {currentHabit && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center gap-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Zap size={200} />
             </div>
             
             {renderIllustration(currentHabit)}

             <div className="space-y-4 relative z-10">
               <h3 className="text-3xl font-black text-slate-900 dark:text-white">{(t.habits as any)[currentHabit].title}</h3>
               <p className="text-xl font-bold text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                 {(t.habits as any)[currentHabit].desc}
               </p>
             </div>
          </div>

          <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-12 flex flex-col items-center justify-center gap-8 shadow-2xl text-white">
            <h4 className="text-xl font-black tracking-widest uppercase opacity-60">{t.timeRemaining}</h4>
            <div className="text-[8rem] font-black tracking-tighter tabular-nums leading-none">
              {formatTime(timeLeft)}
            </div>
            <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden">
               <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${(timeLeft / 600) * 100}%` }} />
            </div>
            {timeLeft === 0 && (
              <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 animate-in zoom-in">
                <CheckCircle size={24} />
                {t.habitFinished}
              </div>
            )}
          </div>
        </div>
      )}

      {!currentHabit && (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-700 p-20 flex flex-col items-center justify-center text-center gap-6">
          <div className="p-8 bg-white dark:bg-slate-800 rounded-full shadow-lg">
             <Zap size={64} className="text-blue-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-slate-400 max-w-sm">{t.descriptions.randomHabits}</p>
        </div>
      )}
    </div>
  );
};

export default MicroHabits;