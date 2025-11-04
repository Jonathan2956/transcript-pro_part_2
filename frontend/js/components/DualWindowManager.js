class DualWindowManager {
  constructor() {
    this.pronunciationEnabled = {
      sentence: true,
      phrase: true
    };
    this.pronunciationLanguage = {
      sentence: 'auto',
      phrase: 'auto'
    };
    this.isSpeaking = false;
    
    this.initPronunciation();
  }

  initPronunciation() {
    this.setupPronunciationControls();
    this.setupPronunciationEvents();
    this.loadPronunciationPreferences();
  }

  setupPronunciationControls() {
    const sentencePronunciationBtn = document.getElementById('sentencePronunciationBtn');
    const sentenceLanguageSelect = document.getElementById('sentenceLanguageSelect');
    const phrasePronunciationBtn = document.getElementById('phrasePronunciationBtn');
    const phraseLanguageSelect = document.getElementById('phraseLanguageSelect');

    sentencePronunciationBtn?.addEventListener('click', () => this.togglePronunciation('sentence'));
    phrasePronunciationBtn?.addEventListener('click', () => this.togglePronunciation('phrase'));

    sentenceLanguageSelect?.addEventListener('change', (e) => this.changePronunciationLanguage('sentence', e.target.value));
    phraseLanguageSelect?.addEventListener('change', (e) => this.changePronunciationLanguage('phrase', e.target.value));

    window.addEventListener('pronunciationStateChange', (event) => {
      this.isSpeaking = event.detail.speaking;
      this.updateSpeakingUI();
    });
  }

  setupPronunciationEvents() {
    document.getElementById('sentencesList')?.addEventListener('click', (e) => {
      const pronunciationBtn = e.target.closest('.sentence-pronunciation-btn');
      if (pronunciationBtn) {
        e.stopPropagation();
        this.speakSentenceItem(pronunciationBtn.closest('.sentence-item'));
      }
    });

    document.getElementById('phraseBreakdown')?.addEventListener('click', (e) => {
      const pronunciationBtn = e.target.closest('.phrase-pronunciation-btn');
      if (pronunciationBtn) {
        e.stopPropagation();
        this.speakPhraseItem(pronunciationBtn.closest('.phrase-item'));
      }
    });
  }

  speakSentenceItem(sentenceItem) {
    if (!this.pronunciationEnabled.sentence) return;

    const originalText = sentenceItem.querySelector('.sentence-text-original')?.textContent;
    const translatedText = sentenceItem.querySelector('.sentence-text-translated')?.textContent;
    const language = this.pronunciationLanguage.sentence;

    let textToSpeak = originalText;
    let sourceType = 'original';

    if (language === 'auto') {
      const detectedLang = window.pronunciationService.detectLanguage(originalText);
      if (detectedLang === 'hi' && translatedText) {
        textToSpeak = translatedText;
        sourceType = 'translated';
      }
    } else if (language !== 'hi' && translatedText) {
      textToSpeak = translatedText;
      sourceType = 'translated';
    }

    if (textToSpeak) {
      window.pronunciationService.speakText(textToSpeak, language, sourceType);
    }
  }

  speakPhraseItem(phraseItem) {
    if (!this.pronunciationEnabled.phrase) return;

    const originalText = phraseItem.querySelector('.phrase-text-original')?.textContent;
    const translatedText = phraseItem.querySelector('.phrase-text-translated')?.textContent;
    const language = this.pronunciationLanguage.phrase;

    let textToSpeak = originalText;
    let sourceType = 'original';

    if (language === 'auto') {
      const detectedLang = window.pronunciationService.detectLanguage(originalText);
      if (detectedLang === 'hi' && translatedText) {
        textToSpeak = translatedText;
        sourceType = 'translated';
      }
    } else if (language !== 'hi' && translatedText) {
      textToSpeak = translatedText;
      sourceType = 'translated';
    }

    if (textToSpeak) {
      window.pronunciationService.speakText(textToSpeak, language, sourceType);
    }
  }

  togglePronunciation(type) {
    this.pronunciationEnabled[type] = !this.pronunciationEnabled[type];
    this.updatePronunciationButton(type);
    this.savePronunciationPreferences();
    
    if (!this.pronunciationEnabled[type]) {
      window.pronunciationService.stopSpeaking();
    }
  }

  changePronunciationLanguage(type, language) {
    this.pronunciationLanguage[type] = language;
    this.savePronunciationPreferences();
  }

  updatePronunciationButton(type) {
    const button = document.getElementById(`${type}PronunciationBtn`);
    const icon = button?.querySelector('.pronunciation-icon');
    
    if (button && icon) {
      if (this.pronunciationEnabled[type]) {
        button.classList.remove('muted');
        icon.textContent = '🔊';
        button.title = 'Pronunciation On';
      } else {
        button.classList.add('muted');
        icon.textContent = '🔇';
        button.title = 'Pronunciation Off';
      }
    }
  }

  updateSpeakingUI() {
    const buttons = document.querySelectorAll('.pronunciation-btn');
    buttons.forEach(button => {
      if (this.isSpeaking) {
        button.classList.add('speaking');
      } else {
        button.classList.remove('speaking');
      }
    });
  }

  async loadPronunciationPreferences() {
    try {
      const saved = localStorage.getItem('pronunciationPreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        this.pronunciationEnabled = preferences.enabled || this.pronunciationEnabled;
        this.pronunciationLanguage = preferences.language || this.pronunciationLanguage;
      }

      this.updatePronunciationButton('sentence');
      this.updatePronunciationButton('phrase');
      
      const sentenceSelect = document.getElementById('sentenceLanguageSelect');
      const phraseSelect = document.getElementById('phraseLanguageSelect');
      
      if (sentenceSelect) sentenceSelect.value = this.pronunciationLanguage.sentence;
      if (phraseSelect) phraseSelect.value = this.pronunciationLanguage.phrase;

    } catch (error) {
      console.error('Error loading pronunciation preferences:', error);
    }
  }

  async savePronunciationPreferences() {
    try {
      const preferences = {
        enabled: this.pronunciationEnabled,
        language: this.pronunciationLanguage
      };
      
      localStorage.setItem('pronunciationPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving pronunciation preferences:', error);
    }
  }

  destroy() {
    window.pronunciationService.stopSpeaking();
    window.removeEventListener('pronunciationStateChange', this.updateSpeakingUI);
  }
  }
