const OpenRouterService = require('./OpenRouterService');

/**
 * TranscriptProcessor - Advanced transcript processing with AI
 * Sentences और phrases को intelligent तरीके से process करता है
 */
class TranscriptProcessor {
  constructor() {
    this.aiService = new OpenRouterService();
    this.cache = new Map(); // Simple in-memory cache
  }

  /**
   * ADVANCED: Process raw transcript into structured format
   */
  async processTranscript(transcriptEntries, videoId, language = 'en') {
    try {
      const cacheKey = `transcript_${videoId}_${language}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      console.log(`🔄 Processing transcript for video: ${videoId}`);
      
      // Step 1: Fix transcript with AI
      const combinedText = transcriptEntries.map(entry => entry.text).join(' ');
      const fixedTranscript = await this.aiService.fixTranscript(combinedText, language);
      
      // Step 2: Split into sentences
      const sentences = await this.aiService.splitIntoSentences(transcriptEntries);
      
      // Step 3: Process each sentence for phrases and analysis
      const processedSentences = await this.processSentences(sentences, language);
      
      // Step 4: Generate learning insights
      const insights = await this.generateLearningInsights(processedSentences);

      const result = {
        videoId: videoId,
        language: language,
        originalEntryCount: transcriptEntries.length,
        processedSentenceCount: processedSentences.length,
        sentences: processedSentences,
        insights: insights,
        processedAt: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('❌ Transcript processing error:', error);
      return this.fallbackProcessing(transcriptEntries, videoId, language);
    }
  }

  /**
   * ADVANCED: Process individual sentences with AI analysis
   */
  async processSentences(sentences, language = 'en') {
    const processedSentences = [];

    for (const [index, sentence] of sentences.entries()) {
      try {
        console.log(`📝 Processing sentence ${index + 1}/${sentences.length}`);
        
        // Parallel processing for better performance
        const [phrases, complexity, translation] = await Promise.all([
          this.aiService.extractPhrases(sentence.text),
          this.aiService.analyzeComplexity(sentence.text),
          language !== 'en' ? this.aiService.translateText(sentence.text, language) : null
        ]);

        processedSentences.push({
          id: `sentence_${index}`,
          originalText: sentence.text,
          translatedText: translation || sentence.text,
          startTime: sentence.start,
          duration: sentence.duration,
          phrases: phrases || [],
          complexity: complexity || {},
          wordCount: sentence.text.split(' ').length,
          characterCount: sentence.text.length,
          hasIdioms: phrases?.some(p => p.type === 'idiom') || false
        });

        // Small delay to avoid rate limiting
        await this.delay(100);

      } catch (error) {
        console.error(`❌ Error processing sentence ${index}:`, error);
        
        // Fallback for failed sentence
        processedSentences.push({
          id: `sentence_${index}`,
          originalText: sentence.text,
          translatedText: sentence.text,
          startTime: sentence.start,
          duration: sentence.duration,
          phrases: [],
          complexity: { level: 'A2', complexity_score: 3 },
          wordCount: sentence.text.split(' ').length,
          characterCount: sentence.text.length,
          hasIdioms: false
        });
      }
    }

    return processedSentences;
  }

  /**
   * ADVANCED: Generate learning insights from processed sentences
   */
  async generateLearningInsights(sentences) {
    const totalWords = sentences.reduce((sum, sentence) => sum + sentence.wordCount, 0);
    const totalPhrases = sentences.reduce((sum, sentence) => sum + sentence.phrases.length, 0);
    
    const difficultyLevels = sentences.map(s => s.complexity.level);
    const mostCommonLevel = this.mostFrequent(difficultyLevels);
    
    const allPhrases = sentences.flatMap(s => s.phrases);
    const phraseTypes = allPhrases.reduce((acc, phrase) => {
      acc[phrase.type] = (acc[phrase.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalSentences: sentences.length,
      totalWords: totalWords,
      totalPhrases: totalPhrases,
      averageSentenceLength: Math.round(totalWords / sentences.length),
      difficultyDistribution: this.calculateDifficultyDistribution(difficultyLevels),
      mostCommonDifficulty: mostCommonLevel,
      phraseTypeBreakdown: phraseTypes,
      recommendedFocus: this.getRecommendedFocus(phraseTypes, mostCommonLevel),
      estimatedLearningTime: this.calculateLearningTime(sentences.length, totalPhrases)
    };
  }

  /**
   * ADVANCED: Get AI-powered phrase breakdown for specific sentence
   */
  async getPhraseBreakdown(sentenceId, sentences) {
    const sentence = sentences.find(s => s.id === sentenceId);
    if (!sentence) return null;

    try {
      // Get more detailed phrase analysis
      const detailedPhrases = await this.aiService.extractPhrases(sentence.originalText);
      
      return {
        sentenceId: sentenceId,
        originalText: sentence.originalText,
        translatedText: sentence.translatedText,
        phrases: detailedPhrases,
        complexity: sentence.complexity,
        learningTips: await this.generateSentenceTips(sentence, detailedPhrases)
      };

    } catch (error) {
      console.error('❌ Phrase breakdown error:', error);
      return this.fallbackPhraseBreakdown(sentence);
    }
  }

  /**
   * ADVANCED: Generate personalized learning tips
   */
  async generateSentenceTips(sentence, phrases) {
    const tips = [];

    if (sentence.complexity.level === 'C1' || sentence.complexity.level === 'C2') {
      tips.push('This is an advanced sentence. Focus on nuanced meanings and advanced vocabulary.');
    }

    if (phrases.some(p => p.type === 'idiom')) {
      tips.push('Practice the idioms in different contexts to master their usage.');
    }

    if (sentence.wordCount > 20) {
      tips.push('Break down this long sentence into smaller parts for better understanding.');
    }

    if (phrases.some(p => p.difficulty === 'hard')) {
      tips.push('The difficult phrases in this sentence are worth memorizing for advanced fluency.');
    }

    // Add AI-generated tips
    try {
      const aiTips = await this.aiService.makeRequest([
        {
          role: "system",
          content: "Provide 2-3 specific learning tips for this English sentence for language learners."
        },
        {
          role: "user",
          content: `Sentence: "${sentence.originalText}"\nComplexity: ${sentence.complexity.level}\nPhrases: ${JSON.stringify(phrases)}`
        }
      ], 'analysis', 500);

      tips.push(...aiTips.split('\n').filter(tip => tip.trim()));
    } catch (error) {
      // Fallback tips
      tips.push('Listen to the sentence multiple times for better pronunciation.');
      tips.push('Try to use the new vocabulary in your own sentences.');
    }

    return tips.slice(0, 3); // Return max 3 tips
  }

  /**
   * Utility methods
   */
  mostFrequent(array) {
    return array.reduce((a, b, i, arr) => 
      (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b), null);
  }

  calculateDifficultyDistribution(levels) {
    const distribution = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    levels.forEach(level => distribution[level]++);
    return distribution;
  }

  getRecommendedFocus(phraseTypes, difficultyLevel) {
    const focuses = [];
    
    if (phraseTypes.idiom > 5) focuses.push('Idioms and expressions');
    if (phraseTypes.phrasal_verb > 3) focuses.push('Phrasal verbs');
    if (difficultyLevel === 'A1' || difficultyLevel === 'A2') focuses.push('Basic sentence structures');
    if (difficultyLevel === 'B1' || difficultyLevel === 'B2') focuses.push('Complex grammar patterns');
    if (difficultyLevel === 'C1' || difficultyLevel === 'C2') focuses.push('Advanced vocabulary and nuance');

    return focuses.length > 0 ? focuses : ['General vocabulary and grammar'];
  }

  calculateLearningTime(sentenceCount, phraseCount) {
    const baseTime = sentenceCount * 2; // 2 minutes per sentence
    const phraseTime = phraseCount * 1; // 1 minute per phrase
    return Math.round((baseTime + phraseTime) / 60); // Return in hours
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fallback processing if AI fails
   */
  fallbackProcessing(transcriptEntries, videoId, language) {
    console.log('🔄 Using fallback transcript processing');
    
    const sentences = transcriptEntries.map((entry, index) => ({
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

    return {
      videoId: videoId,
      language: language,
      originalEntryCount: transcriptEntries.length,
      processedSentenceCount: sentences.length,
      sentences: sentences,
      insights: {
        totalSentences: sentences.length,
        totalWords: sentences.reduce((sum, s) => sum + s.wordCount, 0),
        totalPhrases: 0,
        averageSentenceLength: 0,
        difficultyDistribution: { A1: 0, A2: sentences.length, B1: 0, B2: 0, C1: 0, C2: 0 },
        mostCommonDifficulty: 'A2',
        phraseTypeBreakdown: {},
        recommendedFocus: ['Basic vocabulary and sentence structure'],
        estimatedLearningTime: Math.round(sentences.length * 2 / 60)
      },
      processedAt: new Date().toISOString()
    };
  }

  fallbackPhraseBreakdown(sentence) {
    return {
      sentenceId: sentence.id,
      originalText: sentence.originalText,
      translatedText: sentence.translatedText,
      phrases: sentence.phrases,
      complexity: sentence.complexity,
      learningTips: [
        'Practice reading this sentence aloud for better pronunciation.',
        'Try to memorize any new vocabulary words from this sentence.',
        'Use this sentence as a template to create your own sentences.'
      ]
    };
  }

  /**
   * Clear cache for specific video
   */
  clearCache(videoId, language = 'en') {
    const cacheKey = `transcript_${videoId}_${language}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = TranscriptProcessor;
