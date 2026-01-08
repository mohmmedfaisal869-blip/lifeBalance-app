import React, { useState, useMemo } from 'react';
import { UserPreferences, SleepHistoryEntry } from '../types';
import { translations } from '../i18n';
import { Clock, Moon, Sun, Calendar, CheckCircle2, Bell, Sparkles, TrendingUp, X, Lightbulb, Coffee } from 'lucide-react';

interface SleepOptimizerProps {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const SleepOptimizer: React.FC<SleepOptimizerProps> = ({ prefs, setPrefs }) => {
  const t = translations[prefs.language];
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'weekday' | 'weekend'>('weekday');

  const calculateBedtimes = (wakeupTime: string) => {
    const [hours, minutes] = wakeupTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    const cycles = [6, 5, 4]; 
    return cycles.map(cycle => {
      const sleepDate = new Date(date.getTime() - (cycle * 90 + 15) * 60 * 1000);
      return {
        time: sleepDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        display: sleepDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        duration: cycle * 1.5,
        cycles: cycle
      };
    });
  };

  const bedtimeOptions = useMemo(() => {
    const time = activeMode === 'weekday' ? prefs.wakeupTime : prefs.weekendWakeupTime;
    return calculateBedtimes(time);
  }, [activeMode, prefs.wakeupTime, prefs.weekendWakeupTime]);

  const addSleepCheckin = (quality: SleepHistoryEntry['quality']) => {
    const today = new Date().toDateString();
    setPrefs(prev => {
      const history = [...prev.sleepHistory];
      const existing = history.findIndex(h => h.date === today);
      if (existing !== -1) {
        history[existing] = { date: today, quality };
      } else {
        history.push({ date: today, quality });
      }
      return { ...prev, sleepHistory: history, lastActivityDate: today };
    });
    setFeedback(t.morningAdvice[quality]);
  };

  const handleSetReminder = (time: string) => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          alert(`${t.alarmSet} ${time}`);
        }
      });
    }
  };

  const weeklyHistory = useMemo(() => {
    const last7 = prefs.sleepHistory.slice(-7);
    const scores = { good: 3, average: 2, poor: 1 };
    return last7.map(h => ({
      date: h.date.split(' ')[0],
      score: scores[h.quality]
    }));
  }, [prefs.sleepHistory]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black mb-1 tracking-tight text-slate-900 dark:text-white">{t.sleepOptimizer}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">{t.sleepCyclesDesc}</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shadow-inner">
           <button 
             onClick={() => setActiveMode('weekday')}
             className={`px-6 py-2 rounded-xl font-bold transition-all ${activeMode === 'weekday' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
           >
             {t.wakeupTime}
           </button>
           <button 
             onClick={() => setActiveMode('weekend')}
             className={`px-6 py-2 rounded-xl font-bold transition-all ${activeMode === 'weekend' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
           >
             {t.weekendWakeup}
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="font-black text-xl flex items-center gap-2 text-slate-900 dark:text-white">
              {activeMode === 'weekday' ? <Sun size={24} className="text-orange-500" /> : <Coffee size={24} className="text-sky-500" />}
              {activeMode === 'weekday' ? t.wakeupTime : t.weekendWakeup}
            </h3>
            <input 
              type="time"
              value={activeMode === 'weekday' ? prefs.wakeupTime : prefs.weekendWakeupTime}
              onChange={(e) => {
                const val = e.target.value;
                setPrefs(prev => activeMode === 'weekday' ? ({ ...prev, wakeupTime: val }) : ({ ...prev, weekendWakeupTime: val }));
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] text-5xl font-black outline-none border-2 border-slate-200 dark:border-slate-700 text-center tabular-nums focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-6">
            <h3 className="font-black text-xl flex items-center gap-2 text-slate-900 dark:text-white"><TrendingUp size={24} className="text-indigo-500" />{t.weeklyTrend}</h3>
            <div className="h-32 flex items-end gap-3 px-6 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-6">
              {weeklyHistory.length === 0 ? (
                <div className="w-full text-center text-slate-300 text-sm font-bold h-full flex items-center justify-center italic">No data yet</div>
              ) : (
                weeklyHistory.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className={`w-full rounded-t-xl transition-all duration-1000 shadow-lg ${h.score === 3 ? 'bg-indigo-500' : h.score === 2 ? 'bg-indigo-300' : 'bg-rose-400'}`} style={{ height: `${(h.score/3)*100}%` }} />
                    <span className="text-[10px] font-black opacity-40 text-slate-400">{h.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black px-2 flex items-center gap-3 text-slate-900 dark:text-white"><Moon className="text-indigo-500" />{t.suggestedBedtimes}</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {bedtimeOptions.map((bt, i) => (
            <div key={i} className="group bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl hover:-translate-y-2 transition-all relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">{bt.duration} {t.hours}</span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mt-1">
                    <Sparkles size={12}/> {bt.cycles} {t.cycles}
                  </div>
                </div>
                <button 
                  onClick={() => handleSetReminder(bt.time)}
                  className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <Bell size={20} />
                </button>
              </div>
              <div className="text-5xl font-black mb-2 tabular-nums tracking-tighter text-slate-900 dark:text-white">{bt.display}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-black text-white rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <h3 className="text-3xl font-black mb-8 flex items-center gap-4"><CheckCircle2 size={36} className="text-emerald-400" />{t.dailyCheckin}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {['good', 'average', 'poor'].map((q) => {
              const quality = q as any;
              const isSelected = prefs.sleepHistory.some(h => h.date === new Date().toDateString() && h.quality === quality);
              return (
                <button
                  key={quality}
                  onClick={() => addSleepCheckin(quality)}
                  className={`flex flex-col items-center gap-5 p-10 rounded-[2.5rem] transition-all border-4 ${isSelected ? 'bg-white text-black border-white scale-105 shadow-2xl' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}
                >
                  <span className={`text-6xl transition-transform ${isSelected ? 'scale-110' : ''}`}>{quality === 'good' ? '😊' : quality === 'average' ? '😐' : '😴'}</span>
                  <span className="text-xl font-black uppercase tracking-widest">{t[quality]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advice Modal */}
      {feedback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-[3rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-700 scale-in-center">
            <div className="flex justify-between items-start mb-8">
               <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-3xl">
                  <Lightbulb size={32} className="text-indigo-600 dark:text-indigo-400" />
               </div>
               <button onClick={() => setFeedback(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400">
                 <X size={24} />
               </button>
            </div>
            <h4 className="text-3xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">Morning Advice</h4>
            <p className="text-xl font-bold text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              {feedback}
            </p>
            <button 
              onClick={() => setFeedback(null)}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30"
            >
              Okay, Thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SleepOptimizer;