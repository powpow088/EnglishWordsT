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

export const speakWord = (text: string, gender: 'male' | 'female' = 'female', specificVoiceURI?: string, speechRate: number = 0.8) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Text-to-speech not supported in this browser.");
    return;
  }

  // Cancel any pending speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; // Default base lang
  utterance.rate = speechRate; // Adjustable rate (0.5 = slow, 1.0 = normal, 1.5 = fast)
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();

  let selectedVoice: SpeechSynthesisVoice | undefined;
  let foundMaleVoice = false;

  // 1. If a specific voice URI is provided (user selected), try to find it
  if (specificVoiceURI) {
    selectedVoice = voices.find(v => v.voiceURI === specificVoiceURI);
    if (selectedVoice) foundMaleVoice = true;
  }

  // 2. Fallback Heuristic if no specific voice or specific voice not found
  if (!selectedVoice) {
    if (gender === 'male') {
      // Extended male keywords including iOS/Android voices
      const maleKeywords = [
        'male',
        // Windows
        'david', 'daniel', 'mark', 'guy', 'ryan', 'andrew', 'christopher', 'eric', 'george', 'roger', 'sean', 'brian', 'matthew',
        // iOS/macOS
        'alex', 'fred', 'tom', 'junior', 'ralph', 'albert', 'bruce',
        // Google/Android
        'james'
      ];

      // Try to find any voice matching male keywords
      selectedVoice = voices.find(v =>
        v.lang.includes('en') &&
        maleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
      );

      if (selectedVoice) foundMaleVoice = true;
    } else {
      // Female Logic
      const femaleKeywords = ['female', 'zira', 'samantha', 'google us english', 'google uk english female', 'victoria', 'karen', 'moira', 'fiona'];
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
  }

  // If male was requested but no male voice was found, lower the pitch to simulate male voice
  if (gender === 'male' && !foundMaleVoice) {
    utterance.pitch = 0.7; // Lower pitch for male-like sound
  }

  window.speechSynthesis.speak(utterance);
};