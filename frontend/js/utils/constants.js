/**
 * Constants - Application-wide constants and configuration
 * सभी constants और configuration values एक जगह पर
 */

const Constants = {
  // Application Information
  APP: {
    NAME: 'TranscriptPro',
    VERSION: '1.0.0',
    DESCRIPTION: 'AI-Powered Language Learning with YouTube Videos',
    AUTHOR: 'TranscriptPro Team',
    REPOSITORY: 'https://github.com/your-username/transcript-pro'
  },

  // API Configuration
  API: {
    BASE_URL: process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://localhost:5000/api',
    
    ENDPOINTS: {
      // Authentication
      AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        PROFILE: '/auth/profile'
      },
      
      // YouTube
      YOUTUBE: {
        VIDEO: '/youtube/video',
        CAPTIONS: '/youtube/captions',
        SEARCH: '/youtube/search',
        CHANNEL: '/youtube/channel',
        PLAYLIST: '/youtube/playlist',
        PRONUNCIATION_PREFERENCES: '/youtube/pronunciation-preferences'
      },
      
      // AI Processing
      AI: {
        PROCESS_TRANSCRIPT: '/ai/process-transcript',
        FIX_TRANSCRIPT: '/ai/fix-transcript',
        ANALYZE_PHRASES: '/ai/analyze-phrases',
        TRANSLATE: '/ai/translate',
        ANALYZE_COMPLEXITY: '/ai/analyze-complexity',
        LEARNING_INSIGHTS: '/ai/learning-insights'
      },
      
      // Transcripts
      TRANSCRIPTS: {
        BASE: '/transcripts',
        SAVE: '/transcripts/save',
        LIST: '/transcripts/list',
        DELETE: '/transcripts/delete'
      },
      
      // Vocabulary
      VOCABULARY: {
        BASE: '/vocabulary',
        SAVE_WORD: '/vocabulary/word',
        SAVE_PHRASE: '/vocabulary/phrase',
        LIST: '/vocabulary/list',
        REVIEW: '/vocabulary/review'
      },
      
      // Progress
      PROGRESS: {
        BASE: '/progress',
        STATS: '/progress/stats',
        UPDATE: '/progress/update',
        HISTORY: '/progress/history'
      }
    },
    
    // Request Timeouts
    TIMEOUTS: {
      DEFAULT: 10000, // 10 seconds
      UPLOAD: 30000, // 30 seconds
      AI_PROCESSING: 60000 // 60 seconds
    },
    
    // Rate Limiting
    RATE_LIMITING: {
      MAX_REQUESTS: 1000,
      WINDOW_MS: 900000 // 15 minutes
    }
  },

  // YouTube Configuration
  YOUTUBE: {
    // Player parameters
    PLAYER: {
      WIDTH: '100%',
      HEIGHT: '360',
      AUTOPLAY: 0,
      CONTROLS: 1,
      MODESTBRANDING: 1,
      REL: 0,
      SHOW_INFO: 0
    },
    
    // Supported languages for captions
    LANGUAGES: [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
      { code: 'es', name: 'Spanish', native: 'Español' },
      { code: 'fr', name: 'French', native: 'Français' },
      { code: 'de', name: 'German', native: 'Deutsch' },
      { code: 'it', name: 'Italian', native: 'Italiano' },
      { code: 'pt', name: 'Portuguese', native: 'Português' },
      { code: 'ru', name: 'Russian', native: 'Русский' },
      { code: 'ja', name: 'Japanese', native: '日本語' },
      { code: 'ko', name: 'Korean', native: '한국어' },
      { code: 'zh', name: 'Chinese', native: '中文' },
      { code: 'ar', name: 'Arabic', native: 'العربية' }
    ],
    
    // Default settings
    DEFAULTS: {
      LANGUAGE: 'en',
      CAPTION_LANGUAGE: 'en',
      QUALITY: 'default'
    }
  },

  // AI Configuration
  AI: {
    // OpenRouter Models
    MODELS: {
      MISTRAL: 'mistralai/mistral-7b-instruct:free',
      LLAMA2: 'meta-llama/llama-2-13b-chat:free',
      GEMMA: 'google/gemma-7b-it:free',
      HERMES: 'nousresearch/nous-hermes-2-mixtral-8x7b-sft:free'
    },
    
    // Task types for model selection
    TASK_TYPES: {
      TRANSCRIPT_FIX: 'transcript_fix',
      SENTENCE_SPLIT: 'sentence_split',
      PHRASE_EXTRACT: 'phrase_extract',
      TRANSLATION: 'translation',
      ANALYSIS: 'analysis'
    },
    
    // Processing limits
    LIMITS: {
      MAX_TOKENS: 2000,
      MAX_REQUESTS_PER_MINUTE: 30,
      BATCH_SIZE: 3,
      REQUEST_DELAY: 1000 // ms between batch requests
    }
  },

  // Pronunciation Configuration
  PRONUNCIATION: {
    // Supported languages for text-to-speech
    LANGUAGES: [
      { code: 'en', name: 'English', voice: 'en-US' },
      { code: 'hi', name: 'Hindi', voice: 'hi-IN' },
      { code: 'es', name: 'Spanish', voice: 'es-ES' },
      { code: 'fr', name: 'French', voice: 'fr-FR' },
      { code: 'de', name: 'German', voice: 'de-DE' }
    ],
    
    // Default settings
    DEFAULTS: {
      ENABLED: true,
      RATE: 0.8,
      PITCH: 1.0,
      VOLUME: 1.0,
      LANGUAGE: 'auto'
    },
    
    // Speech synthesis settings
    SPEECH: {
      RATE_MIN: 0.5,
      RATE_MAX: 2.0,
      PITCH_MIN: 0.5,
      PITCH_MAX: 2.0,
      VOLUME_MIN: 0.0,
      VOLUME_MAX: 1.0
    }
  },

  // Learning Configuration
  LEARNING: {
    // Difficulty levels
    LEVELS: {
      A1: { name: 'Beginner', color: 'success', score: 25 },
      A2: { name: 'Elementary', color: 'success', score: 50 },
      B1: { name: 'Intermediate', color: 'warning', score: 65 },
      B2: { name: 'Upper Intermediate', color: 'warning', score: 75 },
      C1: { name: 'Advanced', color: 'danger', score: 85 },
      C2: { name: 'Proficient', color: 'danger', score: 95 }
    },
    
    // Phrase types
    PHRASE_TYPES: {
      IDIOM: 'idiom',
      EXPRESSION: 'expression',
      PHRASAL_VERB: 'phrasal_verb',
      COLLOCATION: 'collocation',
      COMMON_PHRASE: 'common_phrase'
    },
    
    // Difficulty levels for phrases
    PHRASE_DIFFICULTY: {
      EASY: 'easy',
      MEDIUM: 'medium',
      HARD: 'hard'
    },
    
    // Learning metrics
    METRICS: {
      WORDS_PER_MINUTE: 200,
      SENTENCES_PER_MINUTE: 3,
      PHRASES_PER_MINUTE: 2,
      MASTERY_THRESHOLD: 80 // percentage
    }
  },

  // UI Configuration
  UI: {
    // Themes
    THEMES: {
      DARK: 'dark',
      LIGHT: 'light',
      AUTO: 'auto'
    },
    
    // Font sizes
    FONT_SIZES: {
      SMALL: 'small',
      MEDIUM: 'medium',
      LARGE: 'large',
      X_LARGE: 'x-large'
    },
    
    // Layout
    LAYOUT: {
      DUAL_WINDOW: 'dual-window',
      SINGLE_WINDOW: 'single-window',
      FOCUS_MODE: 'focus-mode'
    },
    
    // Breakpoints
    BREAKPOINTS: {
      MOBILE: 768,
      TABLET: 1024,
      DESKTOP: 1200
    },
    
    // Animation durations
    ANIMATIONS: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500
    },
    
    // Z-index layers
    Z_INDEX: {
      DROPDOWN: 1000,
      MODAL: 1050,
      TOOLTIP: 1070,
      NOTIFICATION: 1080
    }
  },

  // Storage Keys
  STORAGE: {
    // User preferences
    USER: {
      THEME: 'user_theme',
      LANGUAGE: 'user_language',
      PRONUNCIATION_PREFERENCES: 'pronunciation_preferences',
      PLAYBACK_SPEED: 'playback_speed',
      AUTO_SCROLL: 'auto_scroll_enabled'
    },
    
    // App state
    APP: {
      RECENT_VIDEOS: 'recent_videos',
      SAVED_TRANSCRIPTS: 'saved_transcripts',
      LEARNING_PROGRESS: 'learning_progress'
    },
    
    // Cache
    CACHE: {
      VIDEO_INFO: 'cache_video_info',
      TRANSCRIPTS: 'cache_transcripts',
      AI_RESPONSES: 'cache_ai_responses'
    }
  },

  // Error Messages
  ERRORS: {
    // Network errors
    NETWORK: {
      OFFLINE: 'Internet connection not available',
      TIMEOUT: 'Request timeout',
      SERVER_ERROR: 'Server error occurred'
    },
    
    // YouTube errors
    YOUTUBE: {
      INVALID_URL: 'Invalid YouTube URL',
      VIDEO_NOT_FOUND: 'Video not found',
      CAPTIONS_NOT_AVAILABLE: 'Captions not available for this video',
      AGE_RESTRICTED: 'Age-restricted video cannot be played'
    },
    
    // AI errors
    AI: {
      PROCESSING_FAILED: 'AI processing failed',
      RATE_LIMITED: 'Rate limit exceeded',
      MODEL_UNAVAILABLE: 'AI model temporarily unavailable'
    },
    
    // Authentication errors
    AUTH: {
      UNAUTHORIZED: 'Please login to access this feature',
      TOKEN_EXPIRED: 'Session expired, please login again',
      INVALID_CREDENTIALS: 'Invalid email or password'
    }
  },

  // Success Messages
  SUCCESS: {
    TRANSCRIPT_SAVED: 'Transcript saved successfully',
    VOCABULARY_SAVED: 'Vocabulary item saved',
    PROGRESS_UPDATED: 'Progress updated',
    SETTINGS_SAVED: 'Settings saved successfully'
  },

  // Feature Flags
  FEATURES: {
    AI_PROCESSING: true,
    PRONUNCIATION: true,
    VOCABULARY_TRACKING: true,
    PROGRESS_ANALYTICS: true,
    OFFLINE_MODE: false,
    SOCIAL_SHARING: false
  },

  // Export Formats
  EXPORT: {
    FORMATS: {
      PDF: 'pdf',
      TEXT: 'text',
      JSON: 'json',
      CSV: 'csv'
    },
    
    TEMPLATES: {
      SIMPLE: 'simple',
      DETAILED: 'detailed',
      LEARNING: 'learning'
    }
  },

  // Keyboard Shortcuts
  SHORTCUTS: {
    PLAY_PAUSE: [' ', 'k'],
    FULLSCREEN: ['f'],
    MUTE: ['m'],
    SEEK_BACK: ['ArrowLeft', 'j'],
    SEEK_FORWARD: ['ArrowRight', 'l'],
    NEXT_SENTENCE: ['ArrowDown'],
    PREV_SENTENCE: ['ArrowUp'],
    TOGGLE_AUTO_SCROLL: ['a'],
    TOGGLE_PRONUNCIATION: ['p']
  }
};

// Make constants globally available
window.Constants = Constants;

// Freeze object to prevent modifications
Object.freeze(Constants);
