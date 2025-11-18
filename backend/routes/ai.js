const express = require('express');
const { auth } = require('../middleware/auth');
const TranscriptProcessor = require('../services/TranscriptProcessor');
const OpenRouterService = require('../services/OpenRouterService');
const logger = require('../utils/logger');

const router = express.Router();
const transcriptProcessor = new TranscriptProcessor();
const openRouterService = new OpenRouterService();

/**
 * AI Transcript Processing Route
 * POST /api/ai/process-transcript
 */
router.post('/process-transcript', [
  auth
], async (req, res) => {
  try {
    const { transcriptEntries, videoId, language = 'en' } = req.body;

    if (!transcriptEntries || !videoId) {
      return res.status(400).json({
        error: 'Transcript entries और video ID आवश्यक हैं'
      });
    }

    logger.info('🤖 AI transcript processing request', {
      userId: req.user._id,
      videoId,
      entryCount: transcriptEntries.length,
      language
    });

    const processedTranscript = await transcriptProcessor.processTranscript(
      transcriptEntries, 
      videoId, 
      language
    );

    res.json({
      success: true,
      data: processedTranscript
    });

  } catch (error) {
    logger.error('❌ AI transcript processing error:', {
      error: error.message,
      userId: req.user._id,
      videoId: req.body.videoId
    });

    res.status(500).json({
      error: 'Transcript processing में error आया',
      message: error.message
    });
  }
});

/**
 * AI Fix Transcript Route
 * POST /api/ai/fix-transcript
 */
router.post('/fix-transcript', [
  auth
], async (req, res) => {
  try {
    const { transcriptText, language = 'en', fixType = 'both' } = req.body;

    if (!transcriptText) {
      return res.status(400).json({
        error: 'Transcript text आवश्यक है'
      });
    }

    logger.info('🔧 AI transcript fix request', {
      userId: req.user._id,
      fixType,
      textLength: transcriptText.length
    });

    const fixedTranscript = await openRouterService.fixTranscript(transcriptText, language);

    res.json({
      success: true,
      data: {
        original: transcriptText,
        fixed: fixedTranscript,
        improvements: this.calculateImprovements(transcriptText, fixedTranscript),
        fixType: fixType
      }
    });

  } catch (error) {
    logger.error('❌ AI transcript fix error:', {
      error: error.message,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Transcript fix करने में error आया',
      message: error.message
    });
  }
});

/**
 * Phrase Analysis Route
 * POST /api/ai/analyze-phrases
 */
router.post('/analyze-phrases', [
  auth
], async (req, res) => {
  try {
    const { sentenceText, sentenceId, context = '' } = req.body;

    if (!sentenceText) {
      return res.status(400).json({
        error: 'Sentence text आवश्यक है'
      });
    }

    logger.info('🔍 AI phrase analysis request', {
      userId: req.user._id,
      sentenceId,
      textLength: sentenceText.length
    });

    const phraseAnalysis = await transcriptProcessor.getPhraseBreakdown(
      sentenceId, 
      [{ id: sentenceId, originalText: sentenceText }]
    );

    res.json({
      success: true,
      data: phraseAnalysis
    });

  } catch (error) {
    logger.error('❌ AI phrase analysis error:', {
      error: error.message,
      userId: req.user._id,
      sentenceId: req.body.sentenceId
    });

    res.status(500).json({
      error: 'Phrase analysis में error आया',
      message: error.message
    });
  }
});

/**
 * Translation Route
 * POST /api/ai/translate
 */
router.post('/translate', [
  auth
], async (req, res) => {
  try {
    const { text, targetLanguage = 'hi', context = '' } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text to translate आवश्यक है'
      });
    }

    logger.info('🌐 AI translation request', {
      userId: req.user._id,
      targetLanguage,
      textLength: text.length
    });

    const translatedText = await openRouterService.translateText(text, targetLanguage, context);

    res.json({
      success: true,
      data: {
        original: text,
        translated: translatedText,
        language: targetLanguage
      }
    });

  } catch (error) {
    logger.error('❌ AI translation error:', {
      error: error.message,
      userId: req.user._id,
      targetLanguage: req.body.targetLanguage
    });

    res.status(500).json({
      error: 'Translation में error आया',
      message: error.message
    });
  }
});

/**
 * Sentence Complexity Analysis Route
 * POST /api/ai/analyze-complexity
 */
router.post('/analyze-complexity', [
  auth
], async (req, res) => {
  try {
    const { sentenceText } = req.body;

    if (!sentenceText) {
      return res.status(400).json({
        error: 'Sentence text आवश्यक है'
      });
    }

    logger.info('📊 AI complexity analysis request', {
      userId: req.user._id,
      textLength: sentenceText.length
    });

    const complexityAnalysis = await openRouterService.analyzeComplexity(sentenceText);

    res.json({
      success: true,
      data: complexityAnalysis
    });

  } catch (error) {
    logger.error('❌ AI complexity analysis error:', {
      error: error.message,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Complexity analysis में error आया',
      message: error.message
    });
  }
});

/**
 * Learning Insights Route
 * POST /api/ai/learning-insights
 */
router.post('/learning-insights', [
  auth
], async (req, res) => {
  try {
    const { sentences, videoId } = req.body;

    if (!sentences || !Array.isArray(sentences)) {
      return res.status(400).json({
        error: 'Sentences array आवश्यक है'
      });
    }

    logger.info('📈 AI learning insights request', {
      userId: req.user._id,
      videoId,
      sentenceCount: sentences.length
    });

    const insights = await transcriptProcessor.generateLearningInsights(sentences);

    // Add personalized recommendations based on user level
    const personalizedInsights = await this.addPersonalizedRecommendations(
      insights, 
      req.user
    );

    res.json({
      success: true,
      data: personalizedInsights
    });

  } catch (error) {
    logger.error('❌ AI learning insights error:', {
      error: error.message,
      userId: req.user._id,
      videoId: req.body.videoId
    });

    res.status(500).json({
      error: 'Learning insights generate करने में error आया',
      message: error.message
    });
  }
});

/**
 * Utility Methods
 */
router.calculateImprovements = function(original, fixed) {
  const originalSentences = original.split(/[.!?]+/).filter(s => s.trim());
  const fixedSentences = fixed.split(/[.!?]+/).filter(s => s.trim());
  
  return {
    sentenceCountChange: fixedSentences.length - originalSentences.length,
    punctuationAdded: (fixed.match(/[.!?,;:]/g) || []).length - (original.match(/[.!?,;:]/g) || []).length,
    wordCountChange: fixed.split(' ').length - original.split(' ').length,
    readabilityImprovement: 'enhanced'
  };
};

router.addPersonalizedRecommendations = async function(insights, user) {
  const userLevel = user.profile?.level || 'beginner';
  
  const levelBasedTips = {
    beginner: [
      'Focus on basic vocabulary and simple sentences',
      'Practice common phrases and greetings',
      'Build foundation with A1-A2 level content'
    ],
    intermediate: [
      'Work on complex sentence structures',
      'Expand vocabulary with context learning',
      'Practice listening comprehension with varied accents'
    ],
    advanced: [
      'Master idiomatic expressions',
      'Focus on nuance and subtle meanings',
      'Practice advanced grammar patterns'
    ]
  };

  return {
    ...insights,
    personalizedTips: levelBasedTips[userLevel] || levelBasedTips.beginner,
    recommendedNextSteps: this.generateNextSteps(insights, userLevel),
    progressTracking: this.calculateProgressMetrics(insights, user)
  };
};

router.generateNextSteps = function(insights, userLevel) {
  const nextSteps = [];
  
  if (insights.totalPhrases > 10) {
    nextSteps.push('Review and practice the extracted phrases');
  }
  
  if (insights.mostCommonDifficulty === 'B2' || insights.mostCommonDifficulty === 'C1') {
    nextSteps.push('Challenge yourself with more advanced content');
  }
  
  if (insights.phraseTypeBreakdown.idiom > 3) {
    nextSteps.push('Focus on understanding and using idioms in context');
  }
  
  return nextSteps.length > 0 ? nextSteps : ['Continue practicing with similar content'];
};

router.calculateProgressMetrics = function(insights, user) {
  const stats = user.statistics || {};
  
  return {
    vocabularyGrowth: insights.totalWords / 100, // Simplified metric
    comprehensionLevel: this.mapDifficultyToScore(insights.mostCommonDifficulty),
    learningEfficiency: insights.totalPhrases / insights.totalSentences,
    estimatedMasteryTime: insights.estimatedLearningTime * 1.5 // Buffer for mastery
  };
};

router.mapDifficultyToScore = function(difficulty) {
  const scoreMap = {
    'A1': 25,
    'A2': 50, 
    'B1': 65,
    'B2': 75,
    'C1': 85,
    'C2': 95
  };
  
  return scoreMap[difficulty] || 50;
};

module.exports = router;
