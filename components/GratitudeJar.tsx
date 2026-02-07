import React, { useState } from 'react';
import { UserPreferences, GratitudeNote } from '../types';
import { translations } from '../i18n';
import { Heart, Plus, Sparkles, X, List, Clock, Trash2 } from 'lucide-react';

interface GratitudeJarProps {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const GratitudeJar: React.FC<GratitudeJarProps> = ({ prefs, setPrefs }) => {
  const t = translations[prefs.language];
  const [noteText, setNoteText] = useState('');
  const [isJarOpen, setIsJarOpen] = useState(false);

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newNote: GratitudeNote = {
      id: Math.random().toString(36).substr(2, 9),
      text: noteText,
      date: new Date().toLocaleDateString(prefs.language === 'ar' ? 'ar-SA' : 'en-US')
    };

    setPrefs(prev => ({
      ...prev,
      gratitudeNotes: [newNote, ...prev.gratitudeNotes],
      lastActivityDate: new Date().toDateString()
    }));
    setNoteText('');
  };

  const deleteNote = (id: string) => {
    setPrefs(prev => ({
      ...prev,
      gratitudeNotes: prev.gratitudeNotes.filter(n => n.id !== id)
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black mb-1 tracking-tight text-slate-900 dark:text-white">{t.gratitudeJar}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">{t.gratitudeInput}</p>
        </div>
        <button 
          onClick={() => setIsJarOpen(!isJarOpen)}
          className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 rounded-[2rem] font-black border border-slate-200 dark:border-slate-700 shadow-xl transition-all hover:scale-105 text-slate-800 dark:text-white"
        >
          {isJarOpen ? <X size={20} /> : <List size={20} />}
          {isJarOpen ? t.closeJar : t.openJar}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Input & Virtual Jar Visual */}
        <div className="flex flex-col gap-8">
          <form onSubmit={addNote} className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
            <textarea 
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t.gratitudeInput}
              className="w-full bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl min-h-[120px] font-bold text-xl outline-none focus:ring-4 focus:ring-rose-500/10 transition-all resize-none text-slate-900 dark:text-white"
            />
            <button 
              type="submit"
              disabled={!noteText.trim()}
              className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-rose-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-600"
            >
              <Plus size={24} />
              {t.save}
            </button>
          </form>

          {/* Virtual Jar Graphic */}
          <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-900/30 rounded-[4rem] border-8 border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
             {/* Glass Effect Jar */}
             <div className="w-64 h-80 border-[12px] border-white/40 rounded-[3rem] relative shadow-2xl flex flex-wrap gap-1 p-6 items-end justify-center backdrop-blur-[2px]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-white/60 rounded-full shadow-md" />
                {prefs.gratitudeNotes.slice(0, 30).map((note, idx) => (
                  <div 
                    key={note.id} 
                    className={`w-6 h-10 rounded-lg shadow-sm animate-in zoom-in rotate-${(idx % 4) * 12}`}
                    style={{ backgroundColor: ['#fecaca', '#bfdbfe', '#bbf7d0', '#fef08a'][idx % 4] }}
                  />
                ))}
                {prefs.gratitudeNotes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Heart size={64} className="text-white/20 animate-pulse" />
                  </div>
                )}
             </div>
             <div className="absolute bottom-8 text-center space-y-1">
                <span className="text-5xl font-black text-slate-300 dark:text-slate-700 tabular-nums">{prefs.gratitudeNotes.length}</span>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Notes Collected</p>
             </div>
          </div>
        </div>

        {/* History List */}
        <div className={`
          bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-500
          ${isJarOpen ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none grayscale'}
        `}>
          <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white"><Sparkles className="text-rose-500" />{t.gratitudeJar} History</h3>
            <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 px-4 py-1.5 rounded-2xl text-xs font-black">{prefs.gratitudeNotes.length}</span>
          </div>
          <div className="max-h-[800px] overflow-y-auto p-6 space-y-4">
            {prefs.gratitudeNotes.length === 0 ? (
               <div className="py-20 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                  <Heart size={48} className="mb-4 opacity-20" />
                  <p className="font-bold text-lg">{t.jarEmpty}</p>
               </div>
            ) : (
              prefs.gratitudeNotes.map(note => (
                <div key={note.id} className="group bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:ring-2 hover:ring-rose-500/20 relative">
                   <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                       <Clock size={12} /> {note.date}
                     </div>
                     <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all">
                       <Trash2 size={16} />
                     </button>
                   </div>
                   <p className="text-xl font-bold leading-relaxed text-slate-800 dark:text-white">{note.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GratitudeJar;