import React, { useState, useEffect, useMemo } from 'react';
import { VOCABULARY_DATA } from '../constants';
import { VocabWord, VoiceGender } from '../types';
import { Check, Play, Settings2, User, UserCheck, Volume2, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound } from '../utils/audio';
import { getAvailableVoices, speakWord } from '../utils/speech';

interface SelectionScreenProps {
  onStartQuiz: (selectedWords: VocabWord[], gender: VoiceGender, voiceURI?: string) => void;
}

export const SelectionScreen: React.FC<SelectionScreenProps> = ({ onStartQuiz }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [checkedWords, setCheckedWords] = useState<Set<string>>(new Set());
  const [selectedGender, setSelectedGender] = useState<VoiceGender>('female');

  // Voice Selection State
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedMaleVoiceURI, setSelectedMaleVoiceURI] = useState<string>('');

  // Load voices on mount
  useEffect(() => {
    getAvailableVoices().then(voices => {
      setAllVoices(voices);
    });
  }, []);

  const maleVoices = useMemo(() => {
    // Keywords that indicate male voices - including iOS/Android voice names
    const maleKeywords = [
      'male',
      // Windows
      'david', 'mark', 'guy', 'ryan', 'christopher', 'eric', 'george', 'roger', 'sean', 'brian', 'matthew', 'joey', 'justin', 'stephen', 'rishi', 'thomas', 'william', 'arthur', 'henry', 'oliver', 'liam', 'aaron', 'connor', 'andrew', 'jacob', 'noah', 'ethan', 'mason', 'logan', 'lucas', 'jack', 'benjamin', 'elijah', 'michael', 'alexander', 'anthony', 'joshua',
      // iOS/macOS
      'alex', 'fred', 'tom', 'junior', 'ralph', 'albert', 'bruce', 'daniel',
      // Android/Google
      'james'
    ];

    // Region priority for sorting (lower = higher priority)
    const getRegionPriority = (name: string, lang: string): number => {
      const text = (name + ' ' + lang).toLowerCase();
      if (text.includes('united states') || text.includes('en-us') || text.includes('en_us')) return 1;
      if (text.includes('canada') || text.includes('en-ca') || text.includes('en_ca')) return 2;
      if (text.includes('australia') || text.includes('en-au') || text.includes('en_au')) return 3;
      if (text.includes('united kingdom') || text.includes('en-gb') || text.includes('en_gb') || text.includes('british')) return 4;
      if (text.includes('ireland') || text.includes('en-ie') || text.includes('en_ie')) return 5;
      if (text.includes('india') || text.includes('en-in') || text.includes('en_in')) return 6;
      return 99; // Other regions
    };

    // Filter for English voices that explicitly contain male keywords
    const filtered = allVoices.filter(v => {
      if (!v.lang.includes('en')) return false;
      const nameLower = v.name.toLowerCase();
      // ONLY include if it explicitly contains a male keyword
      return maleKeywords.some(kw => nameLower.includes(kw));
    });

    // Sort by region priority
    return filtered.sort((a, b) => {
      const priorityA = getRegionPriority(a.name, a.lang);
      const priorityB = getRegionPriority(b.name, b.lang);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.name.localeCompare(b.name); // Secondary sort by name
    });
  }, [allVoices]);

  // Get all English voices as fallback when no male voices are detected
  const allEnglishVoices = useMemo(() => {
    const getRegionPriority = (name: string, lang: string): number => {
      const text = (name + ' ' + lang).toLowerCase();
      if (text.includes('united states') || text.includes('en-us') || text.includes('en_us')) return 1;
      if (text.includes('canada') || text.includes('en-ca') || text.includes('en_ca')) return 2;
      if (text.includes('australia') || text.includes('en-au') || text.includes('en_au')) return 3;
      if (text.includes('united kingdom') || text.includes('en-gb') || text.includes('en_gb') || text.includes('british')) return 4;
      return 99;
    };

    return allVoices
      .filter(v => v.lang.includes('en'))
      .sort((a, b) => {
        const priorityA = getRegionPriority(a.name, a.lang);
        const priorityB = getRegionPriority(b.name, b.lang);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.name.localeCompare(b.name);
      });
  }, [allVoices]);

  // Use maleVoices if available, otherwise show all English voices
  const voicesForDadMode = maleVoices.length > 0 ? maleVoices : allEnglishVoices;

  // Set default voice for Dad mode - prioritize male voices, fallback to first available
  useEffect(() => {
    if (voicesForDadMode.length > 0 && !selectedMaleVoiceURI) {
      // Priority 1: Try to find "Andrew Online" from United States (Windows)
      let defaultVoice = voicesForDadMode.find(v =>
        v.name.toLowerCase().includes('andrew') &&
        (v.name.toLowerCase().includes('online') || v.name.toLowerCase().includes('united states') || v.lang.includes('en-US'))
      );

      // Priority 2: Try to find any "Andrew" voice
      if (!defaultVoice) {
        defaultVoice = voicesForDadMode.find(v => v.name.toLowerCase().includes('andrew'));
      }

      // Priority 3: Try to find common male voices (Alex for iOS, David for Windows)
      if (!defaultVoice) {
        const priorityNames = ['alex', 'david', 'daniel', 'james', 'tom', 'fred'];
        for (const name of priorityNames) {
          defaultVoice = voicesForDadMode.find(v => v.name.toLowerCase().includes(name));
          if (defaultVoice) break;
        }
      }

      // Priority 4: Fallback to first available voice
      if (!defaultVoice && voicesForDadMode.length > 0) {
        defaultVoice = voicesForDadMode[0];
      }

      if (defaultVoice) {
        setSelectedMaleVoiceURI(defaultVoice.voiceURI);
      }
    }
  }, [voicesForDadMode, selectedMaleVoiceURI]);

  const teams = useMemo(() => {
    return Array.from(new Set(VOCABULARY_DATA.map(w => w.team))).sort();
  }, []);

  const lessons = useMemo(() => {
    if (!selectedTeam) return [];
    return Array.from(new Set(VOCABULARY_DATA
      .filter(w => w.team === selectedTeam)
      .map(w => w.lesson)
    )).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [selectedTeam]);

  const availableWords = useMemo(() => {
    if (!selectedTeam || !selectedLesson) return [];
    return VOCABULARY_DATA.filter(w => w.team === selectedTeam && w.lesson === selectedLesson);
  }, [selectedTeam, selectedLesson]);

  useEffect(() => {
    if (availableWords.length > 0) {
      setCheckedWords(new Set(availableWords.map(w => w.id)));
    } else {
      setCheckedWords(new Set());
    }
  }, [availableWords]);

  const toggleWord = (id: string) => {
    playSound.click();
    const next = new Set(checkedWords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedWords(next);
  };

  const toggleAll = () => {
    playSound.click();
    if (checkedWords.size === availableWords.length) {
      setCheckedWords(new Set());
    } else {
      setCheckedWords(new Set(availableWords.map(w => w.id)));
    }
  };

  const handleStart = () => {
    const wordsToQuiz = availableWords.filter(w => checkedWords.has(w.id));
    if (wordsToQuiz.length > 0) {
      // If male is selected and we have a specific URI, pass it. Otherwise undefined (let utility decide)
      const voiceURI = selectedGender === 'male' && selectedMaleVoiceURI ? selectedMaleVoiceURI : undefined;
      onStartQuiz(wordsToQuiz, selectedGender, voiceURI);
    }
  };

  const testVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakWord("Hello, I am ready for the test.", selectedGender, selectedMaleVoiceURI);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-2 md:p-4 space-y-6">

      {/* Main Control Panel */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl shadow-xl border-b-8 border-gray-200 p-6 space-y-6"
      >
        {/* Examiner Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sky-600 font-black text-lg uppercase tracking-wider">
            <UserCheck className="w-6 h-6" />
            選擇考官
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Dad Button (Left) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playSound.click(); setSelectedGender('male'); }}
              className={`relative overflow-hidden p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2
                 ${selectedGender === 'male'
                  ? 'bg-blue-50 border-blue-400 shadow-[0_4px_0_0_#60a5fa]'
                  : 'bg-gray-50 border-gray-200 shadow-[0_4px_0_0_#e5e7eb] grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}
               `}
            >
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="w-8 h-8 text-blue-500" />
              </div>
              <span className={`font-black text-lg ${selectedGender === 'male' ? 'text-blue-600' : 'text-gray-500'}`}>爸爸考試</span>
              {selectedGender === 'male' && <div className="absolute top-2 right-2 text-blue-500"><Check className="w-5 h-5 stroke-[4]" /></div>}
            </motion.button>

            {/* Mom Button (Right) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playSound.click(); setSelectedGender('female'); }}
              className={`relative overflow-hidden p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2
                 ${selectedGender === 'female'
                  ? 'bg-pink-50 border-pink-400 shadow-[0_4px_0_0_#f472b6]'
                  : 'bg-gray-50 border-gray-200 shadow-[0_4px_0_0_#e5e7eb] grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}
               `}
            >
              <div className="bg-pink-100 p-3 rounded-full">
                <User className="w-8 h-8 text-pink-500" />
              </div>
              <span className={`font-black text-lg ${selectedGender === 'female' ? 'text-pink-600' : 'text-gray-500'}`}>媽媽考試</span>
              {selectedGender === 'female' && <div className="absolute top-2 right-2 text-pink-500"><Check className="w-5 h-5 stroke-[4]" /></div>}
            </motion.button>
          </div>

          {/* Detailed Voice Selection for Male */}
          {selectedGender === 'male' && voicesForDadMode.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-blue-50 rounded-xl p-3 border border-blue-100 mt-2"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-blue-600 uppercase">
                  {maleVoices.length > 0
                    ? `自選男聲 (偵測到 ${maleVoices.length} 種)`
                    : `自選英文語音 (偵測到 ${voicesForDadMode.length} 種)`}
                </label>
                <button onClick={testVoice} className="text-xs flex items-center gap-1 bg-blue-200 hover:bg-blue-300 text-blue-800 px-2 py-1 rounded-md transition-colors font-bold">
                  <Volume2 className="w-3 h-3" /> 試聽
                </button>
              </div>
              {maleVoices.length === 0 && (
                <p className="text-xs text-orange-600 mb-2">⚠️ 未偵測到男聲，顯示所有英文語音供選擇</p>
              )}
              <select
                value={selectedMaleVoiceURI}
                onChange={(e) => setSelectedMaleVoiceURI(e.target.value)}
                className="w-full text-sm p-2 rounded-lg border-2 border-blue-200 bg-white text-gray-700 outline-none focus:border-blue-400"
              >
                {voicesForDadMode.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </motion.div>
          )}
        </div>

        <div className="h-px bg-gray-100 my-4" />

        <div className="flex items-center gap-2 text-sky-600 font-black text-lg uppercase tracking-wider">
          <Settings2 className="w-6 h-6" />
          考試範圍
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-extrabold text-gray-400 uppercase ml-1">Team (課本)</label>
            <select
              className="w-full p-4 bg-sky-50 border-2 border-sky-100 rounded-2xl font-bold text-sky-800 focus:ring-4 focus:ring-sky-200 focus:border-sky-400 outline-none transition-all cursor-pointer hover:bg-sky-100 appearance-none"
              value={selectedTeam}
              onChange={(e) => {
                playSound.click();
                setSelectedTeam(e.target.value);
                setSelectedLesson('');
              }}
            >
              <option value="">選擇 Team...</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-extrabold text-gray-400 uppercase ml-1">Lesson (課程)</label>
            <select
              className="w-full p-4 bg-purple-50 border-2 border-purple-100 rounded-2xl font-bold text-purple-800 focus:ring-4 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all cursor-pointer hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              value={selectedLesson}
              onChange={(e) => {
                playSound.click();
                setSelectedLesson(e.target.value);
              }}
              disabled={!selectedTeam}
            >
              <option value="">選擇 Lesson...</option>
              {lessons.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Word Selection Grid */}
        {availableWords.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-700 text-lg">
                任務目標 <span className="text-sm font-medium text-gray-400 ml-2">({checkedWords.size} 個單字)</span>
              </h3>
              <button
                onClick={toggleAll}
                className="text-xs font-bold bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-600 transition-colors"
              >
                {checkedWords.size === availableWords.length ? '取消全選' : '全選'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {availableWords.map(word => {
                const isChecked = checkedWords.has(word.id);
                return (
                  <motion.div
                    key={word.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleWord(word.id)}
                    className={`
                      cursor-pointer p-3 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 select-none
                      ${isChecked
                        ? 'bg-green-50 border-green-400 shadow-[0_4px_0_0_#4ade80]'
                        : 'bg-white border-gray-200 shadow-[0_4px_0_0_#e5e7eb] hover:bg-gray-50'}
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                      ${isChecked ? 'bg-green-400 text-white' : 'bg-gray-200 text-gray-400'}
                    `}>
                      {isChecked ? <Check className="w-5 h-5 stroke-[4]" /> : <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-black text-lg ${isChecked ? 'text-green-800' : 'text-gray-600'}`}>
                        {word.english}
                      </span>
                      <span className="text-xs font-bold text-gray-400">{word.chinese}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Big Start Button */}
        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.95, translateY: 0 }}
          onClick={handleStart}
          disabled={checkedWords.size === 0}
          className={`w-full py-5 rounded-2xl font-black text-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-3 uppercase tracking-wider text-white
             disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-[6px]
             ${selectedGender === 'female'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 shadow-[0_6px_0_0_#be123c]'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-[0_6px_0_0_#3730a3]'}
          `}
        >
          <Play className="w-8 h-8 fill-current" />
          開始{selectedGender === 'female' ? '媽媽' : '爸爸'}考試
        </motion.button>

      </motion.div>
    </div>
  );
};