import React, { useMemo, useRef } from 'react';
import { UserPreferences, TaskStatus, SleepHistoryEntry } from '../types';
import { translations } from '../i18n';
import { TrendingUp, Droplets, Moon, CheckCircle2, Heart, Calendar, Download, Award, Flame, Target, Zap } from 'lucide-react';

interface StatisticsProps {
  prefs: UserPreferences;
  setActiveTab: (tab: any) => void;
}

const Statistics: React.FC<StatisticsProps> = ({ prefs, setActiveTab }) => {
  const t = translations[prefs.language];
  const statsContainerRef = useRef<HTMLDivElement>(null);

  // Calculate weekly water intake average
  const weeklyWaterStats = useMemo(() => {
    // Since we only track current day, simulate with current intake
    const todayMl = prefs.waterIntake;
    const goalMl = prefs.waterGoal * 1000;
    const avgCompletion = (todayMl / goalMl) * 100;
    return {
      average: todayMl,
      completion: avgCompletion,
      goal: goalMl,
      daysMet: prefs.streak > 0 ? 1 : 0
    };
  }, [prefs.waterIntake, prefs.waterGoal, prefs.streak]);

  // Calculate sleep quality stats
  const sleepStats = useMemo(() => {
    const recent = prefs.sleepHistory.slice(-7);
    if (recent.length === 0) return null;
    
    const qualityCount = { good: 0, average: 0, poor: 0 };
    recent.forEach(entry => {
      qualityCount[entry.quality as keyof typeof qualityCount]++;
    });
    
    const avgScore = (qualityCount.good * 3 + qualityCount.average * 2 + qualityCount.poor * 1) / recent.length;
    
    return {
      total: recent.length,
      average: avgScore,
      quality: avgScore >= 2.5 ? 'good' : avgScore >= 1.5 ? 'average' : 'poor',
      distribution: qualityCount
    };
  }, [prefs.sleepHistory]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const total = prefs.tasks.length;
    const done = prefs.tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgress = prefs.tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const todo = prefs.tasks.filter(t => t.status === TaskStatus.TODO).length;
    const archived = prefs.archivedTasks.length;
    
    const completionRate = total > 0 ? (done / total) * 100 : 0;
    
    return { total, done, inProgress, todo, archived, completionRate };
  }, [prefs.tasks, prefs.archivedTasks]);

  // Calculate achievements
  const achievements = useMemo(() => {
    const achieved: Array<{ id: string; name: string; icon: any; unlocked: boolean; progress?: number; rank: 'Easy' | 'Medium' | 'Hard' }> = [];
    
    // Streak achievements
    if (prefs.streak >= 7) achieved.push({ id: 'streak_7', name: t.achievements.names.dayWarrior7, icon: Flame, unlocked: true, rank: 'Easy' });
    else achieved.push({ id: 'streak_7', name: t.achievements.names.dayWarrior7, icon: Flame, unlocked: false, progress: (prefs.streak / 7) * 100, rank: 'Easy' });
    
    if (prefs.streak >= 30) achieved.push({ id: 'streak_30', name: t.achievements.names.monthlyChampion, icon: Award, unlocked: true, rank: 'Medium' });
    else achieved.push({ id: 'streak_30', name: t.achievements.names.monthlyChampion, icon: Award, unlocked: false, progress: (prefs.streak / 30) * 100, rank: 'Medium' });
    
    if (prefs.streak >= 100) achieved.push({ id: 'streak_100', name: t.achievements.names.dayLegend100, icon: Flame, unlocked: true, rank: 'Hard' });
    else achieved.push({ id: 'streak_100', name: t.achievements.names.dayLegend100, icon: Flame, unlocked: false, progress: (prefs.streak / 100) * 100, rank: 'Hard' });
    
    // Water achievements
    if (prefs.waterIntake >= prefs.waterGoal * 1000) {
      achieved.push({ id: 'water_daily', name: t.achievements.names.hydrationHero, icon: Droplets, unlocked: true, rank: 'Easy' });
    } else {
      achieved.push({ id: 'water_daily', name: t.achievements.names.hydrationHero, icon: Droplets, unlocked: false, progress: (prefs.waterIntake / (prefs.waterGoal * 1000)) * 100, rank: 'Easy' });
    }
    
    // Task achievements
    if (taskStats.done >= 10) achieved.push({ id: 'tasks_10', name: t.achievements.names.taskMaster, icon: CheckCircle2, unlocked: true, rank: 'Easy' });
    else achieved.push({ id: 'tasks_10', name: t.achievements.names.taskMaster, icon: CheckCircle2, unlocked: false, progress: (taskStats.done / 10) * 100, rank: 'Easy' });
    
    if (taskStats.done >= 50) achieved.push({ id: 'tasks_50', name: t.achievements.names.taskTerminator, icon: CheckCircle2, unlocked: true, rank: 'Medium' });
    else achieved.push({ id: 'tasks_50', name: t.achievements.names.taskTerminator, icon: CheckCircle2, unlocked: false, progress: (taskStats.done / 50) * 100, rank: 'Medium' });
    
    if (taskStats.done >= 100) achieved.push({ id: 'tasks_100', name: t.achievements.names.productivityPro, icon: Target, unlocked: true, rank: 'Hard' });
    else achieved.push({ id: 'tasks_100', name: t.achievements.names.productivityPro, icon: Target, unlocked: false, progress: (taskStats.done / 100) * 100, rank: 'Hard' });
    
    // Gratitude achievements
    if (prefs.gratitudeNotes.length >= 5) achieved.push({ id: 'gratitude_5', name: t.achievements.names.gratefulHeart, icon: Heart, unlocked: true, rank: 'Easy' });
    else achieved.push({ id: 'gratitude_5', name: t.achievements.names.gratefulHeart, icon: Heart, unlocked: false, progress: (prefs.gratitudeNotes.length / 5) * 100, rank: 'Easy' });
    
    if (prefs.gratitudeNotes.length >= 10) achieved.push({ id: 'gratitude_10', name: t.achievements.names.gratitudeGuru, icon: Heart, unlocked: true, rank: 'Medium' });
    else achieved.push({ id: 'gratitude_10', name: t.achievements.names.gratitudeGuru, icon: Heart, unlocked: false, progress: (prefs.gratitudeNotes.length / 10) * 100, rank: 'Medium' });
    
    if (prefs.gratitudeNotes.length >= 30) achieved.push({ id: 'gratitude_30', name: t.achievements.names.blessedSoul, icon: Heart, unlocked: true, rank: 'Hard' });
    else achieved.push({ id: 'gratitude_30', name: t.achievements.names.blessedSoul, icon: Heart, unlocked: false, progress: (prefs.gratitudeNotes.length / 30) * 100, rank: 'Hard' });
    
    // Sleep achievements
    if (sleepStats && sleepStats.average >= 2.5) {
      achieved.push({ id: 'sleep_quality', name: t.achievements.names.sleepSage, icon: Moon, unlocked: true, rank: 'Easy' });
    } else if (sleepStats) {
      achieved.push({ id: 'sleep_quality', name: t.achievements.names.sleepSage, icon: Moon, unlocked: false, progress: (sleepStats.average / 2.5) * 100, rank: 'Easy' });
    }
    
    if (sleepStats && sleepStats.distribution.good >= 5) {
      achieved.push({ id: 'sleep_perfect', name: t.achievements.names.dreamMaster, icon: Moon, unlocked: true, rank: 'Medium' });
    } else if (sleepStats) {
      achieved.push({ id: 'sleep_perfect', name: t.achievements.names.dreamMaster, icon: Moon, unlocked: false, progress: (sleepStats.distribution.good / 5) * 100, rank: 'Medium' });
    }
    
    // Micro-habits achievements
    if (prefs.tasks && prefs.tasks.length > 0) {
      const completedHabits = prefs.tasks.filter(t => t.status === TaskStatus.DONE && t.priority === 'low').length;
      if (completedHabits >= 20) achieved.push({ id: 'habits_20', name: t.achievements.names.wellnessWarrior, icon: Zap, unlocked: true, rank: 'Medium' });
      else achieved.push({ id: 'habits_20', name: t.achievements.names.wellnessWarrior, icon: Zap, unlocked: false, progress: (completedHabits / 20) * 100, rank: 'Medium' });
    }
    
    // All-rounder achievement (balanced tracking)
    const metricsTracked = (
      (prefs.waterIntake > 0 ? 1 : 0) +
      (prefs.sleepHistory.length > 0 ? 1 : 0) +
      (prefs.tasks.length > 0 ? 1 : 0) +
      (prefs.gratitudeNotes.length > 0 ? 1 : 0)
    );
    
    if (metricsTracked === 4) {
      achieved.push({ id: 'all_rounder', name: t.achievements.names.balancedLife, icon: Calendar, unlocked: true, rank: 'Medium' });
    } else {
      achieved.push({ id: 'all_rounder', name: t.achievements.names.balancedLife, icon: Calendar, unlocked: false, progress: (metricsTracked / 4) * 100, rank: 'Medium' });
    }
    
    return achieved;
  }, [prefs, taskStats, sleepStats]);

  // Export statistics as screenshot
  const exportData = async () => {
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      if (statsContainerRef.current) {
        const canvas = await html2canvas(statsContainerRef.current, {
          backgroundColor: prefs.theme === 'dark' ? '#0f172a' : '#f8fafc',
          scale: 2,
          logging: false,
          allowTaint: true,
          useCORS: true
        });
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `lifebalance-statistics-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to export statistics:', error);
      alert('Unable to export statistics. Please try again.');
    }
  };

  // Simple bar chart component
  const BarChart = ({ data, labels, color }: { data: number[]; labels: string[]; color: string }) => {
    const max = Math.max(...data, 1);
    return (
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="relative w-full h-full flex items-end">
              <div
                className={`w-full rounded-t-lg transition-all duration-1000 ${color}`}
                style={{ height: `${(value / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{labels[i]}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <TrendingUp className="text-blue-500" size={40} />
            {t.headers.statistics}
          </h2>
          <p className="text-slate-500 font-bold mt-2">{t.descriptions.trackProgress}</p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
        >
          <Download size={20} />
          {t.buttons.exportData}
        </button>
      </div>

      <div ref={statsContainerRef} className="space-y-8 bg-white dark:bg-slate-900/50 rounded-3xl p-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('water')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl text-white shadow-xl hover:scale-105 transition-transform"
        >
          <Droplets size={32} className="mb-3" />
          <div className="text-3xl font-black tabular-nums">{weeklyWaterStats.completion.toFixed(0)}%</div>
          <div className="text-xs font-black uppercase tracking-widest opacity-80 mt-1">{t.headers.waterGoalLabel}</div>
        </button>

        <button
          onClick={() => setActiveTab('sleep')}
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-3xl text-white shadow-xl hover:scale-105 transition-transform"
        >
          <Moon size={32} className="mb-3" />
          <div className="text-3xl font-black tabular-nums">
            {sleepStats ? sleepStats.average.toFixed(1) : '--'}
          </div>
          <div className="text-xs font-black uppercase tracking-widest opacity-80 mt-1">{t.headers.sleepScore}</div>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl text-white shadow-xl hover:scale-105 transition-transform"
        >
          <CheckCircle2 size={32} className="mb-3" />
          <div className="text-3xl font-black tabular-nums">{taskStats.completionRate.toFixed(0)}%</div>
          <div className="text-xs font-black uppercase tracking-widest opacity-80 mt-1">{t.headers.tasksDone}</div>
        </button>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-3xl text-white shadow-xl">
          <Heart size={32} className="mb-3" />
          <div className="text-3xl font-black tabular-nums">{prefs.gratitudeNotes.length}</div>
          <div className="text-xs font-black uppercase tracking-widest opacity-80 mt-1">{t.headers.gratitudeNotes}</div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Water Statistics */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
              <Droplets className="text-blue-500" size={28} />
              {t.headers.waterIntake}
            </h3>
            <button
              onClick={() => setActiveTab('water')}
              className="text-xs font-black uppercase tracking-widest text-blue-500 hover:text-blue-600"
            >
              {t.headers.viewDetails} →
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">{prefs.waterIntake}</div>
                <div className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1">{t.headers.mlToday}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-blue-500 tabular-nums">{weeklyWaterStats.completion.toFixed(0)}%</div>
                <div className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.headers.ofGoal}</div>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-1000 rounded-full"
                  style={{ width: `${Math.min(100, weeklyWaterStats.completion)}%` }}
                />
              </div>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                  {prefs.waterGoal * 1000}ml Goal
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t.headers.currentStreak}</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="text-orange-500" size={24} />
                  {prefs.streak} {t.days}
                </div>
              </div>
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t.headers.goalMetToday}</div>
                <div className={`text-2xl font-black ${weeklyWaterStats.completion >= 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {weeklyWaterStats.completion >= 100 ? `✓ ${t.buttons.yes}` : `✗ ${t.buttons.notYet}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sleep Statistics */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
              <Moon className="text-indigo-500" size={28} />
              {t.headers.sleepQuality}
            </h3>
            <button
              onClick={() => setActiveTab('sleep')}
              className="text-xs font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600"
            >
              {t.headers.viewDetails} →
            </button>
          </div>
          
          {sleepStats ? (
            <div className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">
                    {sleepStats.average.toFixed(1)}
                  </div>
                  <div className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1">
                    {t.headers.avgScoreLast7}
                  </div>
                </div>
                <div className={`text-2xl font-black capitalize ${
                  sleepStats.quality === 'good' ? 'text-emerald-500' :
                  sleepStats.quality === 'average' ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {t[sleepStats.quality]}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t.good}:</span>
                  <span className="font-black text-slate-900 dark:text-white">{sleepStats.distribution.good}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-amber-600 dark:text-amber-400">{t.average}:</span>
                  <span className="font-black text-slate-900 dark:text-white">{sleepStats.distribution.average}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-rose-600 dark:text-rose-400">{t.poor}:</span>
                  <span className="font-black text-slate-900 dark:text-white">{sleepStats.distribution.poor}</span>
                </div>
              </div>
              
              {prefs.sleepHistory.length > 0 && (
                <BarChart
                  data={[
                    sleepStats.distribution.good,
                    sleepStats.distribution.average,
                    sleepStats.distribution.poor
                  ]}
                  labels={[t.good, t.average, t.poor]}
                  color="bg-indigo-500"
                />
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Moon size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-slate-400 dark:text-slate-500">{t.descriptions.noSleepDataYet}</p>
              <button
                onClick={() => setActiveTab('sleep')}
                className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-xl font-black text-sm"
              >
                {t.buttons.startTracking} →
              </button>
            </div>
          )}
        </div>

        {/* Task Statistics */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
              <CheckCircle2 className="text-emerald-500" size={28} />
              {t.headers.taskCompletion}
            </h3>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-600"
            >
              {t.headers.viewBoard} →
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div className="text-3xl font-black text-blue-500 tabular-nums">{taskStats.todo}</div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{t.todo}</div>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div className="text-3xl font-black text-amber-500 tabular-nums">{taskStats.inProgress}</div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{t.inProgress}</div>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div className="text-3xl font-black text-emerald-500 tabular-nums">{taskStats.done}</div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{t.done}</div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.headers.completionRate}</span>
                <span className="text-xl font-black text-emerald-500 tabular-nums">{taskStats.completionRate.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-1000 rounded-full"
                  style={{ width: `${taskStats.completionRate}%` }}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.headers.totalTasks}</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{taskStats.total}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.headers.archivedSimple}</span>
                <span className="text-xl font-black text-slate-500 dark:text-slate-400 tabular-nums">{taskStats.archived}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
              <Award className="text-amber-500" size={28} />
              {t.headers.achievements}
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-xs font-black uppercase tracking-widest text-amber-500 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                {achievements.filter(a => a.unlocked).length} / {achievements.length} {t.buttons.unlocked}
              </div>
            </div>
          </div>

          {/* Category Groups */}
          <div className="space-y-6">
            {/* Streak Category */}
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                {t.achievements.categories.streakConsistency}
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {achievements.filter(a => a.id.includes('streak')).map(achievement => {
                  const Icon = achievement.icon;
                  const rankColors = {
                    Easy: 'bg-green-500/10 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300',
                    Medium: 'bg-orange-500/10 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300',
                    Hard: 'bg-red-500/10 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                  };
                  const rankBadge = {
                    Easy: 'bg-green-500 text-white',
                    Medium: 'bg-orange-500 text-white',
                    Hard: 'bg-red-500 text-white'
                  };
                  return (
                    <div
                      key={achievement.id}
                      className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all ${
                        achievement.unlocked
                          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700 shadow-md'
                          : rankColors[achievement.rank]
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-1 sm:p-1.5 rounded-lg ${
                          achievement.unlocked
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}>
                          <Icon size={14} />
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${rankBadge[achievement.rank]}`}>
                          {achievement.rank.charAt(0)}
                        </span>
                      </div>
                      <p className={`text-[11px] sm:text-xs font-black leading-tight ${
                        achievement.unlocked
                          ? 'text-amber-900 dark:text-amber-100'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {achievement.name}
                      </p>
                      {achievement.unlocked && <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-black mt-0.5 sm:mt-1 block">✓ {t.labels.unlocked}</span>}
                      {!achievement.unlocked && achievement.progress !== undefined && (
                        <div className="mt-1 sm:mt-2">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-full transition-all" style={{ width: `${Math.min(100, achievement.progress)}%` }} />
                          </div>
                          <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-black mt-0.5 sm:mt-1 block">{achievement.progress.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tasks Category */}
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                {t.achievements.categories.taskMastery}
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {achievements.filter(a => a.id.includes('tasks')).map(achievement => {
                  const Icon = achievement.icon;
                  const rankColors = {
                    Easy: 'bg-green-500/10 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300',
                    Medium: 'bg-orange-500/10 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300',
                    Hard: 'bg-red-500/10 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                  };
                  const rankBadge = {
                    Easy: 'bg-green-500 text-white',
                    Medium: 'bg-orange-500 text-white',
                    Hard: 'bg-red-500 text-white'
                  };
                  return (
                    <div
                      key={achievement.id}
                      className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all ${
                        achievement.unlocked
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-700 shadow-md'
                          : rankColors[achievement.rank]
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-1 sm:p-1.5 rounded-lg ${
                          achievement.unlocked
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}>
                          <Icon size={14} />
                        </div>
                        <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${rankBadge[achievement.rank]}`}>
                          {achievement.rank.charAt(0)}
                        </span>
                      </div>
                      <p className={`text-xs font-black leading-tight ${
                        achievement.unlocked
                          ? 'text-emerald-900 dark:text-emerald-100'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {achievement.name}
                      </p>
                      {achievement.unlocked && <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-black mt-0.5 sm:mt-1 block">✓ {t.labels.unlocked}</span>}
                      {!achievement.unlocked && achievement.progress !== undefined && (
                        <div className="mt-1 sm:mt-2">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full transition-all" style={{ width: `${Math.min(100, achievement.progress)}%` }} />
                          </div>
                          <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-black mt-0.5 sm:mt-1 block">{achievement.progress.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wellness Category */}
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Heart size={16} className="text-rose-500" />
                {t.achievements.categories.wellnessWellbeing}
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {achievements.filter(a => a.id.includes('gratitude') || a.id.includes('water') || a.id.includes('sleep') || a.id.includes('habits') || a.id.includes('all_rounder')).map(achievement => {
                  const Icon = achievement.icon;
                  const rankColors = {
                    Easy: 'bg-green-500/10 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300',
                    Medium: 'bg-orange-500/10 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300',
                    Hard: 'bg-red-500/10 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                  };
                  const rankBadge = {
                    Easy: 'bg-green-500 text-white',
                    Medium: 'bg-orange-500 text-white',
                    Hard: 'bg-red-500 text-white'
                  };
                  return (
                    <div
                      key={achievement.id}
                      className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all ${
                        achievement.unlocked
                          ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-300 dark:border-rose-700 shadow-md'
                          : rankColors[achievement.rank]
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-1 sm:p-1.5 rounded-lg ${
                          achievement.unlocked
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}>
                          <Icon size={14} />
                        </div>
                        <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${rankBadge[achievement.rank]}`}>
                          {achievement.rank.charAt(0)}
                        </span>
                      </div>
                      <p className={`text-[11px] sm:text-xs font-black leading-tight ${
                        achievement.unlocked
                          ? 'text-rose-900 dark:text-rose-100'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {achievement.name}
                      </p>
                      {achievement.unlocked && <span className="text-[9px] sm:text-[10px] text-rose-600 dark:text-rose-400 font-black mt-0.5 sm:mt-1 block">✓ {t.labels.unlocked}</span>}
                      {!achievement.unlocked && achievement.progress !== undefined && (
                        <div className="mt-1 sm:mt-2">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-full transition-all" style={{ width: `${Math.min(100, achievement.progress)}%` }} />
                          </div>
                          <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-black mt-0.5 sm:mt-1 block">{achievement.progress.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Statistics;
