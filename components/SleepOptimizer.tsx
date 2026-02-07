import React, { useState, useMemo, useEffect } from 'react';
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
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [reminderAlert, setReminderAlert] = useState<{ time: string; bedtime: string } | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsAllowed(Notification.permission === 'granted');
    }
  }, []);

  // Check for upcoming reminders every minute
  useEffect(() => {
    const checkReminders = setInterval(() => {
      try {
        const reminders = JSON.parse(localStorage.getItem('sleep_reminders') || '[]');
        const now = new Date();
        
        for (const reminder of reminders) {
          const reminderTime = new Date(reminder.time);
          const timeDiff = reminderTime.getTime() - now.getTime();
          
          // If within 2 minutes of reminder, show alert
          if (timeDiff > 0 && timeDiff < 2 * 60 * 1000) {
            setReminderAlert({ time: reminder.bedtime, bedtime: reminder.display });
            
            // Show browser notification
            if (Notification.permission === 'granted') {
              new Notification('Sleep Time! 🌙', {
                body: `It's ${reminder.bedtime} - Time to prepare for bed`,
                icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
                requireInteraction: true
              });
            }
            
            // Play sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==');
            audio.play().catch(e => console.log('Audio play failed:', e));
            
            // Remove from reminders
            const updatedReminders = reminders.filter((r: any) => r.time !== reminder.time);
            localStorage.setItem('sleep_reminders', JSON.stringify(updatedReminders));
          }
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkReminders);
  }, []);

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

  const handleSetReminder = async (time: string, display: string) => {
    try {
      if (!('Notification' in window)) {
        alert('Notifications are not supported in your browser.');
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationsAllowed(permission === 'granted');
      
      // Calculate bedtime
      const [hours, minutes] = time.split(':').map(Number);
      const bedtime = new Date();
      bedtime.setHours(hours, minutes, 0, 0);
      
      // If bedtime is in the past today, set for tomorrow
      const now = new Date();
      if (bedtime <= now) {
        bedtime.setDate(bedtime.getDate() + 1);
      }
      
      // Store reminder in localStorage
      try {
        const reminders = JSON.parse(localStorage.getItem('sleep_reminders') || '[]');
        reminders.push({
          time: bedtime.toISOString(),
          bedtime: time,
          display: display
        });
        localStorage.setItem('sleep_reminders', JSON.stringify(reminders));
      } catch (error) {
        console.error('Error saving reminder:', error);
      }
      
      const minutesUntil = Math.floor((bedtime.getTime() - now.getTime()) / 1000 / 60);
      alert(`✅ Sleep reminder set for ${time}!\n\nYou'll get a notification in ${minutesUntil} minutes.`);
    } catch (error) {
      console.error('Error setting reminder:', error);
      alert('Error setting reminder. Please try again.');
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-12">
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
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-6 relative h-40">
              {weeklyHistory.length === 0 ? (
                <div className="w-full text-center text-slate-300 text-sm font-bold h-full flex items-center justify-center italic">No data yet</div>
              ) : (
                <>
                  <svg className="w-full h-full absolute inset-0" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" opacity="0.3" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" opacity="0.3" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" opacity="0.3" />
                    {/* Trend line */}
                    <polyline
                      points={weeklyHistory.map((h, i) => `${(i / (weeklyHistory.length - 1 || 1)) * 500},${180 - (h.score / 3) * 150}`).join(' ')}
                      fill="none"
                      stroke="url(#trendGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Gradient */}
                    <defs>
                      <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* Data points */}
                    {weeklyHistory.map((h, i) => {
                      const x = (i / (weeklyHistory.length - 1 || 1)) * 500;
                      const y = 180 - (h.score / 3) * 150;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" fill={h.score === 3 ? '#10b981' : h.score === 2 ? '#f59e0b' : '#ef4444'} opacity="0.8" />
                          <circle cx={x} cy={y} r="8" fill="none" stroke={h.score === 3 ? '#10b981' : h.score === 2 ? '#f59e0b' : '#ef4444'} strokeWidth="2" opacity="0.3" />
                        </g>
                      );
                    })}
                  </svg>
                  {weeklyHistory.length > 0 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-between text-[10px] font-black text-slate-400 px-6 z-10">
                      {weeklyHistory.map((h, i) => (
                        <span key={i}>{h.date}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black px-2 flex items-center gap-3 text-slate-900 dark:text-white"><Moon className="text-indigo-500" />{t.suggestedBedtimes}</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {bedtimeOptions.map((bt, i) => (
            <div key={i} className="group bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl hover:-translate-y-2 transition-all relative">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">{bt.duration} {t.hours}</span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mt-1">
                    <Sparkles size={12}/> {bt.cycles} {t.cycles}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSetReminder(bt.time, bt.display);
                  }}
                  type="button"
                  className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm cursor-pointer active:scale-95 flex-shrink-0 z-20 relative"
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

      {reminderAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md shadow-2xl animate-bounce">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">🌙 Time to Sleep!</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">It's {reminderAlert.time} - Time to prepare for bed and get a good night's rest.</p>
            <button 
              onClick={() => setReminderAlert(null)}
              className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all"
            >
              Got it! Going to sleep now 😴
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SleepOptimizer;