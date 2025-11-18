const axios = require('axios');

/**
 * OpenRouterService - Advanced AI processing with multiple free models
 * OpenAI के बदले OpenRouter के free models use करता है
 */
class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.models = {
      // Free models with their specific strengths
      MISTRAL: 'mistralai/mistral-7b-instruct:free',
      LLAMA2: 'meta-llama/llama-2-13b-chat:free',
      GEMMA: 'google/gemma-7b-it:free',
      HERMES: 'nousresearch/nous-hermes-2-mixtral-8x7b-sft:free'
    };
  }

  /**
   * Select best model based on task type
   */
  selectModel(taskType) {
    const modelMap = {
      'transcript_fix': this.models.HERMES,    // Best for text correction
      'sentence_split': this.models.MISTRAL,   // Fast for segmentation
      'phrase_extract': this.models.LLAMA2,    // Good for language understanding
      'translation': this.models.GEMMA,        // Good for multilingual tasks
      'analysis': this.models.HERMES           // Best for complex analysis
    };
    
    return modelMap[taskType] || this.models.MISTRAL;
  }

  /**
   * Make request to OpenRouter API
   */
  async makeRequest(messages, taskType = 'transcript_fix', maxTokens = 2000) {
    try {
      const model = this.selectModel(taskType);
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.3,
        top_p: 0.9,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'TranscriptPro AI'
        },
        timeout: 30000
      });

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('❌ OpenRouter API Error:', error.response?.data || error.message);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  /**
   * ADVANCED: Fix transcript with AI - sentences separation, punctuation, formatting
   */
  async fixTranscript(transcriptText, language = 'en') {
    const prompt = [
      {
        role: "system",
        content: `You are a professional transcript editor. Fix the following transcript by:
1. Adding proper punctuation
2. Separating run-on sentences
3. Correcting spelling errors
4. Formatting with proper capitalization
5. Maintaining the original meaning

Return ONLY the corrected transcript without any explanations.`
      },
      {
        role: "user",
        content: `Please fix this transcript:\n\n${transcriptText}`
      }
    ];

    return await this.makeRequest(prompt, 'transcript_fix');
  }

  /**
   * ADVANCED: Separate transcript into individual sentences with timestamps
   */
  async splitIntoSentences(transcriptEntries) {
    const combinedText = transcriptEntries.map(entry => entry.text).join(' ');
    
    const prompt = [
      {
        role: "system",
        content: `You are a language processing expert. Split the following text into proper sentences.
Return ONLY a JSON array where each object has:
- "text": the sentence text
- "start": approximate start time in seconds
- "duration": approximate duration in seconds

Maintain the original timing as much as possible.`
      },
      {
        role: "user", 
        content: `Split this text into sentences:\n\n${combinedText}`
      }
    ];

    const result = await this.makeRequest(prompt, 'sentence_split');
    
    try {
      return JSON.parse(result);
    } catch (error) {
      // Fallback: simple sentence splitting
      return this.fallbackSentenceSplit(transcriptEntries);
    }
  }

  /**
   * ADVANCED: Extract phrases and idioms from sentences
   */
  async extractPhrases(sentenceText, context = '') {
    const prompt = [
      {
        role: "system",
        content: `You are an English language teaching expert. Extract important phrases, idioms, and expressions from the given sentence.
Return ONLY a JSON array where each object has:
- "phrase": the phrase text
- "type": "idiom", "expression", "phrasal_verb", "collocation", or "common_phrase"
- "meaning": brief meaning explanation
- "difficulty": "easy", "medium", or "hard"
- "example": usage example`
      },
      {
        role: "user",
        content: `Sentence: "${sentenceText}"\nContext: "${context}"\n\nExtract important phrases:`
      }
    ];

    const result = await this.makeRequest(prompt, 'phrase_extract');
    
    try {
      return JSON.parse(result);
    } catch (error) {
      return this.fallbackPhraseExtraction(sentenceText);
    }
  }

  /**
   * ADVANCED: Translate text while preserving meaning and context
   */
  async translateText(text, targetLanguage = 'hi', context = '') {
    const languageNames = {
      'hi': 'Hindi',
      'es': 'Spanish', 
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese'
    };

    const prompt = [
      {
        role: "system",
        content: `You are a professional translator. Translate the following text to ${languageNames[targetLanguage]} while:
1. Preserving the original meaning
2. Maintaining natural flow
3. Considering context: ${context}
4. Using appropriate cultural references

Return ONLY the translated text without explanations.`
      },
      {
        role: "user",
        content: `Translate this to ${languageNames[targetLanguage]}:\n\n${text}`
      }
    ];

    return await this.makeRequest(prompt, 'translation');
  }

  /**
   * ADVANCED: Analyze sentence complexity and learning level
   */
  async analyzeComplexity(sentenceText) {
    const prompt = [
      {
        role: "system",
        content: `Analyze the English sentence for language learning difficulty.
Return ONLY a JSON object with:
- "level": "A1", "A2", "B1", "B2", "C1", or "C2"
- "complexity_score": 1-10
- "grammar_points": array of grammar concepts used
- "vocabulary_level": "basic", "intermediate", "advanced"
- "learning_tips": array of 2-3 learning tips`
      },
      {
        role: "user",
        content: `Analyze this sentence: "${sentenceText}"`
      }
    ];

    const result = await this.makeRequest(prompt, 'analysis');
    
    try {
      return JSON.parse(result);
    } catch (error) {
      return this.fallbackComplexityAnalysis(sentenceText);
    }
  }

  /**
   * Fallback methods if AI fails
   */
  fallbackSentenceSplit(transcriptEntries) {
    // Simple sentence splitting logic
    const sentences = [];
    let currentSentence = '';
    let currentStart = transcriptEntries[0]?.start || 0;

    transcriptEntries.forEach((entry, index) => {
      currentSentence += ' ' + entry.text;
      
      // Simple sentence end detection
      if (entry.text.match(/[.!?]/) || index === transcriptEntries.length - 1) {
        sentences.push({
          text: currentSentence.trim(),
          start: currentStart,
          duration: entry.start + entry.duration - currentStart
        });
        
        currentSentence = '';
        currentStart = entry.start + entry.duration;
      }
    });

    return sentences;
  }

  fallbackPhraseExtraction(sentenceText) {
    // Simple phrase extraction based on common patterns
    const phrases = [];
    const words = sentenceText.toLowerCase().split(' ');
    
    // Common phrases pattern matching
    const commonPhrases = [
      { pattern: /how are you/, type: 'common_phrase', meaning: 'Greeting asking about well-being' },
      { pattern: /thank you/, type: 'common_phrase', meaning: 'Expression of gratitude' },
      { pattern: /look forward to/, type: 'phrasal_verb', meaning: 'Anticipate with pleasure' },
      { pattern: /make sense/, type: 'expression', meaning: 'Be understandable or logical' }
    ];

    commonPhrases.forEach(phrase => {
      if (phrase.pattern.test(sentenceText.toLowerCase())) {
        phrases.push({
          phrase: sentenceText.match(phrase.pattern)[0],
          type: phrase.type,
          meaning: phrase.meaning,
          difficulty: 'easy',
          example: `Example: "${sentenceText}"`
        });
      }
    });

    return phrases;
  }

  fallbackComplexityAnalysis(sentenceText) {
    // Simple complexity analysis
    const wordCount = sentenceText.split(' ').length;
    const hasComplexWords = /(\w{8,})/.test(sentenceText);
    
    return {
      level: wordCount > 15 || hasComplexWords ? 'B1' : 'A2',
      complexity_score: wordCount > 15 ? 6 : 3,
      grammar_points: ['basic_sentence_structure'],
      vocabulary_level: hasComplexWords ? 'intermediate' : 'basic',
      learning_tips: ['Practice pronunciation', 'Learn vocabulary in context']
    };
  }
}

module.exports = OpenRouterService;
