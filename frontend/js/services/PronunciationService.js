class PronunciationService {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.isEnabled = true;
    this.defaultLanguage = 'auto';
  }

  detectLanguage(text) {
    if (!text) return 'en';
    
    const hindiRegex = /[\u0900-\u097F]/;
    const hasHindi = hindiRegex.test(text);
    const englishRegex = /[a-zA-Z]/;
    const hasEnglish = englishRegex.test(text);
    
    if (hasHindi && !hasEnglish) return 'hi';
    if (hasEnglish && !hasHindi) return 'en';
    
    const hindiCount = (text.match(hindiRegex) || []).length;
    const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
    
    return hindiCount >= englishCount ? 'hi' : 'en';
  }

  speakText(text, language = 'auto', sourceType = 'original') {
    if (!this.isEnabled || !text || !this.speechSynthesis) {
      return;
    }

    this.stopSpeaking();

    let langToUse = language;
    
    if (language === 'auto') {
      langToUse = this.detectLanguage(text);
      
      if (sourceType === 'original' && langToUse === 'hi') {
        console.log('Hindi content detected, skipping pronunciation for original text');
        return;
      }
    }

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = this.getLanguageCode(langToUse);
    this.currentUtterance.rate = 0.8;
    this.currentUtterance.pitch = 1;
    this.currentUtterance.volume = 1;

    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
      this.updateSpeakingState(false);
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.currentUtterance = null;
      this.updateSpeakingState(false);
    };

    this.speechSynthesis.speak(this.currentUtterance);
    this.updateSpeakingState(true);
  }

  getLanguageCode(language) {
    const languageMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };
    return languageMap[language] || 'en-US';
  }

  stopSpeaking() {
    if (this.speechSynthesis && this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.updateSpeakingState(false);
  }

  isSpeaking() {
    return this.speechSynthesis && this.speechSynthesis.speaking;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
    }
  }

  setDefaultLanguage(language) {
    this.defaultLanguage = language;
  }

  updateSpeakingState(speaking) {
    const event = new CustomEvent('pronunciationStateChange', {
      detail: { speaking }
    });
    window.dispatchEvent(event);
  }
}

window.pronunciationService = new PronunciationService();
