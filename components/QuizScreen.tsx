import React, { useState, useEffect, useRef } from 'react';
import { VocabWord, QuizResult, VoiceGender } from '../types';
import { speakWord } from '../utils/speech';
import { Volume2, ArrowRight, Check, X, Mic, MicOff, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../utils/audio';

interface QuizScreenProps {
  words: VocabWord[];
  voiceGender: VoiceGender;
  specificVoiceURI?: string;
  onFinish: (results: QuizResult[], duration: number) => void;
  onExit: () => void;
}

type FeedbackState = 'idle' | 'correct' | 'wrong';

// TypeScript declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ words, voiceGender, specificVoiceURI, onFinish, onExit }) => {
  const [shuffledWords] = useState(() => [...words].sort(() => Math.random() - 0.5));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.8);

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const recognitionRef = useRef<any>(null);

  const currentWord = shuffledWords[currentIndex];

  useEffect(() => {
    // Only speak and focus if we are in idle state (ready for input)
    if (feedback === 'idle') {
      const timeout = setTimeout(() => {
        speakWord(currentWord.english, voiceGender, specificVoiceURI, speechRate);
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, currentWord, feedback, voiceGender, specificVoiceURI, speechRate]);

  // Cleanup speech recognition on unmount or when moving to next word
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [currentIndex]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      inputRef.current?.focus();
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("您的瀏覽器不支援語音輸入功能 (請使用 Chrome 或 Safari)。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening as user spells multiple letters
    recognition.interimResults = true; // Show results immediately
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      playSound.click();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';

      // Combine all results from the session
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }

      // Logic: Strictly keep ONLY letters. Remove spaces, numbers, punctuation.
      // This ensures "A P P L E" becomes "apple".
      const cleanedInput = finalTranscript.replace(/[^a-zA-Z]/g, '').toLowerCase();

      setUserInput(cleanedInput);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (feedback !== 'idle') return;

    stopListening(); // Stop mic when submitting

    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedTarget = currentWord.english.trim().toLowerCase();
    const isCorrect = normalizedInput === normalizedTarget;

    // 1. Play Sound & Set Feedback State
    if (isCorrect) {
      playSound.correct();
      setFeedback('correct');
    } else {
      playSound.wrong();
      setFeedback('wrong');
    }

    // 2. Record Result
    const newResult: QuizResult = {
      word: currentWord,
      userAnswer: userInput,
      isCorrect
    };
    setResults(prev => [...prev, newResult]);

    // 3. Wait for animation, then move to next
    setTimeout(() => {
      if (currentIndex < shuffledWords.length - 1) {
        setFeedback('idle');
        setUserInput('');
        setCurrentIndex(prev => prev + 1);
      } else {
        const endTime = Date.now();
        const durationSeconds = Math.floor((endTime - startTimeRef.current) / 1000);
        onFinish([...results, newResult], durationSeconds);
      }
    }, 1500); // 1.5s delay to see the result
  };

  const handleSpeakAgain = () => {
    if (feedback !== 'idle') return;
    speakWord(currentWord.english, voiceGender, specificVoiceURI, speechRate);
    inputRef.current?.focus();
  };

  const progress = ((currentIndex) / shuffledWords.length) * 100;

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col items-center justify-center w-full">

      {/* Fun Progress Bar */}
      <div className="w-full mb-8 bg-white p-2 rounded-full shadow-md border-2 border-gray-100">
        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-1 px-2">
          <span className="text-xs font-bold text-gray-400">START</span>
          <span className="text-xs font-bold text-orange-500">第 {currentIndex + 1} 題 / 共 {shuffledWords.length} 題</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentWord.id}
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="w-full bg-white rounded-[2rem] shadow-xl p-8 text-center border-b-[12px] border-r-[4px] border-l-[4px] border-t-[4px] border-sky-100 relative overflow-hidden"
        >
          {/* Feedback Overlay */}
          <AnimatePresence>
            {feedback !== 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-sm
                  ${feedback === 'correct' ? 'bg-green-100/80' : 'bg-red-100/80'}
                `}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1.5, rotate: 0 }}
                  className={`p-6 rounded-full shadow-2xl ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  {feedback === 'correct' ? (
                    <Check className="w-16 h-16 text-white stroke-[4]" />
                  ) : (
                    <X className="w-16 h-16 text-white stroke-[4]" />
                  )}
                </motion.div>

                {feedback === 'wrong' && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-6 bg-white px-6 py-3 rounded-xl shadow-lg border-b-4 border-gray-200"
                  >
                    <p className="text-gray-500 text-sm font-bold uppercase">正確答案</p>
                    <p className="text-3xl font-black text-gray-800 tracking-wide">{currentWord.english}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Row: Examiner Badge (Left) & Exit Button (Right) */}
          <div className="flex justify-between items-start absolute top-4 left-4 right-4 z-10">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border
               ${voiceGender === 'female'
                ? 'bg-pink-100 text-pink-600 border-pink-200'
                : 'bg-blue-100 text-blue-600 border-blue-200'}
             `}>
              {voiceGender === 'female' ? '媽媽' : '爸爸'}出題中
            </span>

            <button
              onClick={onExit}
              className="bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 transition-colors border border-red-100"
            >
              <LogOut className="w-3 h-3" /> 離開
            </button>
          </div>

          {/* Audio Button */}
          <div className="mb-4 relative mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSpeakAgain}
              className={`relative inline-flex items-center justify-center w-28 h-28 rounded-full text-white shadow-[0_8px_0_0_#0369a1] active:shadow-none active:translate-y-[8px] transition-all
                ${voiceGender === 'male'
                  ? 'bg-gradient-to-tr from-blue-400 to-indigo-500 shadow-[0_8px_0_0_#1e3a8a]'
                  : 'bg-gradient-to-tr from-pink-400 to-rose-500 shadow-[0_8px_0_0_#be123c]'}
              `}
            >
              <Volume2 className="w-12 h-12" />
              <div className="absolute top-2 right-2 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white">
                <span className="text-yellow-800 font-bold text-[10px]">?</span>
              </div>
            </motion.button>
            <p className="mt-2 text-sky-400 font-bold uppercase tracking-widest text-xs">
              點擊再聽一次
            </p>

            {/* Speed Control - Compact */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => { setSpeechRate(0.5); speakWord(currentWord.english, voiceGender, specificVoiceURI, 0.5); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${speechRate === 0.5 ? 'bg-amber-400 text-white shadow-md' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
              >
                🐢 慢
              </button>
              <button
                onClick={() => { setSpeechRate(0.8); speakWord(currentWord.english, voiceGender, specificVoiceURI, 0.8); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${speechRate === 0.8 ? 'bg-amber-400 text-white shadow-md' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
              >
                正常
              </button>
              <button
                onClick={() => { setSpeechRate(1.0); speakWord(currentWord.english, voiceGender, specificVoiceURI, 1.0); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${speechRate === 1.0 ? 'bg-amber-400 text-white shadow-md' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
              >
                🐇 快
              </button>
            </div>
          </div>

          {/* Hint Card */}
          <div className="mb-8 transform -rotate-1">
            <div className="inline-block px-8 py-3 bg-yellow-100 border-2 border-yellow-300 rounded-xl shadow-sm">
              <span className="text-2xl font-black text-yellow-700">
                {currentWord.chinese}
              </span>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="relative">
              <motion.input
                ref={inputRef}
                animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
                type="text"
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  playSound.click();
                }}
                disabled={feedback !== 'idle' || isListening}
                placeholder={isListening ? "請拼讀字母..." : "輸入英文..."}
                style={{ lineHeight: 1.5 }}
                className={`w-full text-center text-3xl md:text-4xl font-black border-4 border-dashed rounded-2xl outline-none py-5 bg-transparent transition-all placeholder:text-gray-300 placeholder:text-2xl pr-14
                   ${isListening
                    ? 'border-red-400 text-red-600 bg-red-50/50 placeholder:text-red-300'
                    : 'border-gray-300 text-gray-800 focus:border-sky-500 focus:bg-sky-50'}
                `}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                lang="en"
                inputMode="text"
                autoCapitalize="off"
              />

              {/* Voice Input Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all
                  ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                `}
                title="語音拼字輸入"
              >
                {isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <MicOff className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={(!userInput.trim() && !isListening) || feedback !== 'idle'}
              className="w-full py-4 bg-gray-800 hover:bg-black text-white rounded-xl font-bold text-xl shadow-[0_6px_0_0_#374151] active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-[6px] flex items-center justify-center gap-2"
            >
              檢查答案 <ArrowRight className="w-6 h-6" />
            </motion.button>
          </form>

          {isListening && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm font-bold mt-2 animate-pulse"
            >
              正在聆聽... 請唸出單字字母 (例如: A... P... P...)
            </motion.p>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};