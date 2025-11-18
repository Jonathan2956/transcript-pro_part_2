/**
 * TranscriptManager - Advanced transcript management with AI features
 * Sentences और phrases को intelligently manage करता है
 */
class TranscriptManager {
  constructor() {
    this.currentTranscript = null;
    this.sentences = [];
    this.phrases = [];
    this.currentSentenceIndex = 0;
    this.autoScrollEnabled = true;
    this.aiProcessingEnabled = true;
    
    this.init();
  }

  /**
   * Initialize transcript manager
   */
  init() {
    this.setupEventListeners();
    this.loadUserPreferences();
    console.log('✅ TranscriptManager initialized');
  }

  /**
   * ADVANCED: Load transcript from YouTube captions
   */
  async loadTranscript(transcriptEntries, videoId, language = 'en') {
    try {
      this.showLoadingState('AI transcript processing शुरू हो रहा है...');
      
      // AI processing के लिए transcript भेजें
      const processedTranscript = await window.aiService.processTranscript(
        transcriptEntries, 
        videoId, 
        language
      );

      this.currentTranscript = processedTranscript;
      this.sentences = processedTranscript.sentences || [];
      
      this.renderTranscript();
      this.updateProgressStats();
      this.setupSentenceNavigation();
      
      this.hideLoadingState();
      
      // Learning insights show करें
      this.showLearningInsights(processedTranscript.insights);
      
      console.log('🎯 Transcript loaded successfully:', processedTranscript);
      
    } catch (error) {
      console.error('❌ Transcript loading error:', error);
      this.hideLoadingState();
      this.showError('Transcript load करने में error आया: ' + error.message);
      
      // Fallback: basic transcript display
      this.fallbackTranscriptDisplay(transcriptEntries, videoId);
    }
  }

  /**
   * ADVANCED: Render processed transcript
   */
  renderTranscript() {
    if (!this.sentences || this.sentences.length === 0) {
      this.showEmptyState();
      return;
    }

    const sentencesList = document.getElementById('sentencesList');
    const currentSentenceElement = document.getElementById('currentSentenceOriginal');
    const currentTranslatedElement = document.getElementById('currentSentenceTranslated');
    
    if (!sentencesList) return;

    // Clear existing content
    sentencesList.innerHTML = '';
    
    // Current sentence update करें
    if (currentSentenceElement && this.sentences[0]) {
      currentSentenceElement.textContent = this.sentences[0].originalText;
      currentTranslatedElement.textContent = this.sentences[0].translatedText;
    }

    // All sentences render करें
    this.sentences.forEach((sentence, index) => {
      const sentenceElement = this.createSentenceElement(sentence, index);
      sentencesList.appendChild(sentenceElement);
    });

    // Sentence counter update करें
    this.updateSentenceCounter();
    
    // Auto-scroll setup करें
    if (this.autoScrollEnabled) {
      this.setupAutoScroll();
    }
  }

  /**
   * ADVANCED: Create individual sentence element with AI features
   */
  createSentenceElement(sentence, index) {
    const sentenceDiv = document.createElement('div');
    sentenceDiv.className = `sentence-item ${index === 0 ? 'active' : ''}`;
    sentenceDiv.dataset.sentenceId = sentence.id;
    sentenceDiv.dataset.index = index;
    sentenceDiv.dataset.startTime = sentence.startTime;

    // Complexity badge
    const complexityBadge = this.createComplexityBadge(sentence.complexity);
    
    // Phrases count badge
    const phrasesBadge = sentence.phrases.length > 0 ? 
      `<span class="phrase-count-badge">${sentence.phrases.length} phrases</span>` : '';

    // Pronunciation button
    const pronunciationBtn = `
      <button class="pronunciation-play-btn sentence-pronunciation-btn" 
              data-text="${sentence.originalText}" 
              data-translated="${sentence.translatedText}"
              title="Pronounce sentence">
        🔊
      </button>
    `;

    sentenceDiv.innerHTML = `
      <div class="sentence-content">
        <div class="sentence-header">
          <span class="sentence-number">${index + 1}</span>
          ${complexityBadge}
          ${phrasesBadge}
          <span class="sentence-time">${this.formatTime(sentence.startTime)}</span>
        </div>
        <div class="sentence-text">
          <div class="sentence-text-original">${sentence.originalText}</div>
          <div class="sentence-text-translated">${sentence.translatedText}</div>
        </div>
        ${pronunciationBtn}
      </div>
      <div class="sentence-actions">
        <button class="btn btn-small btn-outline analyze-phrase-btn" 
                data-sentence-id="${sentence.id}">
          Analyze Phrases
        </button>
        <button class="btn btn-small btn-outline save-sentence-btn" 
                data-sentence-id="${sentence.id}">
          Save
        </button>
      </div>
    `;

    // Event listeners add करें
    this.addSentenceEventListeners(sentenceDiv, sentence);
    
    return sentenceDiv;
  }

  /**
   * ADVANCED: Create complexity badge
   */
  createComplexityBadge(complexity) {
    const level = complexity.level || 'A2';
    const score = complexity.complexity_score || 3;
    
    const levelColors = {
      'A1': 'success',
      'A2': 'success', 
      'B1': 'warning',
      'B2': 'warning',
      'C1': 'danger',
      'C2': 'danger'
    };
    
    const color = levelColors[level] || 'secondary';
    
    return `
      <span class="complexity-badge badge-${color}" 
            title="Complexity score: ${score}/10">
        ${level}
      </span>
    `;
  }

  /**
   * ADVANCED: Add event listeners to sentence element
   */
  addSentenceEventListeners(sentenceElement, sentence) {
    // Click event for sentence selection
    sentenceElement.addEventListener('click', (e) => {
      if (!e.target.closest('.sentence-actions')) {
        this.selectSentence(sentenceElement.dataset.index);
      }
    });

    // Pronunciation button
    const pronunciationBtn = sentenceElement.querySelector('.sentence-pronunciation-btn');
    pronunciationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.pronounceSentence(sentence);
    });

    // Analyze phrases button
    const analyzeBtn = sentenceElement.querySelector('.analyze-phrase-btn');
    analyzeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.analyzeSentencePhrases(sentence);
    });

    // Save sentence button
    const saveBtn = sentenceElement.querySelector('.save-sentence-btn');
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.saveSentence(sentence);
    });
  }

  /**
   * ADVANCED: Select sentence and update UI
   */
  selectSentence(index) {
    const previousActive = document.querySelector('.sentence-item.active');
    if (previousActive) {
      previousActive.classList.remove('active');
    }

    const newActive = document.querySelector(`.sentence-item[data-index="${index}"]`);
    if (newActive) {
      newActive.classList.add('active');
      
      // Scroll to sentence
      if (this.autoScrollEnabled) {
        newActive.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    this.currentSentenceIndex = parseInt(index);
    this.updateCurrentSentenceDisplay();
    this.updatePhraseBreakdown(this.sentences[index]);
    
    console.log(`🎯 Sentence selected: ${index + 1}/${this.sentences.length}`);
  }

  /**
   * ADVANCED: Update current sentence display
   */
  updateCurrentSentenceDisplay() {
    const currentSentence = this.sentences[this.currentSentenceIndex];
    if (!currentSentence) return;

    const originalElement = document.getElementById('currentSentenceOriginal');
    const translatedElement = document.getElementById('currentSentenceTranslated');
    
    if (originalElement) originalElement.textContent = currentSentence.originalText;
    if (translatedElement) translatedElement.textContent = currentSentence.translatedText;
    
    this.updateSentenceCounter();
  }

  /**
   * ADVANCED: Update phrase breakdown for selected sentence
   */
  async updatePhraseBreakdown(sentence) {
    const breakdownContainer = document.getElementById('phraseBreakdown');
    const currentPhraseOriginal = document.getElementById('currentPhraseOriginal');
    const currentPhraseTranslated = document.getElementById('currentPhraseTranslated');
    
    if (!breakdownContainer) return;

    // Show loading state
    breakdownContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner-small"></div>
        <p>Analyzing phrases...</p>
      </div>
    `;

    try {
      let phraseAnalysis;
      
      // Use cached phrases or fetch new analysis
      if (sentence.phrases && sentence.phrases.length > 0) {
        phraseAnalysis = {
          sentenceId: sentence.id,
          originalText: sentence.originalText,
          translatedText: sentence.translatedText,
          phrases: sentence.phrases,
          complexity: sentence.complexity,
          learningTips: [
            'Practice these phrases in different contexts',
            'Focus on pronunciation and usage',
            'Try to create your own sentences using these phrases'
          ]
        };
      } else {
        phraseAnalysis = await window.aiService.analyzePhrases(
          sentence.originalText, 
          sentence.id
        );
      }

      // Update current phrase display
      if (currentPhraseOriginal && currentPhraseTranslated) {
        currentPhraseOriginal.textContent = sentence.originalText;
        currentPhraseTranslated.textContent = sentence.translatedText;
      }

      // Render phrase breakdown
      this.renderPhraseBreakdown(phraseAnalysis, breakdownContainer);
      
      // Update phrase metadata
      this.updatePhraseMetadata(phraseAnalysis.phrases);
      
    } catch (error) {
      console.error('❌ Phrase analysis error:', error);
      breakdownContainer.innerHTML = `
        <div class="error-state">
          <p>Phrase analysis failed. Please try again.</p>
          <button class="btn btn-small btn-outline retry-btn">Retry</button>
        </div>
      `;
    }
  }

  /**
   * ADVANCED: Render phrase breakdown
   */
  renderPhraseBreakdown(analysis, container) {
    const { phrases, learningTips } = analysis;
    
    if (!phrases || phrases.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No significant phrases found in this sentence.</p>
        </div>
      `;
      return;
    }

    let phrasesHTML = '';
    
    phrases.forEach((phrase, index) => {
      const difficultyClass = `difficulty-${phrase.difficulty || 'medium'}`;
      
      phrasesHTML += `
        <div class="phrase-item ${difficultyClass}" data-phrase-index="${index}">
          <div class="phrase-header">
            <span class="phrase-text">"${phrase.phrase}"</span>
            <span class="phrase-type-badge">${phrase.type}</span>
          </div>
          <div class="phrase-meaning">
            <strong>Meaning:</strong> ${phrase.meaning}
          </div>
          <div class="phrase-example">
            <strong>Example:</strong> ${phrase.example}
          </div>
          <div class="phrase-actions">
            <button class="btn btn-small btn-outline pronounce-phrase-btn" 
                    data-phrase="${phrase.phrase}">
              🔊
            </button>
            <button class="btn btn-small btn-outline save-phrase-btn" 
                    data-phrase='${JSON.stringify(phrase)}'>
              Save
            </button>
          </div>
        </div>
      `;
    });

    // Learning tips add करें
    const tipsHTML = learningTips ? `
      <div class="learning-tips">
        <h5>Learning Tips</h5>
        <ul>
          ${learningTips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    container.innerHTML = `
      <div class="phrase-breakdown-content">
        <div class="phrases-list">
          ${phrasesHTML}
        </div>
        ${tipsHTML}
      </div>
    `;

    // Phrase event listeners add करें
    this.addPhraseEventListeners(container);
  }

  /**
   * ADVANCED: Add event listeners to phrases
   */
  addPhraseEventListeners(container) {
    // Pronunciation buttons
    const pronounceBtns = container.querySelectorAll('.pronounce-phrase-btn');
    pronounceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const phrase = e.target.dataset.phrase;
        this.pronouncePhrase(phrase);
      });
    });

    // Save phrase buttons
    const saveBtns = container.querySelectorAll('.save-phrase-btn');
    saveBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const phraseData = JSON.parse(e.target.dataset.phrase);
        this.savePhrase(phraseData);
      });
    });
  }

  /**
   * ADVANCED: Update phrase metadata display
   */
  updatePhraseMetadata(phrases) {
    const phraseTypeElement = document.getElementById('phraseType');
    const phraseDifficultyElement = document.getElementById('phraseDifficulty');
    
    if (!phraseTypeElement || !phrases.length) return;

    // Most common phrase type
    const typeCount = phrases.reduce((acc, phrase) => {
      acc[phrase.type] = (acc[phrase.type] || 0) + 1;
      return acc;
    }, {});

    const mostCommonType = Object.keys(typeCount).reduce((a, b) => 
      typeCount[a] > typeCount[b] ? a : b
    );

    // Average difficulty
    const difficulties = phrases.map(p => p.difficulty);
    const difficultyCount = difficulties.reduce((acc, diff) => {
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    }, {});

    const mostCommonDifficulty = Object.keys(difficultyCount).reduce((a, b) => 
      difficultyCount[a] > difficultyCount[b] ? a : b
    );

    phraseTypeElement.textContent = this.formatPhraseType(mostCommonType);
    phraseDifficultyElement.textContent = this.formatDifficulty(mostCommonDifficulty);
  }

  /**
   * ADVANCED: Show learning insights
   */
  async showLearningInsights(insights) {
    // Insights modal में show करें या sidebar में
    console.log('📊 Learning Insights:', insights);
    
    // आप इसे modal में display कर सकते हैं
    if (window.learningInsightsModal) {
      window.learningInsightsModal.show(insights);
    }
    
    // Progress stats update करें
    this.updateProgressStats(insights);
  }

  /**
   * ADVANCED: Update progress statistics
   */
  updateProgressStats(insights = null) {
    const stats = insights || this.currentTranscript?.insights;
    if (!stats) return;

    const statsContainer = document.getElementById('progressStats');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${stats.totalSentences}</div>
          <div class="stat-label">Sentences</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.totalWords}</div>
          <div class="stat-label">Words</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.totalPhrases}</div>
          <div class="stat-label">Phrases</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.mostCommonDifficulty}</div>
          <div class="stat-label">Level</div>
        </div>
      </div>
    `;
  }

  /**
   * Utility Methods
   */
  setupEventListeners() {
    // Auto-scroll toggle
    const autoScrollToggle = document.getElementById('autoScrollToggle');
    if (autoScrollToggle) {
      autoScrollToggle.addEventListener('click', () => {
        this.toggleAutoScroll();
      });
    }

    // AI fix button
    const aiFixBtn = document.getElementById('aiFixBtn');
    if (aiFixBtn) {
      aiFixBtn.addEventListener('click', () => {
        this.showAIFixModal();
      });
    }

    // Window event listeners
    window.addEventListener('videoTimeUpdate', (e) => {
      this.handleVideoTimeUpdate(e.detail.currentTime);
    });
  }

  handleVideoTimeUpdate(currentTime) {
    if (!this.sentences.length) return;

    // Find current sentence based on time
    const currentSentence = this.sentences.find((sentence, index) => {
      const nextSentence = this.sentences[index + 1];
      return currentTime >= sentence.startTime && 
             (!nextSentence || currentTime < nextSentence.startTime);
    });

    if (currentSentence) {
      const sentenceIndex = this.sentences.indexOf(currentSentence);
      if (sentenceIndex !== this.currentSentenceIndex) {
        this.selectSentence(sentenceIndex);
      }
    }
  }

  toggleAutoScroll() {
    this.autoScrollEnabled = !this.autoScrollEnabled;
    
    const toggleBtn = document.getElementById('autoScrollToggle');
    if (toggleBtn) {
      toggleBtn.textContent = `Auto-scroll: ${this.autoScrollEnabled ? 'ON' : 'OFF'}`;
      toggleBtn.classList.toggle('btn-success', this.autoScrollEnabled);
      toggleBtn.classList.toggle('btn-secondary', !this.autoScrollEnabled);
    }
  }

  setupAutoScroll() {
    // Auto-scroll logic video playback के साथ sync में
    console.log('🔄 Auto-scroll enabled');
  }

  setupSentenceNavigation() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectSentence(Math.min(this.currentSentenceIndex + 1, this.sentences.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectSentence(Math.max(this.currentSentenceIndex - 1, 0));
      }
    });
  }

  pronounceSentence(sentence) {
    if (window.pronunciationService) {
      const language = window.dualWindowManager?.pronunciationLanguage?.sentence || 'auto';
      window.pronunciationService.speakText(sentence.originalText, language, 'original');
    }
  }

  pronouncePhrase(phrase) {
    if (window.pronunciationService) {
      const language = window.dualWindowManager?.pronunciationLanguage?.phrase || 'auto';
      window.pronunciationService.speakText(phrase, language, 'original');
    }
  }

  async analyzeSentencePhrases(sentence) {
    try {
      const analysis = await window.aiService.analyzePhrases(sentence.originalText, sentence.id);
      this.showPhraseAnalysisModal(analysis);
    } catch (error) {
      this.showError('Phrase analysis failed: ' + error.message);
    }
  }

  saveSentence(sentence) {
    // Vocabulary manager को sentence save करने के लिए call करें
    if (window.vocabularyManager) {
      window.vocabularyManager.saveSentence(sentence);
    }
  }

  savePhrase(phraseData) {
    // Vocabulary manager को phrase save करने के लिए call करें
    if (window.vocabularyManager) {
      window.vocabularyManager.savePhrase(phraseData);
    }
  }

  showAIFixModal() {
    // AI fix modal show करें
    if (window.aiFixModal) {
      window.aiFixModal.show(this.currentTranscript);
    }
  }

  showPhraseAnalysisModal(analysis) {
    // Detailed phrase analysis modal show करें
    console.log('🔍 Phrase Analysis:', analysis);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatPhraseType(type) {
    const typeMap = {
      'idiom': 'Idiom',
      'expression': 'Expression',
      'phrasal_verb': 'Phrasal Verb',
      'collocation': 'Collocation',
      'common_phrase': 'Common Phrase'
    };
    return typeMap[type] || type;
  }

  formatDifficulty(difficulty) {
    const difficultyMap = {
      'easy': 'Easy',
      'medium': 'Medium',
      'hard': 'Hard'
    };
    return difficultyMap[difficulty] || difficulty;
  }

  updateSentenceCounter() {
    const counterElement = document.getElementById('sentenceCounter');
    if (counterElement) {
      counterElement.textContent = 
        `Sentence ${this.currentSentenceIndex + 1}/${this.sentences.length}`;
        }
      
  showLoadingState(message) {
    // Loading state show करें
    const loadingElement = document.getElementById('transcriptLoading');
    if (loadingElement) {
      loadingElement.style.display = 'block';
      loadingElement.textContent = message;
    }
  }

  hideLoadingState() {
    const loadingElement = document.getElementById('transcriptLoading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }

  showError(message) {
    // Error message show करें
    console.error('❌ Transcript Error:', message);
    // आप toast notification या error modal use कर सकते हैं
  }

  showEmptyState() {
    const sentencesList = document.getElementById('sentencesList');
    if (sentencesList) {
      sentencesList.innerHTML = `
        <div class="empty-state">
          <p>No sentences available for this video.</p>
        </div>
      `;
    }
  }

  loadUserPreferences() {
    // User preferences load करें
    const savedAutoScroll = localStorage.getItem('autoScrollEnabled');
    if (savedAutoScroll !== null) {
      this.autoScrollEnabled = savedAutoScroll === 'true';
    }
  }

  fallbackTranscriptDisplay(transcriptEntries, videoId) {
    // Basic transcript display without AI processing
    this.sentences = transcriptEntries.map((entry, index) => ({
      id: `sentence_${index}`,
      originalText: entry.text,
      translatedText: entry.text,
      startTime: entry.start,
      duration: entry.duration,
      phrases: [],
      complexity: { level: 'A2', complexity_score: 3 },
      wordCount: entry.text.split(' ').length,
      characterCount: entry.text.length,
      hasIdioms: false
    }));

    this.renderTranscript();
  }
}

// Create global instance
window.transcriptManager = new TranscriptManager();
