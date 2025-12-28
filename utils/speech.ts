// Simple utility to handle browser speech synthesis

export const getAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
};

export const speakWord = (text: string, gender: 'male' | 'female' = 'female', specificVoiceURI?: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Text-to-speech not supported in this browser.");
    return;
  }

  // Cancel any pending speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; // Default base lang
  utterance.rate = 0.8; // Slightly slower for clarity
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  
  let selectedVoice: SpeechSynthesisVoice | undefined;

  // 1. If a specific voice URI is provided (user selected), try to find it
  if (specificVoiceURI) {
    selectedVoice = voices.find(v => v.voiceURI === specificVoiceURI);
  }

  // 2. Fallback Heuristic if no specific voice or specific voice not found
  if (!selectedVoice) {
    if (gender === 'male') {
      // Priority 1: Google UK English Male (User Request)
      selectedVoice = voices.find(v => v.name === 'Google UK English Male');

      // Priority 2: Any en-GB voice that looks like Google Male
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('male'));
      }

      // Priority 3: General Male Keywords
      if (!selectedVoice) {
        const maleKeywords = ['male', 'david', 'daniel'];
        selectedVoice = voices.find(v => 
          v.lang.includes('en') && 
          maleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
        );
      }
    } else {
      // Female Logic
      const femaleKeywords = ['female', 'zira', 'samantha', 'google us english', 'google uk english female'];
      selectedVoice = voices.find(v => 
        v.lang.includes('en') && 
        femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
      );
    }
  }

  // Fallback 3: If specific gender not found, try to find any 'en-US' voice
  if (!selectedVoice) {
     selectedVoice = voices.find(v => v.lang === 'en-US');
  }

  // Fallback 4: Any English voice
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.includes('en'));
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    // Update rate based on voice? Usually Google voices are quite fast, 0.8 is good.
  }

  window.speechSynthesis.speak(utterance);
};