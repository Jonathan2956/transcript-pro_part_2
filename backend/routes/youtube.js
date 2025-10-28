const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const YouTubeService = require('../services/YouTubeService');
const logger = require('../utils/logger');

const router = express.Router();
const youtubeService = new YouTubeService();

/**
 * YouTube Video Details Fetch करने का Route
 * GET /api/youtube/video/:videoId
 * YouTube video की details fetch करता है
 */
router.get('/video/:videoId', [
  auth, // Authentication required
], async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Input validation
    if (!videoId || videoId.length !== 11) {
      return res.status(400).json({
        error: 'Valid YouTube video ID आवश्यक है (11 characters)'
      });
    }

    logger.info(`📹 YouTube video details fetch request: ${videoId}`, {
      userId: req.user._id,
      videoId
    });

    // YouTube से video details fetch करें
    const videoDetails = await youtubeService.getVideoDetails(videoId);
    
    res.json({
      success: true,
      data: videoDetails
    });

  } catch (error) {
    logger.error('❌ YouTube video details fetch error:', {
      error: error.message,
      videoId: req.params.videoId,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Video details fetch करने में error आया',
      message: error.message
    });
  }
});

/**
 * YouTube Captions Extract करने का Route
 * POST /api/youtube/captions/:videoId
 * YouTube video से captions/transcript extract करता है
 */
router.post('/captions/:videoId', [
  auth,
  body('language').optional().isString().isLength({ min: 2, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: errors.array()
      });
    }

    const { videoId } = req.params;
    const { language = 'en' } = req.body;

    if (!videoId) {
      return res.status(400).json({
        error: 'Video ID आवश्यक है'
      });
    }

    logger.info(`📝 YouTube captions extract request: ${videoId}`, {
      userId: req.user._id,
      videoId,
      language
    });

    // Captions extract करें
    const captions = await youtubeService.extractCaptions(videoId, language);
    
    if (!captions || captions.length === 0) {
      return res.status(404).json({
        error: 'इस video के लिए captions available नहीं हैं',
        videoId
      });
    }

    res.json({
      success: true,
      data: {
        videoId,
        language,
        captions,
        totalEntries: captions.length,
        duration: captions.reduce((total, entry) => total + entry.duration, 0)
      }
    });

  } catch (error) {
    logger.error('❌ YouTube captions extract error:', {
      error: error.message,
      videoId: req.params.videoId,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Captions extract करने में error आया',
      message: error.message
    });
  }
});

/**
 * YouTube Channel Videos Fetch करने का Route
 * GET /api/youtube/channel/:channelId/videos
 * YouTube channel की videos list fetch करता है
 */
router.get('/channel/:channelId/videos', [
  auth
], async (req, res) => {
  try {
    const { channelId } = req.params;
    const { maxResults = 20, pageToken } = req.query;

    if (!channelId) {
      return res.status(400).json({
        error: 'Channel ID आवश्यक है'
      });
    }

    logger.info(`📺 YouTube channel videos fetch request: ${channelId}`, {
      userId: req.user._id,
      channelId,
      maxResults
    });

    // Channel videos fetch करें
    const channelVideos = await youtubeService.getChannelVideos(
      channelId, 
      parseInt(maxResults), 
      pageToken
    );

    res.json({
      success: true,
      data: channelVideos
    });

  } catch (error) {
    logger.error('❌ YouTube channel videos fetch error:', {
      error: error.message,
      channelId: req.params.channelId,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Channel videos fetch करने में error आया',
      message: error.message
    });
  }
});

/**
 * YouTube Search Route
 * GET /api/youtube/search
 * YouTube पर videos search करता है
 */
router.get('/search', [
  auth
], async (req, res) => {
  try {
    const { q, maxResults = 20, pageToken, type = 'video' } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query आवश्यक है'
      });
    }

    logger.info(`🔍 YouTube search request: ${q}`, {
      userId: req.user._id,
      query: q,
      type,
      maxResults
    });

    // YouTube पर search करें
    const searchResults = await youtubeService.searchVideos(
      q.trim(),
      parseInt(maxResults),
      pageToken,
      type
    );

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    logger.error('❌ YouTube search error:', {
      error: error.message,
      query: req.query.q,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Search करने में error आया',
      message: error.message
    });
  }
});

/**
 * YouTube Playlist Items Fetch करने का Route
 * GET /api/youtube/playlist/:playlistId
 * YouTube playlist की videos fetch करता है
 */
router.get('/playlist/:playlistId', [
  auth
], async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { maxResults = 20, pageToken } = req.query;

    if (!playlistId) {
      return res.status(400).json({
        error: 'Playlist ID आवश्यक है'
      });
    }

    logger.info(`🎵 YouTube playlist fetch request: ${playlistId}`, {
      userId: req.user._id,
      playlistId,
      maxResults
    });

    // Playlist items fetch करें
    const playlistItems = await youtubeService.getPlaylistItems(
      playlistId,
      parseInt(maxResults),
      pageToken
    );

    res.json({
      success: true,
      data: playlistItems
    });

  } catch (error) {
    logger.error('❌ YouTube playlist fetch error:', {
      error: error.message,
      playlistId: req.params.playlistId,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Playlist fetch करने में error आया',
      message: error.message
    });
  }
});

/**
 * YouTube Video Transcript Availability Check करने का Route
 * GET /api/youtube/transcript-availability/:videoId
 * Check करता है कि video के लिए transcript available है या नहीं
 */
router.get('/transcript-availability/:videoId', [
  auth
], async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        error: 'Video ID आवश्यक है'
      });
    }

    logger.info(`📋 YouTube transcript availability check: ${videoId}`, {
      userId: req.user._id,
      videoId
    });

    // Transcript availability check करें
    const availability = await youtubeService.checkTranscriptAvailability(videoId);

    res.json({
      success: true,
      data: availability
    });

  } catch (error) {
    logger.error('❌ YouTube transcript availability check error:', {
      error: error.message,
      videoId: req.params.videoId,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Transcript availability check करने में error आया',
      message: error.message
    });
  }
});

module.exports = router;
