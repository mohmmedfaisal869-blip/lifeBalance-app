import React, { useState } from 'react';
import { UserPreferences, Task, TaskStatus, Priority } from '../types';
import { translations } from '../i18n';
import { Plus, Trash2, History, Info, Check, Search } from 'lucide-react';

interface KanbanBoardProps {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ prefs, setPrefs }) => {
  const t = translations[prefs.language];
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [showArchive, setShowArchive] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<TaskStatus>(TaskStatus.TODO);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      priority: newTaskPriority,
      status: TaskStatus.TODO,
      createdAt: Date.now()
    };
    setPrefs(prev => ({ ...prev, tasks: [...prev.tasks, task], lastActivityDate: new Date().toDateString() }));
    setNewTaskTitle('');
    setNewTaskPriority(Priority.MEDIUM);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setPrefs(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId 
          ? { ...task, status, completedAt: status === TaskStatus.DONE ? Date.now() : task.completedAt } 
          : task
      )
    }));
  };

  const deleteTask = (id: string, isFromArchive = false) => {
    if (isFromArchive) {
      setPrefs(prev => ({ ...prev, archivedTasks: prev.archivedTasks.filter(t => t.id !== id) }));
    } else {
      setPrefs(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    }
  };

  const statuses = [
    { key: TaskStatus.TODO, label: t.todo },
    { key: TaskStatus.IN_PROGRESS, label: t.inProgress },
    { key: TaskStatus.DONE, label: t.done }
  ];

  const TaskCard = ({ task }: { task: Task }) => (
    <div 
      className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden hover:scale-[1.02] transition-all group"
    >
      <div className="absolute top-0 left-0 bottom-0 w-2.5" style={{ backgroundColor: task.priority === Priority.HIGH ? '#ef4444' : task.priority === Priority.MEDIUM ? '#3b82f6' : '#10b981' }} />
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          {statuses.map(s => (
            <button 
              key={s.key}
              onClick={() => updateTaskStatus(task.id, s.key)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${task.status === s.key ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-300 hover:text-blue-500'}`}
            >
              {task.status === s.key ? <Check size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
            </button>
          ))}
        </div>
        <button onClick={() => deleteTask(task.id)} className="text-slate-200 group-hover:text-rose-500 p-2 transition-colors"><Trash2 size={20}/></button>
      </div>
      
      <p className="font-bold text-lg text-slate-800 dark:text-white leading-tight mb-2">{task.title}</p>
      <div className="flex items-center gap-2">
         <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${task.priority === Priority.HIGH ? 'bg-rose-50 text-rose-500' : task.priority === Priority.MEDIUM ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
            {t[task.priority]}
         </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{t.tasks}</h2>
          <p className="text-slate-500 font-bold hidden md:block">Organize your flow with a modern Kanban.</p>
        </div>
        <button 
          onClick={() => setShowArchive(!showArchive)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${showArchive ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'}`}
        >
          <History size={18} />
          {showArchive ? 'Back to Board' : t.showArchive}
        </button>
      </div>

      {!showArchive && (
        <form onSubmit={addTask} className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t.taskTitle}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 px-8 py-5 rounded-[2rem] outline-none font-bold text-xl text-slate-900 dark:text-white border-2 border-transparent focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
              className="px-8 py-5 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-black text-sm appearance-none border-none text-center text-slate-900 dark:text-white min-w-[140px]"
            >
              <option value={Priority.HIGH}>{t.high}</option>
              <option value={Priority.MEDIUM}>{t.medium}</option>
              <option value={Priority.LOW}>{t.low}</option>
            </select>
            <button type="submit" className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-3">
              <Plus size={24} />
              {t.addTask}
            </button>
          </div>
        </form>
      )}

      {showArchive ? (
        <div className="bg-slate-100 dark:bg-slate-900/50 p-10 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-slate-400">{t.archived}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {prefs.archivedTasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm flex justify-between items-center opacity-70 group">
                <span className="font-bold line-through text-slate-500">{task.title}</span>
                <button onClick={() => deleteTask(task.id, true)} className="text-rose-400 hover:text-rose-600 p-2 transition-colors"><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
          {prefs.archivedTasks.length === 0 && (
             <div className="py-20 text-center opacity-30">
               <History size={64} className="mx-auto mb-4" />
               <p className="font-black text-xl">Archive is empty</p>
             </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Mobile Tab Switcher */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-3xl md:hidden">
            {statuses.map(s => (
              <button
                key={s.key}
                onClick={() => setMobileActiveTab(s.key)}
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-tighter transition-all ${mobileActiveTab === s.key ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
              >
                {s.label} ({prefs.tasks.filter(t => t.status === s.key).length})
              </button>
            ))}
          </div>

          {/* Kanban Columns (Desktop view) */}
          <div className="grid md:grid-cols-3 gap-8">
            {statuses.map(status => (
              <div 
                key={status.key} 
                className={`flex-col gap-6 ${mobileActiveTab === status.key ? 'flex' : 'hidden md:flex'}`}
              >
                <div className="flex items-center justify-between px-6">
                  <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-400">{status.label}</h3>
                  <span className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-[10px] font-black text-slate-600 dark:text-slate-400">
                    {prefs.tasks.filter(t => t.status === status.key).length}
                  </span>
                </div>
                
                <div className="flex flex-col gap-5 min-h-[500px] p-2">
                  {prefs.tasks.filter(t => t.status === status.key).map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  
                  {prefs.tasks.filter(t => t.status === status.key).length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-300 dark:text-slate-600 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] p-10">
                      <Info size={40} className="mx-auto mb-4 opacity-10" />
                      <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t.noTasks}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;