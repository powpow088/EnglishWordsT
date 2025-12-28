import React, { useEffect } from 'react';
import { QuizResult } from '../types';
import { motion } from 'framer-motion';
import { RefreshCcw, Check, X, Trophy, Frown, Star, PartyPopper, Clock } from 'lucide-react';
import { playSound } from '../utils/audio';

interface ResultScreenProps {
  results: QuizResult[];
  duration: number;
  onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ results, duration, onRestart }) => {
  const correctCount = results.filter(r => r.isCorrect).length;
  const total = results.length;
  const percentage = Math.round((correctCount / total) * 100);

  const isPerfect = percentage === 100;
  const isBad = percentage < 80;

  useEffect(() => {
    if (isPerfect) playSound.win();
    else if (isBad) playSound.lose();
  }, [isPerfect, isBad]);

  // Format time
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeString = `${minutes > 0 ? `${minutes}分 ` : ''}${seconds}秒`;

  // Floating particles
  const particles = Array.from({ length: 20 });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8 pb-20 relative overflow-hidden">
      
      {/* Background Confetti for perfect score */}
      {isPerfect && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((_, i) => (
             <motion.div
               key={i}
               initial={{ y: -100, x: Math.random() * 400 - 200, rotate: 0 }}
               animate={{ y: 800, rotate: 360 }}
               transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2, ease: "linear" }}
               className="absolute top-0 left-1/2 w-4 h-4 rounded-sm"
               style={{
                 backgroundColor: ['#ff0', '#f0f', '#0ff', '#0f0'][i % 4]
               }}
             />
          ))}
        </div>
      )}

      {/* Score Card */}
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className={`
          relative rounded-[2.5rem] p-8 text-center shadow-2xl border-b-[12px] overflow-hidden
          ${isPerfect ? 'bg-yellow-400 border-yellow-600' : ''}
          ${isBad ? 'bg-red-400 border-red-600' : ''}
          ${!isPerfect && !isBad ? 'bg-sky-400 border-sky-600' : ''}
        `}
      >
        <div className="relative z-10 space-y-4 text-white">
          <motion.div 
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex justify-center mb-6"
          >
            {isPerfect ? (
              <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm">
                <Trophy className="w-24 h-24 text-white drop-shadow-md" />
              </div>
            ) : isBad ? (
              <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm">
                <Frown className="w-24 h-24 text-white drop-shadow-md" />
              </div>
            ) : (
              <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm">
                <Star className="w-24 h-24 text-white drop-shadow-md" />
              </div>
            )}
          </motion.div>
          
          <h2 className="text-6xl font-black drop-shadow-sm">{percentage}%</h2>
          <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm space-y-2">
            <p className="text-2xl font-bold">
              {isPerfect && "滿分！太棒了！"}
              {isBad && "別灰心，再接再厲！"}
              {!isPerfect && !isBad && "做得好！"}
            </p>
            <div className="flex flex-col gap-1 items-center justify-center">
              <p className="text-lg opacity-90">
                你答對了 <span className="font-black text-3xl">{correctCount}</span> / {total} 題
              </p>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm font-bold">
                <Clock className="w-4 h-4" /> 總用時: {timeString}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Review List */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-2 bg-orange-400 rounded-full"></div>
            <h3 className="text-2xl font-black text-gray-800">任務報告</h3>
        </div>
        
        <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 overflow-hidden">
          {results.map((res, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`
                p-4 flex items-center justify-between border-b last:border-0
                ${res.isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center shadow-sm
                  ${res.isCorrect ? 'bg-green-400 text-white' : 'bg-red-400 text-white'}
                `}>
                  {res.isCorrect ? <Check className="w-6 h-6 stroke-[3]" /> : <X className="w-6 h-6 stroke-[3]" />}
                </div>
                <div>
                  <p className="font-black text-gray-800 text-lg">{res.word.english}</p>
                  <p className="text-sm font-bold text-gray-400">{res.word.chinese}</p>
                </div>
              </div>
              
              {!res.isCorrect && (
                 <div className="text-right bg-white px-3 py-1 rounded-lg border border-red-100 shadow-sm">
                   <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">你的答案</p>
                   <p className="text-red-500 font-bold font-mono decoration-2 line-through decoration-red-300">
                     {res.userAnswer || "..."}
                   </p>
                 </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Restart Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRestart}
        className="w-full py-5 bg-white border-4 border-sky-200 text-sky-600 hover:bg-sky-50 hover:border-sky-300 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 shadow-lg"
      >
        <RefreshCcw className="w-6 h-6 stroke-[3]" />
        再玩一次
      </motion.button>

    </div>
  );
};