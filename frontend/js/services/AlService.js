/**
 * AIService - Frontend AI service for advanced transcript processing
 * OpenRouter API के साथ communication handle करता है
 */
class AIService {
  constructor() {
    this.baseURL = '/api/ai';
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * ADVANCED: Process transcript with AI
   */
  async processTranscript(transcriptEntries, videoId, language = 'en') {
    const cacheKey = `process_${videoId}_${language}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.makeRequest(`${this.baseURL}/process-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          transcriptEntries,
          videoId,
          language
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Cache successful results
        this.cache.set(cacheKey, result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Transcript processing failed');
      }

    } catch (error) {
      console.error('❌ AI transcript processing error:', error);
      throw error;
    }
  }

  /**
   * ADVANCED: Fix transcript with AI
   */
  async fixTranscript(transcriptText, language = 'en', fixType = 'both') {
    try {
      const response = await this.makeRequest(`${this.baseURL}/fix-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          transcriptText,
          language,
          fixType
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Transcript fix failed');
      }

    } catch (error) {
      console.error('❌ AI transcript fix error:', error);
      throw error;
    }
  }

  /**
   * ADVANCED: Analyze phrases in sentence
   */
  async analyzePhrases(sentenceText, sentenceId, context = '') {
    const cacheKey = `phrases_${sentenceId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.makeRequest(`${this.baseURL}/analyze-phrases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          sentenceText,
          sentenceId,
          context
        })
      });

      const result = await response.json();
      
      if (result.success) {
        this.cache.set(cacheKey, result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Phrase analysis failed');
      }

    } catch (error) {
      console.error('❌ AI phrase analysis error:', error);
      throw error;
    }
  }

  /**
   * ADVANCED: Translate text
   */
  async translateText(text, targetLanguage = 'hi', context = '') {
    const cacheKey = `translate_${targetLanguage}_${this.hashString(text)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.makeRequest(`${this.baseURL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          context
        })
      });

      const result = await response.json();
      
      if (result.success) {
        this.cache.set(cacheKey, result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Translation failed');
      }

    } catch (error) {
      console.error('❌ AI translation error:', error);
      throw error;
    }
  }

  /**
   * ADVANCED: Analyze sentence complexity
   */
  async analyzeComplexity(sentenceText) {
    const cacheKey = `complexity_${this.hashString(sentenceText)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.makeRequest(`${this.baseURL}/analyze-complexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          sentenceText
        })
      });

      const result = await response.json();
      
      if (result.success) {
        this.cache.set(cacheKey, result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Complexity analysis failed');
      }

    } catch (error) {
      console.error('❌ AI complexity analysis error:', error);
      throw error;
    }
  }

  /**
   * ADVANCED: Get learning insights
   */
  async getLearningInsights(sentences, videoId) {
    const cacheKey = `insights_${videoId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.makeRequest(`${this.baseURL}/learning-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          sentences,
          videoId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        this.cache.set(cacheKey, result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Learning insights generation failed');
      }

    } catch (error) {
      console.error('❌ AI learning insights error:', error);
      throw error;
    }
  }

  /**
   * ADVANCED: Batch process multiple AI requests
   */
  async batchProcess(requests) {
    return new Promise((resolve, reject) => {
      // Add to queue
      this.requestQueue.push({ requests, resolve, reject });
      
      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Queue processing with rate limiting
   */
  async processQueue() {
    if (this.requestQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const { requests, resolve, reject } = this.requestQueue.shift();

    try {
      // Process in batches of 3 with delay
      const batchSize = 3;
      const results = [];
      
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(req => this.executeSingleRequest(req))
        );
        
        results.push(...batchResults);
        
        // Rate limiting delay
        if (i + batchSize < requests.length) {
          await this.delay(1000);
        }
      }

      resolve(results);
    } catch (error) {
      reject(error);
    }

    // Process next item in queue
    setTimeout(() => this.processQueue(), 500);
  }

  /**
   * Execute single AI request
   */
  async executeSingleRequest(request) {
    const { type, data } = request;
    
    switch (type) {
      case 'process_transcript':
        return await this.processTranscript(data.entries, data.videoId, data.language);
      case 'analyze_phrases':
        return await this.analyzePhrases(data.text, data.sentenceId, data.context);
      case 'translate':
        return await this.translateText(data.text, data.language, data.context);
      case 'analyze_complexity':
        return await this.analyzeComplexity(data.text);
      default:
        throw new Error(`Unknown request type: ${type}`);
    }
  }

  /**
   * Utility Methods
   */
  async makeRequest(url, options) {
    // Add retry logic
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          const waitTime = attempt * 2000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms...`);
          await this.delay(waitTime);
          continue;
        }
        
        return response;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.warn(`🔄 Request failed (attempt ${attempt}), retrying...`);
        await this.delay(1000 * attempt);
      }
    }
  }

  getAuthToken() {
    // Get token from localStorage or auth context
    return localStorage.getItem('authToken') || '';
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cache management
   */
  clearCache(pattern = null) {
    if (pattern) {
      // Clear specific pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      hits: this.cacheHits || 0,
      misses: this.cacheMisses || 0
    };
  }

  /**
   * Performance monitoring
   */
  startPerformanceMonitor() {
    this.performanceMetrics = {
      startTime: Date.now(),
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0
    };
  }

  recordPerformanceMetric(duration, success = true) {
    if (!this.performanceMetrics) return;
    
    this.performanceMetrics.requestCount++;
    if (success) {
      this.performanceMetrics.successCount++;
    } else {
      this.performanceMetrics.errorCount++;
    }
    
    // Update average response time
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime * (this.performanceMetrics.requestCount - 1) + duration) 
      / this.performanceMetrics.requestCount;
  }

  getPerformanceReport() {
    if (!this.performanceMetrics) return null;
    
    const uptime = Date.now() - this.performanceMetrics.startTime;
    const successRate = (this.performanceMetrics.successCount / this.performanceMetrics.requestCount) * 100;
    
    return {
      uptime: Math.floor(uptime / 1000),
      totalRequests: this.performanceMetrics.requestCount,
      successRate: Math.round(successRate),
      averageResponseTime: Math.round(this.performanceMetrics.averageResponseTime),
      errorCount: this.performanceMetrics.errorCount
    };
  }
}

// Create global instance
window.aiService = new AIService();
