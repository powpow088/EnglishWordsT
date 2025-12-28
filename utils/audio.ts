// Simple synth sound effects using Web Audio API to avoid external assets
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(audioCtx.currentTime + startTime);
  osc.stop(audioCtx.currentTime + startTime + duration);
};

export const playSound = {
  click: () => {
    playTone(600, 'sine', 0.1);
  },
  correct: () => {
    if (!audioCtx) return;
    // Ding! (High C then Higher E)
    playTone(523.25, 'sine', 0.1, 0); // C5
    playTone(659.25, 'sine', 0.3, 0.1); // E5
  },
  wrong: () => {
    if (!audioCtx) return;
    // Bonk/Buzz
    playTone(150, 'sawtooth', 0.3);
  },
  win: () => {
    if (!audioCtx) return;
    // Arpeggio Fanfare
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      playTone(freq, 'square', 0.2, i * 0.1);
    });
  },
  lose: () => {
    if (!audioCtx) return;
    // Sad slide
    playTone(300, 'triangle', 0.5);
    setTimeout(() => playTone(200, 'triangle', 0.5), 400);
  }
};