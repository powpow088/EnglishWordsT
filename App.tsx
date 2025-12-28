import React, { useState } from 'react';
import { AppScreen, VocabWord, QuizResult, VoiceGender } from './types';
import { SelectionScreen } from './components/SelectionScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { playSound } from './utils/audio';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.SELECTION);
  const [selectedWords, setSelectedWords] = useState<VocabWord[]>([]);
  const [selectedGender, setSelectedGender] = useState<VoiceGender>('female');
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>(undefined);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [quizDuration, setQuizDuration] = useState<number>(0);

  const startQuiz = (words: VocabWord[], gender: VoiceGender, voiceURI?: string) => {
    playSound.click();
    setSelectedWords(words);
    setSelectedGender(gender);
    setSelectedVoiceURI(voiceURI);
    setScreen(AppScreen.QUIZ);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  };

  const finishQuiz = (results: QuizResult[], duration: number) => {
    setQuizResults(results);
    setQuizDuration(duration);
    setScreen(AppScreen.RESULT);
  };

  const restartApp = () => {
    playSound.click();
    setSelectedWords([]);
    setQuizResults([]);
    setQuizDuration(0);
    setScreen(AppScreen.SELECTION);
  };

  return (
    // Fun Background with a pattern
    <div className="min-h-screen font-sans text-gray-800 bg-sky-100 flex flex-col"
         style={{
           backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px), radial-gradient(#ffffff 2px, transparent 2px)`,
           backgroundSize: '32px 32px',
           backgroundPosition: '0 0, 16px 16px',
           backgroundColor: '#e0f2fe' // Sky 100
         }}>
      
      {/* Main Content Area - Full Height centered */}
      <main className="flex-1 w-full max-w-4xl mx-auto py-4 md:py-8 flex flex-col justify-center">
        {screen === AppScreen.SELECTION && (
          <SelectionScreen onStartQuiz={startQuiz} />
        )}
        
        {screen === AppScreen.QUIZ && (
          <QuizScreen 
            words={selectedWords} 
            voiceGender={selectedGender} 
            specificVoiceURI={selectedVoiceURI}
            onFinish={finishQuiz}
            onExit={restartApp}
          />
        )}

        {screen === AppScreen.RESULT && (
          <ResultScreen results={quizResults} duration={quizDuration} onRestart={restartApp} />
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sky-800/50 font-bold text-xs md:text-sm">
        <p>持續練習，成為單字大師！</p>
      </footer>
    </div>
  );
}