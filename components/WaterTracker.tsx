
import React, { useEffect, useState } from 'react';
import { UserPreferences } from '../types';
import { translations } from '../i18n';
// Added Droplets to the imported icons from lucide-react
import { Plus, Minus, Bell, BellOff, Edit2, RotateCcw, Check, Droplets } from 'lucide-react';

// Declare confetti with proper typing
declare const confetti: any;

interface WaterTrackerProps {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ prefs, setPrefs }) => {
  const t = translations[prefs.language];
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('250');
  
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(prefs.waterGoal.toString());
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [reminderInterval, setReminderInterval] = useState<number | null>(null);
  const [waterSchedule, setWaterSchedule] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('water_schedule');
      return stored ? JSON.parse(stored) : ['05:00', '09:00', '12:00', '17:00', '21:00'];
    } catch {
      return ['05:00', '09:00', '12:00', '17:00', '21:00'];
    }
  });
  const [scheduleNotificationsEnabled, setScheduleNotificationsEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsAllowed(Notification.permission === 'granted');
    }
  }, []);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (reminderInterval) {
        clearInterval(reminderInterval);
      }
    };
  }, [reminderInterval]);

  // Check for scheduled water reminders
  useEffect(() => {
    if (!scheduleNotificationsEnabled) return;

    const checkSchedule = setInterval(() => {
      try {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        for (const scheduledTime of waterSchedule) {
          // Check if it's time for this reminder (within 5-minute window)
          const [schedHours, schedMinutes] = scheduledTime.split(':').map(Number);
          const schedDate = new Date();
          schedDate.setHours(schedHours, schedMinutes, 0, 0);
          
          const timeDiff = Math.abs(now.getTime() - schedDate.getTime());
          const isTimeToNotify = timeDiff < 5 * 60 * 1000; // 5 minute window
          
          if (isTimeToNotify) {
            // Check if we already sent notification for this time today
            const notificationKey = `water_notif_${scheduledTime}_${new Date().toDateString()}`;
            const alreadyNotified = localStorage.getItem(notificationKey);
            
            if (!alreadyNotified) {
              const amountPerSession = Math.round((prefs.waterGoal * 1000) / waterSchedule.length);
              
              if (Notification.permission === 'granted') {
                new Notification('💧 Time to Drink Water!', {
                  body: `It's ${scheduledTime}. Drink ${amountPerSession}ml to reach your daily goal of ${Math.round(prefs.waterGoal * 1000)}ml.`,
                  icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
                  requireInteraction: true,
                  tag: `water_${scheduledTime}` // Prevent duplicates
                });
              }
              
              // Mark this notification as sent
              localStorage.setItem(notificationKey, 'true');
              
              // Show in-app alert too
              alert(`⏰ Time to drink ${amountPerSession}ml of water!`);
            }
          }
        }
      } catch (error) {
        console.error('Error checking water schedule:', error);
      }
    }, 30000); // Check every 30 seconds instead of 1 minute

    return () => clearInterval(checkSchedule);
  }, [scheduleNotificationsEnabled, waterSchedule, prefs.waterGoal]);

  const handleScheduleChange = (index: number, newTime: string) => {
    const updatedSchedule = [...waterSchedule];
    updatedSchedule[index] = newTime;
    setWaterSchedule(updatedSchedule);
    localStorage.setItem('water_schedule', JSON.stringify(updatedSchedule));
  };

  const enableScheduleNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setScheduleNotificationsEnabled(true);
        new Notification('Schedule Enabled ✅', {
          body: 'You will receive water reminders at your scheduled times.',
          icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'
        });
      } else {
        alert('Please enable notifications to use scheduled reminders.');
      }
    }
  };

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsAllowed(permission === 'granted');
      
      if (permission === 'granted') {
        // Show confirmation notification
        new Notification('Notifications Enabled', {
          body: 'You will receive hydration reminders every 2 hours.',
          icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'
        });
        
        // Set up periodic reminders (every 2 hours)
        const interval = window.setInterval(() => {
          const goalMl = prefs.waterGoal * 1000;
          if (prefs.waterIntake < goalMl) {
            new Notification('Hydration Reminder 💧', {
              body: `You've had ${prefs.waterIntake}ml today. Goal: ${goalMl}ml. Time for a water break!`,
              icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'
            });
          }
        }, 2 * 60 * 60 * 1000); // 2 hours
        
        setReminderInterval(interval);
      }
    }
  };

  const updateIntake = (amount: number) => {
    const newVal = Math.max(0, prefs.waterIntake + amount);
    const goalMl = prefs.waterGoal * 1000;

    if (newVal >= goalMl && prefs.waterIntake < goalMl) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#60a5fa', '#ffffff']
      });
      if (notificationsAllowed && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Goal Reached! 🎉', {
          body: t.waterCelebration,
          icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'
        });
      }
    }
    setPrefs(prev => ({ ...prev, waterIntake: newVal, lastActivityDate: new Date().toDateString() }));
    setIsPromptOpen(false);
  };

  const resetWater = () => {
    setPrefs(prev => ({ ...prev, waterIntake: 0 }));
    setIsConfirmingReset(false);
  };

  const handleSaveGoal = () => {
    if (tempGoal && !isNaN(Number(tempGoal))) {
      setPrefs(p => ({ ...p, waterGoal: Number(tempGoal) }));
      setIsEditingGoal(false);
    }
  };

  const percentage = Math.min(100, (prefs.waterIntake / (prefs.waterGoal * 1000)) * 100);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{t.waterTracker}</h2>
          <p className="text-slate-500 font-bold">Track your daily hydration levels.</p>
          <div className="mt-2 flex items-center gap-3">
            {isEditingGoal ? (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="w-28 bg-slate-50 dark:bg-slate-900 rounded-[1rem] px-3 py-2 font-black text-lg text-blue-500 outline-none border-2 border-blue-500/10"
                />
                <button onClick={handleSaveGoal} className="px-4 py-2 bg-emerald-500 text-white rounded-2xl font-black">Save</button>
                <button onClick={() => { setIsEditingGoal(false); setTempGoal(prefs.waterGoal.toString()); }} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-2xl">Cancel</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">Hydration Goal: <span className="font-black text-slate-900 dark:text-white">{prefs.waterGoal} {t.liters}</span></p>
                <button onClick={() => setIsEditingGoal(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 hover:bg-slate-200">
                  <Edit2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={requestNotifications}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black transition-all ${notificationsAllowed ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'}`}
          >
            {notificationsAllowed ? <Bell size={20} /> : <BellOff size={20} />}
            <span className="text-sm uppercase tracking-widest">{notificationsAllowed ? 'Active' : 'Muted'}</span>
          </button>
          <button 
            onClick={() => setIsConfirmingReset(true)}
            className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10`}
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 items-start">
        {/* Large Water Intake Display */}
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] p-12 flex flex-col items-center justify-center border border-slate-700 shadow-2xl min-h-[450px]">
          <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-[3rem] border-[12px] border-slate-700 shadow-inner overflow-hidden bg-slate-900 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="text-8xl font-black tracking-tighter tabular-nums text-white">{prefs.waterIntake}</span>
              <span className="text-sm font-black uppercase tracking-[0.2em] mt-4 text-slate-400">ML</span>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 w-full">
            <button 
              onClick={() => updateIntake(-250)}
              className="w-16 h-16 rounded-[1.5rem] bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all active:scale-90 text-slate-300 hover:text-white"
            >
              <Minus size={28} />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black tabular-nums text-blue-400">{percentage.toFixed(0)}%</span>
            </div>

            <button 
              onClick={() => setIsPromptOpen(true)}
              className="w-16 h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 active:scale-90 transition-all"
            >
              <Plus size={28} />
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden group min-h-[280px] flex flex-col justify-center">
            <Droplets className="absolute -bottom-8 -right-8 w-48 h-48 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-6">Did you know?</h3>
              <p className="text-xl font-bold opacity-90 leading-relaxed">
                Drinking water can increase your brain power by 14%, helping you focus better and stay sharp.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 rounded-[3rem] shadow-xl border border-slate-700 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-white">Hydration Goal</h3>
              {!isEditingGoal && (
                <button onClick={() => setIsEditingGoal(true)} className="p-3 bg-slate-700 rounded-2xl text-slate-400 hover:text-blue-400 transition-colors">
                  <Edit2 size={20} />
                </button>
              )}
            </div>
            
            <div className="relative">
              {isEditingGoal ? (
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="flex-1 bg-slate-700 rounded-[2rem] px-6 py-3 font-black text-2xl text-blue-400 outline-none border-4 border-blue-500/20"
                    autoFocus
                  />
                  <button onClick={handleSaveGoal} className="p-6 bg-emerald-500 text-white rounded-[2rem] shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"><Check size={32} /></button>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-4xl font-black leading-none text-blue-400 tabular-nums">{prefs.waterGoal}</span>
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 ml-4">{t.liters} / DAY</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 rounded-[3rem] shadow-xl border border-indigo-700 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-white">Drink Schedule 🕐</h3>
              <button 
                onClick={enableScheduleNotifications}
                className={`px-4 py-2 rounded-2xl font-black text-sm transition-all ${scheduleNotificationsEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {scheduleNotificationsEnabled ? '✅ Active' : 'Enable'}
              </button>
            </div>
            
            <div className="space-y-3">
              {waterSchedule.map((time, index) => {
                const amountPerSession = Math.round((prefs.waterGoal * 1000) / waterSchedule.length);
                return (
                  <div key={index} className="flex items-center gap-3 bg-slate-800 p-4 rounded-2xl">
                    <input 
                      type="time"
                      value={time}
                      onChange={(e) => handleScheduleChange(index, e.target.value)}
                      className="flex-1 bg-slate-700 text-white font-black rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-300 whitespace-nowrap">{amountPerSession}ml</span>
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-slate-400 mt-6 font-bold">
              You'll receive notifications at each scheduled time to drink {Math.round((prefs.waterGoal * 1000) / waterSchedule.length)}ml of water.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modals (Portals would be better but keeping minimal) */}
      {isConfirmingReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[3.5rem] w-full max-w-sm text-center shadow-2xl scale-in-center border border-slate-100 dark:border-slate-700">
            <h4 className="text-3xl font-black mb-8 text-slate-900 dark:text-white leading-tight">{t.resetWater}?</h4>
            <div className="flex flex-col gap-4">
              <button onClick={resetWater} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-rose-500/20">Reset Today</button>
              <button onClick={() => setIsConfirmingReset(false)} className="w-full py-5 bg-slate-100 dark:bg-slate-700 rounded-[2rem] font-black text-slate-600 dark:text-slate-300">Keep Data</button>
            </div>
          </div>
        </div>
      )}

      {isPromptOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 p-10 rounded-t-[3.5rem] md:rounded-[4rem] shadow-2xl w-full max-w-xl border-t md:border border-slate-100 dark:border-slate-700">
            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-10 md:hidden" />
            <h3 className="text-4xl font-black mb-10 text-center text-slate-900 dark:text-white">{t.howMuchDrink}</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {[100, 250, 500, 750].map(amt => (
                <button 
                  key={amt} 
                  onClick={() => updateIntake(amt)} 
                  className="py-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-black text-xl hover:bg-blue-600 hover:text-white transition-all text-slate-900 dark:text-white border-2 border-transparent hover:border-blue-500"
                >
                  +{amt}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-10">
              <input 
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 px-8 py-6 rounded-[2rem] outline-none font-black text-3xl text-center md:text-left text-slate-900 dark:text-white border-4 border-transparent focus:border-blue-500 transition-all"
                placeholder="0"
              />
              <button 
                onClick={() => updateIntake(Number(customAmount))} 
                className="px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
              >
                Add Custom
              </button>
            </div>
            <button onClick={() => setIsPromptOpen(false)} className="w-full py-4 font-black uppercase text-xs tracking-[0.4em] text-slate-300 hover:text-slate-500 transition-colors">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterTracker;
