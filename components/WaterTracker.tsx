
import React, { useEffect, useState } from 'react';
import { UserPreferences } from '../types';
import { translations } from '../i18n';
// Added Droplets to the imported icons from lucide-react
import { Plus, Minus, Bell, BellOff, Edit2, RotateCcw, Check, Droplets } from 'lucide-react';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';

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

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsAllowed(Notification.permission === 'granted');
    }
  }, []);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsAllowed(permission === 'granted');
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
      if (notificationsAllowed) {
        new Notification(t.waterCelebration);
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

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="relative bg-white dark:bg-slate-800 rounded-[4rem] p-12 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden min-h-[500px]">
          <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-[5rem] border-[16px] border-slate-50 dark:border-slate-900 shadow-inner overflow-hidden bg-slate-50 dark:bg-slate-900">
             <div className="absolute inset-0 transition-all duration-1000 ease-in-out origin-bottom" style={{ transform: `scaleY(${percentage / 100})` }}>
                <div className="absolute inset-0 bg-blue-500 opacity-20" />
                <svg className="absolute top-0 left-0 w-[200%] h-16 -translate-y-1/2 animate-wave fill-blue-500" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0 10 Q 25 20 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-t from-blue-700 to-blue-400" />
             </div>

             <div className="absolute inset-0 flex flex-col items-center justify-center mix-blend-difference invert dark:invert-0">
               <div className="flex flex-col items-center">
                  <span className="text-7xl font-black tracking-tighter tabular-nums leading-none">{prefs.waterIntake}</span>
                  <span className="text-xs font-black uppercase tracking-[0.3em] mt-2 opacity-50">{t.ml}</span>
               </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-between w-full max-w-md">
            <button 
              onClick={() => updateIntake(-250)}
              className="w-20 h-20 rounded-[2rem] bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-md"
            >
              <Minus size={32} />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white leading-none">{percentage.toFixed(0)}%</span>
              <span className="text-xs font-black uppercase tracking-widest mt-2 opacity-30">{t.waterGoal}</span>
            </div>

            <button 
              onClick={() => setIsPromptOpen(true)}
              className="w-20 h-20 rounded-[2rem] bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-90 transition-all"
            >
              <Plus size={32} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">

          <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden group">
            <Droplets className="absolute -bottom-8 -right-8 w-48 h-48 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-4">Did you know?</h3>
              <p className="text-xl font-bold opacity-90 leading-relaxed">
                Drinking water can increase your brain power by 14%, helping you focus better and stay sharp.
              </p>
            </div>
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
