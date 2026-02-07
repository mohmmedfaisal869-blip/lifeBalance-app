import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences } from '../types';
import { translations } from '../i18n';
import { 
  Plus, Minus, Book, RotateCcw, Edit2, Check, Loader, 
  ChevronLeft, ChevronRight, Search, ChevronDown, 
  Play, Pause, Volume2, Copy, X
} from 'lucide-react';
import { surahsList } from '../data/surahs';
import { surahStartPages } from '../data/surahStartPages';
import { quranText } from '../data/quranText';

const RECITERS = [
  // Al-Haram Al-Makki (Makkah)
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'Abdur-Rahman as-Sudais' },
  { id: 'Saood_ash-Shuraym_128kbps', name: 'Saood Ash-Shuraym' },
  { id: 'Maher_AlMuaiqly_128kbps', name: 'Maher Al Muaiqly' },
  { id: 'Abdullah_Al-Juhany_128kbps', name: 'Abdullah Awad Al-Juhany' },
  { id: 'Yasser_Ad-Dussary_128kbps', name: 'Yasser Al-Dosari' },
  
  // Al-Haram Al-Madani (Madinah)
  { id: 'Hudhaify_128kbps', name: 'Ali Al-Hudhaify' },
  { id: 'Salah_Al_Budair_128kbps', name: 'Salah Al-Budair' },
  { id: 'Muhammad_Ayyoub_128kbps', name: 'Muhammad Ayyoub' },
  { id: 'Ibrahim_Akhdar_32kbps', name: 'Ibrahim Al-Akhdar' },

  // Golden Era & Legends
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'Abdul Basit (Murattal)' },
  { id: 'Abdul_Basit_Mujawwad_128kbps', name: 'Abdul Basit (Mujawwad)' },
  { id: 'Minshawy_Murattal_128kbps', name: 'Al-Minshawi (Murattal)' },
  { id: 'Minshawy_Mujawwad_192kbps', name: 'Al-Minshawi (Mujawwad)' },
  { id: 'Husary_128kbps', name: 'Al-Husary (Murattal)' },
  { id: 'Husary_Mujawwad_128kbps', name: 'Al-Husary (Mujawwad)' },

  // Popular & Renowned
  { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy' },
  { id: 'Ahmed_ibn_Ali_al-Ajamy_128kbps', name: 'Ahmed ibn Ali al-Ajamy' },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Abu Bakr Ash-Shaatree' },
  { id: 'Hani_Rifai_192kbps', name: 'Hani Ar-Rifai' },
  { id: 'Abdullah_Basfar_192kbps', name: 'Abdullah Basfar' },
  { id: 'Muhammad_Jibreel_128kbps', name: 'Muhammad Jibreel' },
  { id: 'Parhizgar_48kbps', name: 'Parhizgar' }
];

interface QuranVerse {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
  };
  numberInSurah: number;
  ayah: number;
  page: number;
  audio?: string;
  hezbQuarter?: number;
  juz?: number;
}

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
}

interface QuranReminderProps {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

// Add font for Arabic
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
  .font-arabic {
    font-family: 'Amiri', serif;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

const QuranReminder: React.FC<QuranReminderProps> = ({ prefs, setPrefs }) => {
  const t = translations[prefs.language];
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState((prefs.quranPagesGoal || 5).toString());
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Navigation State
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Audio & UI State
  const [selectedReciter, setSelectedReciter] = useState('Alafasy_128kbps');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchPage, setSearchPage] = useState('');
  const [activeVerse, setActiveVerse] = useState<{ verse: QuranVerse; index: number; meaning?: string } | null>(null);
  
  // Reciter Search State
  const [reciterSearch, setReciterSearch] = useState('');
  const [showReciterList, setShowReciterList] = useState(false);
  const reciterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (reciterDropdownRef.current && !reciterDropdownRef.current.contains(event.target as Node)) {
        setShowReciterList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Content State
  const [quranVerses, setQuranVerses] = useState<QuranVerse[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);

  // UI State
  const [isLoadingQuran, setIsLoadingQuran] = useState(false);
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(false);
  const [quranError, setQuranError] = useState('');
  const [surahError, setSurahError] = useState('');
  const [showSurahList, setShowSurahList] = useState(true);
  const [hasSelectedSurah, setHasSelectedSurah] = useState(false);

  const getApiBase = () => {
    return 'https://api.alquran.cloud';
  };

  const updatePages = (amount: number) => {
    const newVal = Math.max(0, (prefs.quranPagesRead || 0) + amount);
    const newTotal = (prefs.quranTotalPages || 0) + amount;
    
    // Check if we're reading pages today for streak calculation
    const today = new Date().toDateString();
    const lastReset = prefs.lastQuranReset;
    const streakDays = lastReset === today ? (prefs.quranStreakDays || 0) : (lastReset !== new Date(new Date().getTime() - 86400000).toDateString() ? 0 : (prefs.quranStreakDays || 0));
    const newStreakDays = newVal > 0 ? Math.max(1, streakDays + (lastReset !== today ? 1 : 0)) : streakDays;
    
    setPrefs(prev => ({ 
      ...prev, 
      quranPagesRead: newVal, 
      quranTotalPages: Math.max(0, newTotal),
      quranStreakDays: newStreakDays,
      lastActivityDate: today 
    }));
  };

  const resetPages = () => {
    const today = new Date().toDateString();
    const lastReset = prefs.lastQuranReset;
    const wasPagesReadToday = (prefs.quranPagesRead || 0) > 0;
    const streakDays = wasPagesReadToday ? ((prefs.quranStreakDays || 0) + 1) : (prefs.quranStreakDays || 0);
    
    setPrefs(prev => ({ 
      ...prev, 
      quranPagesRead: 0, 
      lastQuranReset: today,
      quranStreakDays: streakDays
    }));
    setIsConfirmingReset(false);
  };

  const handleSaveGoal = () => {
    if (tempGoal && !isNaN(Number(tempGoal)) && Number(tempGoal) > 0) {
      setPrefs(p => ({ ...p, quranPagesGoal: Number(tempGoal) }));
      setIsEditingGoal(false);
    }
  };

  const fetchAllSurahs = async () => {
    setSurahs(surahsList);
    setIsLoadingSurahs(false);
  };

  // Fetch Quran PAGE logic
  const fetchQuranPage = async (pageNumber: number) => {
    setIsLoadingQuran(true);
    setQuranError('');
    
    // Stop audio when loading new page
    if (audioRef.current) {
        audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentAudioIndex(0);

    try {
      // Use Local Text Data
      const pageVerses = (quranText as any[]).filter((ayah: any) => ayah.page === pageNumber);
      
      if (pageVerses.length > 0) {
        // Construct Audio URLs manually (EveryAyah format)
        // Format: https://everyayah.com/data/{Reciter_ID}/{SurahPad}{AyahPad}.mp3
        const verses = pageVerses.map((v: any) => {
            const surahPad = String(v.surah.number).padStart(3, '0');
            const ayahPad = String(v.numberInSurah).padStart(3, '0');
            return {
                ...v,
                audio: `https://everyayah.com/data/${selectedReciter}/${surahPad}${ayahPad}.mp3`
            };
        });
        
        console.log(`Generated ${verses.length} audio URLs for reciter: ${selectedReciter}`);
        setQuranVerses(verses);
        setCurrentSurah(verses[0].surah.number);
      } else {
        console.error('❌ No verses found for page:', pageNumber);
        setQuranError('Unable to load verses from local data');
      }
    } catch (error) {
      console.error('❌ Error preparing Quran page:', error);
      const msg = error instanceof Error ? error.message : String(error);
      setQuranError(`Error: ${msg}`);
    } finally {
      setIsLoadingQuran(false);
    }
  };

  useEffect(() => {
    fetchAllSurahs();
  }, []);

  useEffect(() => {
    if (hasSelectedSurah && currentPage) {
      fetchQuranPage(currentPage);
    }
  }, [currentPage, hasSelectedSurah, selectedReciter]);

  // Audio Player Effect
  useEffect(() => {
    // Cleanup function to stop audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.onended = () => {
            setCurrentAudioIndex(prev => prev + 1);
        };
        audioRef.current.onerror = (e) => {
            console.error("Audio Error Event:", e);
            // Stop playback on error to prevent infinite skipping loop
            setIsPlaying(false);
            alert("Unable to play audio. The reciter source might be unavailable.");
        };
    }
    
    const playAudio = async () => {
        if (isPlaying) {
            if (quranVerses && currentAudioIndex < quranVerses.length) {
                const verse = quranVerses[currentAudioIndex];
                
                if (verse && verse.audio) {
                    try {
                        // Preload next verse for smoother transition
                        const nextVerse = quranVerses[currentAudioIndex + 1];
                        if (nextVerse?.audio) {
                            const preload = new Audio();
                            preload.src = nextVerse.audio;
                            preload.preload = 'auto';
                        }

                        // Only change src if it's different to avoid reloading
                        if (audioRef.current && audioRef.current.src !== verse.audio) {
                            audioRef.current.src = verse.audio;
                        }
                        
                        if (audioRef.current && audioRef.current.paused) {
                            const playPromise = audioRef.current.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(e => {
                                    console.error("Play Promise error:", e);
                                    setIsPlaying(false);
                                    // Don't show alert for user-abort (pause)
                                    if (e.name !== 'AbortError') {
                                        alert("Playback failed. Please try a different reciter.");
                                    }
                                });
                            }
                        }
                    } catch (e) {
                         console.error("Sync Play Error:", e);
                         setIsPlaying(false);
                    }
                } else {
                     console.warn("Verse has no audio URL.");
                     setIsPlaying(false);
                     alert("Audio not available for this verse.");
                }
            } else {
                 // Finished the page
                 setIsPlaying(false);
                 setCurrentAudioIndex(0);
            }
        } else {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        }
    };

    playAudio();
  }, [isPlaying, currentAudioIndex, quranVerses]);

  const handleSurahSelect = (surahNumber: number) => {
    const startPage = surahStartPages[surahNumber] || 1;
    setCurrentPage(startPage);
    setCurrentSurah(surahNumber);
    setHasSelectedSurah(true);
    setShowSurahList(false);
  };

  const handleNextPage = () => {
    if (currentPage < 604) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const percentage = Math.min(100, ((prefs.quranPagesRead || 0) / Math.max(1, prefs.quranPagesGoal || 5)) * 100);
  const remainingPages = Math.max(0, (prefs.quranPagesGoal || 5) - (prefs.quranPagesRead || 0));

  // Fetch Meaning when activeVerse is set
  useEffect(() => {
    if (activeVerse && !activeVerse.meaning) {
        const fetchMeaning = async () => {
            try {
                // Use Arabic Tafsir: ar.muyassar (King Fahad Quran Complex - Tafsir Al-Muyassar)
                const res = await fetch(`https://api.alquran.cloud/v1/ayah/${activeVerse.verse.surah.number}:${activeVerse.verse.numberInSurah}/ar.muyassar`);
                const data = await res.json();
                if (data.code === 200 && data.data && data.data.text) {
                    setActiveVerse(prev => prev ? { ...prev, meaning: data.data.text } : null);
                } else {
                    setActiveVerse(prev => prev ? { ...prev, meaning: "التفسير غير متوفر حالياً" } : null);
                }
            } catch (e) {
                console.error("Failed to fetch meaning", e);
                setActiveVerse(prev => prev ? { ...prev, meaning: "خطأ في تحميل التفسير" } : null);
            }
        };
        fetchMeaning();
    }
  }, [activeVerse]);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">{t.quranReminder}</h2>
          <p className="text-slate-500 font-bold mt-2">{t.descriptions.quranReminder}</p>
          <div className="mt-3 flex items-center gap-3">
            {isEditingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="w-20 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-2 border-blue-500 rounded-xl font-black text-sm"
                  min="1"
                />
                <span className="text-sm font-bold text-slate-500">{t.headers.pagesGoal}</span>
                <button
                  onClick={handleSaveGoal}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
                  <button
                  onClick={() => setIsEditingGoal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                >
                  <Edit2 size={14} />
                  {t.headers.pagesGoal}: {prefs.quranPagesGoal || 5}
                </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl shadow-emerald-600/20">
          <div className="flex items-start justify-between mb-8">
            <Book size={40} className="opacity-90" />
            {isConfirmingReset ? (
              <div className="flex gap-2">
                <button
                  onClick={resetPages}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition-colors"
                >
                  {t.buttons.yes}
                </button>
                <button
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-3 py-1 bg-slate-500 text-white rounded-lg font-bold text-sm hover:bg-slate-600 transition-colors"
                >
                  {t.buttons.cancel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingReset(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-all"
              >
                <RotateCcw size={16} />
                {t.buttons.resetPages}
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-2">{t.headers.pagesRead}</p>
              <div className="flex items-end gap-4">
                <div className="text-6xl md:text-7xl font-black tabular-nums">{prefs.quranPagesRead || 0}</div>
                <div className="text-emerald-100 font-bold">
                  <p className="text-lg">{t.headers.pagesGoal}: {prefs.quranPagesGoal || 5}</p>
                  <p className="text-sm">{remainingPages} {remainingPages === 1 ? 'page' : 'pages'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-8">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold opacity-90">{t.headers.quranProgress}</span>
                <span className="font-black text-lg">{percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-300 to-emerald-200 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-white/20">
              <button
                onClick={() => updatePages(-1)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-black text-sm md:text-base transition-all duration-200 active:scale-95"
              >
                <Minus size={20} />
                <span className="hidden sm:inline">{t.buttons.minus || 'Minus'}</span>
              </button>
              <button
                onClick={() => updatePages(1)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-black text-sm md:text-base transition-all duration-200 active:scale-95"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">{t.buttons.addPages}</span>
              </button>
              <button
                onClick={() => updatePages(5)}
                className="flex-1 px-4 py-3 bg-white/30 hover:bg-white/40 rounded-xl font-black text-sm md:text-base transition-all duration-200 active:scale-95"
              >
                +5
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Book className="text-emerald-600" size={24} />
                {t.headers.quranReading}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t.descriptions.quranBenefit}
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-600 p-4 rounded-lg">
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                💡 {t.tips?.[0] || 'Start with a few pages each day and gradually increase your reading'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-600">{prefs.quranPagesRead}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{t.labels.today}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-600">{prefs.quranPagesGoal}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{t.headers.pagesGoal}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/50 rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6">
        {showSurahList && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {t.common?.surahList || 'Surah List'}
             </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {isLoadingSurahs ? (
              <div className="col-span-full flex justify-center py-16">
                <Loader className="animate-spin text-amber-600" size={48} />
              </div>
            ) : surahs.length === 0 ? (
              <div className="col-span-full text-center py-16 space-y-4">
                 <button onClick={fetchAllSurahs} className="px-4 py-2 bg-amber-600 text-white rounded-lg">{t.common?.retry || 'Retry'}</button>
              </div>
            ) : (
              surahs.map((surah) => (
                <button
                  key={surah.number}
                  onClick={() => handleSurahSelect(surah.number)}
                  className="p-6 rounded-2xl border-2 transition-all duration-200 active:scale-95 text-right hover:scale-105 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700"
                >
                  <p className="font-black text-lg mb-2">{surah.number}</p>
                  <p className="font-black text-xl">{surah.name}</p>
                  <p className="text-sm font-bold opacity-70 mt-2">{surah.numberOfAyahs} آية</p>
                </button>
              ))
            )}
          </div>
        </div>
        )}

        {!showSurahList && hasSelectedSurah && (
          <>
             {!isFullScreen && (
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setShowSurahList(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold hover:bg-slate-300 transition"
                  >
                    <ChevronLeft size={16} />
                    {t.common?.listButton || t.common?.list || 'List'}
                  </button>
                </div>
             )}

            {isLoadingQuran && (
              <div className="flex items-center justify-center py-16 min-h-[500px]">
                <Loader className="animate-spin text-amber-600" size={48} />
              </div>
            )}

            {!isLoadingQuran && quranVerses.length > 0 && (
              <div className={`${isFullScreen ? 'fixed inset-0 z-[100] bg-white dark:bg-slate-900 overflow-y-auto' : 'bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700'} transition-all duration-300 flex flex-col`}>
                 <div className={`sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 ${isFullScreen ? 'p-4' : 'px-3 py-2.5 rounded-t-3xl'}`}>
                     
                     <div className="flex items-center gap-1.5 md:gap-3 flex-1 min-w-0">
                        
                        <select 
                             value={currentSurah}
                             onChange={(e) => handleSurahSelect(Number(e.target.value))}
                             className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg font-bold text-xs md:text-sm w-24 md:w-auto text-slate-700 dark:text-slate-300 outline-none flex-shrink-0"
                        >
                            {surahsList.map(s => <option key={s.number} value={s.number}>{s.number}. {s.name}</option>)}
                        </select>

                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg flex-shrink-0">
                           <span className="text-xs font-bold text-slate-400 hidden md:inline">{t.common?.page || 'PG'}</span>
                           <input 
                              type="number" 
                              value={searchPage || currentPage}
                              onChange={(e) => setSearchPage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const p = Number(searchPage);
                                    if(p >= 1 && p <= 604) {
                                        setCurrentPage(p);
                                        setSearchPage('');
                                        setIsPlaying(false);
                                    }
                                }
                              }}
                              className="w-8 md:w-10 bg-transparent font-black text-center outline-none text-slate-700 dark:text-slate-300 text-xs md:text-sm"
                           />
                        </div>
                     </div>

                     <div className="flex items-center gap-1.5">
                         <div className="relative" ref={reciterDropdownRef}>
                           <button
                             onClick={() => setShowReciterList(!showReciterList)}
                             className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1.5 text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 max-w-[100px] md:max-w-[200px]"
                           >
                              <span className="truncate">{RECITERS.find(r => r.id === selectedReciter)?.name || 'Select Reciter'}</span>
                              <ChevronDown size={14} className="flex-shrink-0 opacity-50" />
                           </button>
                           
                           {showReciterList && (
                             <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 p-2 max-h-80 overflow-y-auto z-[110] animate-in fade-in slide-in-from-top-2">
                               <div className="sticky top-0 bg-white dark:bg-slate-800 p-1 mb-2 border-b border-slate-100 dark:border-slate-700 z-10">
                                 <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1.5 focus-within:ring-2 ring-amber-500/20 transition-all">
                                   <Search size={14} className="text-slate-400" />
                                   <input
                                     type="text"
                                     value={reciterSearch}
                                     onChange={(e) => setReciterSearch(e.target.value)}
                                     placeholder="Search reciter..."
                                     autoFocus
                                     className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400"
                                     onClick={(e) => e.stopPropagation()}
                                   />
                                 </div>
                               </div>
                               <div className="space-y-0.5">
                                 {RECITERS.filter(r => r.name.toLowerCase().includes(reciterSearch.toLowerCase())).map(r => (
                                   <button
                                     key={r.id}
                                     onClick={() => {
                                       setSelectedReciter(r.id);
                                       setShowReciterList(false);
                                     }}
                                     className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${selectedReciter === r.id ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                                   >
                                     {r.name}
                                   </button>
                                 ))}
                                 {RECITERS.filter(r => r.name.toLowerCase().includes(reciterSearch.toLowerCase())).length === 0 && (
                                     <div className="px-3 py-4 text-center text-xs text-slate-400 italic">No reciters found</div>
                                 )}
                               </div>
                             </div>
                           )}
                         </div>

                         <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`p-2 md:p-2.5 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isPlaying ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'}`}
                         >
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                         </button>
                     </div>
                 </div>

                 <div className={`mx-auto transition-all duration-300 ${isFullScreen ? 'bg-white dark:bg-slate-900 shadow-2xl p-8 md:p-16 mb-8 max-w-6xl w-full min-h-[140vh] flex flex-col rounded-sm' : ''}`}>
                    <div className="mt-4" dir="rtl">
                     {Array.from(new Set(quranVerses.map(v => v.surah.number))).map(surahNum => {
                         const surahVerses = quranVerses.filter(v => v.surah.number === surahNum);
                         const surahInfo = surahVerses[0].surah;
                         const isStartOfSurah = surahVerses[0].numberInSurah === 1;

                         return (
                             <div key={surahNum} className="mb-12">
                                 {isStartOfSurah && (
                                     <div className="text-center mt-6 mb-12 pb-6 border-b-2 border-amber-100 dark:border-amber-900/50">
                                         {surahNum !== 9 && (
                                            <p className="font-arabic text-4xl md:text-5xl leading-loose text-amber-600 mb-6 drop-shadow-sm select-none">
                                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                            </p>
                                         )}
                                         <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-200 mt-4">
                                             {surahInfo.name}
                                         </h2>
                                     </div>
                                 )}
                                 <div className={`text-3xl md:text-4xl font-arabic text-center ${isFullScreen ? 'text-4xl md:text-6xl !leading-[3.0] py-12' : '!leading-[2.5]'} text-slate-900 dark:text-slate-100 tracking-wide`} dir="rtl">
                                     {surahVerses.map((v, i) => {
                                         const originalIndex = quranVerses.indexOf(v);
                                         const isPlayingVerse = isPlaying && originalIndex === currentAudioIndex;
                                         
                                         // Clean Bismillah only from text content if it's the start of the surah (except Fatiha)
                                         let verseText = v.text;
                                         if (v.numberInSurah === 1 && surahNum !== 1 && surahNum !== 9) {
                                            verseText = verseText.replace(/بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s?/, '').trim();
                                         }

                                         return (
                                         <span 
                                            key={i} 
                                            onClick={() => setActiveVerse({ verse: v, index: originalIndex })}
                                            className={`inline relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors px-1 ${isPlayingVerse ? 'text-amber-600' : ''}`}
                                         >
                                            {verseText}
                                            <span className="inline text-emerald-600 font-bold text-[0.9em] mx-1 select-none">
                                                ﴿{v.numberInSurah}﴾
                                            </span>
                                         </span>
                                     )})}
                                 </div>
                             </div>
                         );
                     })}
                    </div>
                 </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 mb-24 py-6 px-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={handleNextPage} 
                          disabled={currentPage >= 604}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 font-bold text-slate-700 dark:text-slate-300 text-sm"
                        >
                          <ChevronRight size={18} />
                          {t.common?.next || 'Next'}
                        </button>
                        
                        <span className="font-black text-slate-400 text-sm px-3">
                            {currentPage} / 604
                        </span>

                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage <= 1}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all duration-200 active:scale-95 font-bold text-sm"
                        >
                          {t.common?.previous || 'Previous'}
                          <ChevronLeft size={18} />
                        </button>
                      </div>
                    </div>
              </div>
            )}
            
             {quranError && (
              <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-300 dark:border-red-800 rounded-2xl p-6 mt-4">
                <p className="text-red-700 dark:text-red-200 font-bold text-lg">{quranError}</p>
                 <button onClick={() => fetchQuranPage(currentPage)} className="mt-2 text-sm underline font-bold">Retry</button>
              </div>
            )}
          </>
        )}
      </div>
        {activeVerse && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setActiveVerse(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20" onClick={e => e.stopPropagation()}>
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                    {activeVerse.verse.surah.name} <span className="text-emerald-600">Verse {activeVerse.verse.numberInSurah}</span>
                </h3>
                <button onClick={() => setActiveVerse(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                </button>
             </div>
             
             <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 max-h-[60vh] overflow-y-auto">
                 <p className="font-arabic text-3xl leading-loose text-slate-800 dark:text-slate-200 mb-6" dir="rtl">
                     {activeVerse.verse.text}
                 </p>
                 
                 <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">التفسير الميسر</p>
                    {activeVerse.meaning ? (
                        <p className="text-lg text-slate-700 dark:text-slate-200 font-arabic leading-relaxed animate-in fade-in text-right" dir="rtl">
                            {activeVerse.meaning}
                        </p>
                    ) : (
                        <div className="flex justify-center py-2">
                             <Loader className="animate-spin text-slate-400" size={20} />
                        </div>
                    )}
                 </div>
             </div>

             <div className="p-4 grid gap-3">
                 <button 
                    onClick={() => {
                        setCurrentAudioIndex(activeVerse.index);
                        setIsPlaying(true);
                        setActiveVerse(null);
                    }}
                    className="flex items-center justify-center gap-3 w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all active:scale-95"
                 >
                     <Play size={20} fill="currentColor" />
                     Play From Here
                 </button>
                 
                 <button 
                    onClick={() => {
                        navigator.clipboard.writeText(activeVerse.verse.text);
                        setActiveVerse(null);
                        alert("Ayah copied to clipboard");
                    }}
                    className="flex items-center justify-center gap-3 w-full p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold transition-all active:scale-95"
                 >
                     <Copy size={20} />
                     Copy Text
                 </button>
             </div>
          </div>
        </div>
        )}
    </div>
  );
};

export default QuranReminder;
