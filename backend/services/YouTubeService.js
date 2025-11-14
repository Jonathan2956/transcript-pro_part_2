const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = util.promisify(exec);

/**
 * YouTubeService - YouTube related operations handle करता है
 * Piped API और yt-dlp का use करके videos और captions fetch करता है
 */
class YouTubeService {
  constructor() {
    // Multiple Piped API instances for redundancy और fast response
    this.pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://pipedapi.moomoo.me', 
      'https://pipedapi-libre.kavin.rocks',
      'https://pipedapi.smnz.de',
      'https://pipedapi.in.projectsegfau.lt'
    ];
    this.currentInstanceIndex = 0;
    this.ytdlpPath = process.env.YT_DLP_PATH || 'yt-dlp';
    this.tempDir = path.join(__dirname, '../temp');
    
    this.setupTempDir();
  }

  async setupTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch (error) {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * Get current active Piped API instance
   */
  getCurrentInstance() {
    return this.pipedInstances[this.currentInstanceIndex];
  }

  /**
   * Rotate to next Piped API instance if current fails
   */
  rotateInstance() {
    this.currentInstanceIndex = (this.currentInstanceIndex + 1) % this.pipedInstances.length;
    console.log(`🔄 Switching to Piped API instance: ${this.getCurrentInstance()}`);
  }

  /**
   * Make request with fallback to other instances
   */
  async makeRequestWithFallback(url, options = {}) {
    const maxRetries = this.pipedInstances.length;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const instance = this.getCurrentInstance();
        const fullUrl = `${instance}${url}`;
        
        console.log(`🔍 Attempting request to: ${fullUrl}`);
        
        const response = await axios({
          url: fullUrl,
          timeout: 10000,
          ...options
        });

        return response;

      } catch (error) {
        console.warn(`⚠️ Piped API instance failed (attempt ${attempt + 1}):`, error.message);
        
        if (attempt < maxRetries - 1) {
          this.rotateInstance();
          continue;
        }
        
        throw new Error(`All Piped API instances failed: ${error.message}`);
      }
    }
  }

  extractVideoId(url) {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
      /youtube\.com\/watch\?v=([^"&?\/\s]{11})/,
      /youtube\.com\/embed\/([^"&?\/\s]{11})/,
      /youtu\.be\/([^"&?\/\s]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  async getVideoDetails(videoId) {
    try {
      console.log(`🎬 Fetching video details from Piped API: ${videoId}`);

      const response = await this.makeRequestWithFallback(`/streams/${videoId}`);

      if (!response.data) {
        throw new Error(`Video नहीं मिली: ${videoId}`);
      }

      const video = response.data;
      const duration = video.duration || 0;
      
      return {
        videoId: videoId,
        title: video.title || 'Unknown Title',
        description: video.description || '',
        duration: duration,
        thumbnail: video.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/default.jpg`,
        channel: {
          name: video.uploader || 'Unknown Channel',
          id: video.uploaderUrl ? this.extractChannelId(video.uploaderUrl) : 'unknown'
        },
        statistics: {
          viewCount: video.views || 0,
          likeCount: video.likes || 0,
          commentCount: 0 // Piped API doesn't provide comment count
        },
        publishedAt: video.uploadDate || new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Piped API video details fetch error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        return this.getMockVideoDetails(videoId);
      }
      
      throw new Error(`Video details fetch failed: ${error.message}`);
    }
  }

  extractChannelId(channelUrl) {
    if (!channelUrl) return 'unknown';
    const match = channelUrl.match(/\/channel\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }

  async extractCaptions(videoId, language = 'en') {
    try {
      console.log(`📝 Fetching captions from Piped API: ${videoId}`);

      // First get available captions
      const captionsResponse = await this.makeRequestWithFallback(`/captions/${videoId}`);
      
      if (!captionsResponse.data || !captionsResponse.data.subtitles) {
        throw new Error('इस video के लिए captions available नहीं हैं');
      }

      const subtitles = captionsResponse.data.subtitles;
      
      // Find the requested language or fallback to English
      let targetCaption = subtitles.find(sub => sub.code === language);
      if (!targetCaption) {
        targetCaption = subtitles.find(sub => sub.code === 'en');
      }
      if (!targetCaption) {
        targetCaption = subtitles[0]; // Fallback to first available
      }

      if (!targetCaption) {
        throw new Error('No captions available for this video');
      }

      // Fetch the actual caption content
      const captionContentResponse = await axios.get(targetCaption.url, {
        timeout: 15000
      });

      const captions = this.parseVTTFile(captionContentResponse.data);
      
      if (!captions || captions.length === 0) {
        throw new Error('Captions parse नहीं हो पाए');
      }

      return captions;

    } catch (error) {
      console.error('❌ Piped API captions extract error:', error.message);
      
      // Fallback to yt-dlp if Piped API fails
      console.log('🔄 Falling back to yt-dlp for captions extraction...');
      return await this.extractCaptionsWithYtDlp(videoId, language);
    }
  }

  async extractCaptionsWithYtDlp(videoId, language = 'en') {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const outputFile = path.join(this.tempDir, `captions_${videoId}_${language}`);

      const command = [
        this.ytdlpPath,
        `--write-auto-sub`,
        `--write-sub`,
        `--sub-lang`, language,
        `--skip-download`,
        `--output`, `"${outputFile}.%(ext)s"`,
        `"${videoUrl}"`
      ].join(' ');

      console.log(`🔍 Extracting captions with yt-dlp: ${command}`);

      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

      if (stderr) {
        console.warn('⚠️ yt-dlp stderr:', stderr);
      }

      const subtitleFile = await this.findSubtitleFile(outputFile, language);
      
      if (!subtitleFile) {
        throw new Error('Subtitles file generate नहीं हो पाया');
      }

      const captions = await this.parseSubtitleFile(subtitleFile);
      await this.cleanupTempFiles(outputFile);
      
      return captions;

    } catch (error) {
      console.error('❌ yt-dlp captions extract error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        return this.getMockCaptions(videoId);
      }
      
      throw new Error(`Captions extract failed: ${error.message}`);
    }
  }

  async findSubtitleFile(basePath, language) {
    const possibleExtensions = ['.vtt', '.srt', '.json', '.txt'];
    
    for (const ext of possibleExtensions) {
      const filePath = `${basePath}${ext}`;
      try {
        await fs.access(filePath);
        return filePath;
      } catch (error) {
        continue;
      }
    }
    
    for (const ext of possibleExtensions) {
      const filePath = `${basePath}.${language}${ext}`;
      try {
        await fs.access(filePath);
        return filePath;
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  async parseSubtitleFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      if (filePath.endsWith('.vtt')) {
        return this.parseVTTFile(content);
      } else if (filePath.endsWith('.srt')) {
        return this.parseSRTFile(content);
      } else if (filePath.endsWith('.json')) {
        return this.parseJSONFile(content);
      } else {
        return this.parseTextFile(content);
      }
    } catch (error) {
      throw new Error(`Subtitle file parse failed: ${error.message}`);
    }
  }

  parseVTTFile(content) {
    const captions = [];
    const lines = content.split('\n');
    
    let currentCaption = null;
    
    for (const line of lines) {
      const lineTrimmed = line.trim();
      
      if (!lineTrimmed) continue;
      if (lineTrimmed === 'WEBVTT') continue;
      
      if (lineTrimmed.includes('-->')) {
        if (currentCaption) {
          captions.push(currentCaption);
        }
        
        const times = lineTrimmed.split('-->');
        if (times.length === 2) {
          currentCaption = {
            start: this.parseVTTTime(times[0].trim()),
            end: this.parseVTTTime(times[1].trim()),
            text: ''
          };
        }
      } 
      else if (currentCaption && !lineTrimmed.match(/^\d+$/)) {
        currentCaption.text += (currentCaption.text ? ' ' : '') + lineTrimmed;
      }
    }
    
    if (currentCaption && currentCaption.text) {
      captions.push(currentCaption);
    }
    
    return captions.map(caption => ({
      text: caption.text,
      start: caption.start,
      duration: caption.end - caption.start
    }));
  }

  parseVTTTime(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseFloat(parts[2].replace(',', '.'));
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }

  parseSRTFile(content) {
    return this.parseVTTFile(content);
  }

  parseJSONFile(content) {
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        return data;
      } else if (data.events) {
        return data.events
          .filter(event => event.segs)
          .map(event => ({
            text: event.segs.map(seg => seg.utf8).join(''),
            start: event.tStartMs / 1000,
            duration: event.dDurationMs / 1000
          }));
      }
      return [];
    } catch (error) {
      throw new Error(`JSON parse failed: ${error.message}`);
    }
  }

  parseTextFile(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const avgDuration = 5;
    
    return lines.map((line, index) => ({
      text: line.trim(),
      start: index * avgDuration,
      duration: avgDuration
    }));
  }

  async cleanupTempFiles(basePath) {
    try {
      const files = await fs.readdir(this.tempDir);
      const filesToDelete = files.filter(file => 
        file.includes(path.basename(basePath))
      );
      
      for (const file of filesToDelete) {
        await fs.unlink(path.join(this.tempDir, file));
      }
    } catch (error) {
      console.warn('⚠️ Temp files cleanup failed:', error.message);
    }
  }

  parseDuration(duration) {
    if (typeof duration === 'number') {
      return duration;
    }
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  async getChannelVideos(channelId, maxResults = 20, pageToken = null) {
    try {
      // Piped API doesn't have direct channel videos endpoint like YouTube
      // We'll use search as fallback
      const response = await this.makeRequestWithFallback(`/search?q=channel:${channelId}&filter=all`);

      if (!response.data || !response.data.items) {
        return { videos: [], nextPageToken: null, totalResults: 0 };
      }

      const videos = response.data.items
        .filter(item => item.type === 'stream')
        .slice(0, maxResults)
        .map(item => ({
          videoId: item.url.replace('/watch?v=', ''),
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail,
          publishedAt: item.uploadedDate || new Date().toISOString()
        }));

      return {
        videos: videos,
        nextPageToken: null, // Piped API doesn't support pagination tokens
        totalResults: videos.length
      };

    } catch (error) {
      console.error('❌ Piped API channel videos fetch error:', error.message);
      throw new Error(`Channel videos fetch failed: ${error.message}`);
    }
  }

  async searchVideos(query, maxResults = 20, pageToken = null, type = 'video') {
    try {
      const response = await this.makeRequestWithFallback(`/search?q=${encodeURIComponent(query)}&filter=all`);

      if (!response.data || !response.data.items) {
        return { results: [], nextPageToken: null, totalResults: 0 };
      }

      const results = response.data.items
        .filter(item => {
          if (type === 'video') return item.type === 'stream';
          if (type === 'channel') return item.type === 'channel';
          if (type === 'playlist') return item.type === 'playlist';
          return true;
        })
        .slice(0, maxResults)
        .map(item => ({
          id: item.url ? item.url.split('/').pop() : item.name,
          type: item.type,
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail,
          channelTitle: item.uploaderName,
          publishedAt: item.uploadedDate || new Date().toISOString()
        }));

      return {
        results: results,
        nextPageToken: null, // Piped API doesn't support pagination tokens
        totalResults: results.length
      };

    } catch (error) {
      console.error('❌ Piped API search error:', error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getPlaylistItems(playlistId, maxResults = 20, pageToken = null) {
    try {
      const response = await this.makeRequestWithFallback(`/playlists/${playlistId}`);

      if (!response.data || !response.data.relatedStreams) {
        return { items: [], nextPageToken: null, totalResults: 0 };
      }

      const items = response.data.relatedStreams
        .slice(0, maxResults)
        .map((item, index) => ({
          videoId: item.url.replace('/watch?v=', ''),
          title: item.title,
          description: item.description,
          thumbnail: item.thumbnail,
          position: index,
          publishedAt: item.uploadedDate || new Date().toISOString()
        }));

      return {
        items: items,
        nextPageToken: null, // Piped API doesn't support pagination tokens
        totalResults: items.length
      };

    } catch (error) {
      console.error('❌ Piped API playlist items fetch error:', error.message);
      throw new Error(`Playlist items fetch failed: ${error.message}`);
    }
  }

  async checkTranscriptAvailability(videoId) {
    try {
      const response = await this.makeRequestWithFallback(`/captions/${videoId}`);
      
      const available = response.data && 
                       response.data.subtitles && 
                       response.data.subtitles.length > 0;

      return {
        available: available,
        language: available ? response.data.subtitles[0].code : null,
        autoGenerated: true,
        manual: false
      };

    } catch (error) {
      return {
        available: false,
        language: null,
        autoGenerated: false,
        manual: false,
        error: error.message
      };
    }
  }

  /**
   * Get Piped API instance status for monitoring
   */
  async getInstanceStatus() {
    const status = [];
    
    for (let i = 0; i < this.pipedInstances.length; i++) {
      try {
        const startTime = Date.now();
        await axios.get(`${this.pipedInstances[i]}/trending`, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        
        status.push({
          instance: this.pipedInstances[i],
          status: 'online',
          responseTime: responseTime,
          isCurrent: i === this.currentInstanceIndex
        });
      } catch (error) {
        status.push({
          instance: this.pipedInstances[i],
          status: 'offline',
          responseTime: null,
          isCurrent: i === this.currentInstanceIndex,
          error: error.message
        });
      }
    }
    
    return status;
  }

  getMockVideoDetails(videoId) {
    return {
      videoId: videoId,
      title: `Demo Video - Learning English with AI (${videoId})`,
      description: "This is a demo video for testing the transcript app. Learn English with AI-powered transcripts and vocabulary tools.",
      duration: 360,
      thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`,
      channel: {
        name: "Demo Education Channel",
        id: "UC_demo_channel_123"
      },
      statistics: {
        viewCount: 15420,
        likeCount: 542,
        commentCount: 89
      },
      publishedAt: new Date().toISOString()
    };
  }

  getMockCaptions(videoId) {
    return [
      {
        text: "Hello everyone and welcome to this English learning video",
        start: 0,
        duration: 4
      },
      {
        text: "Today we will learn how to improve your English with YouTube videos",
        start: 4,
        duration: 5
      },
      {
        text: "This method is very effective and used by millions of learners worldwide",
        start: 9,
        duration: 6
      },
      {
        text: "Let me show you how to use this amazing tool to boost your learning",
        start: 15,
        duration: 5
      },
      {
        text: "First, find a YouTube video that interests you and has good subtitles",
        start: 20,
        duration: 6
      },
      {
        text: "Then use the transcript feature to see the text while listening",
        start: 26,
        duration: 5
      },
      {
        text: "You can save new vocabulary words and practice them later",
        start: 31,
        duration: 5
      },
      {
        text: "This way you learn in context which is much more effective",
        start: 36,
        duration: 5
      },
      {
        text: "Remember to practice regularly and be consistent with your studies",
        start: 41,
        duration: 6
      },
      {
        text: "Thank you for watching and happy learning!",
        start: 47,
        duration: 4
      }
    ];
  }
}

module.exports = YouTubeService;
