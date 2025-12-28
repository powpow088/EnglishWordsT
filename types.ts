export interface VocabWord {
  id: string;
  team: string;
  lesson: string;
  english: string;
  chinese: string;
}

export interface QuizResult {
  word: VocabWord;
  userAnswer: string;
  isCorrect: boolean;
}

export enum AppScreen {
  SELECTION = 'SELECTION',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT',
}

export interface SpeechConfig {
  rate: number;
  pitch: number;
  volume: number;
}

export type VoiceGender = 'male' | 'female';

export interface QuizSessionResult {
  results: QuizResult[];
  durationSeconds: number;
}