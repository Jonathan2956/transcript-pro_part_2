const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = util.promisify(exec);

/**
 * YouTubeService - YouTube related operations handle करता है
 * YouTube Data API और yt-dlp का use करके videos और captions fetch करता है
 */
class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
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
      if (!this.apiKey) {
        throw new Error('YouTube API key configured नहीं है');
      }

      const response = await axios.get(`${this.baseURL}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey
        },
        timeout: 10000
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Video नहीं मिली: ${videoId}`);
      }

      const video = response.data.items[0];
      const duration = this.parseDuration(video.contentDetails.duration);
      
      return {
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        duration: duration,
        thumbnail: video.snippet.thumbnails.default?.url || video.snippet.thumbnails.standard?.url,
        channel: {
          name: video.snippet.channelTitle,
          id: video.snippet.channelId
        },
        statistics: {
          viewCount: video.statistics?.viewCount || 0,
          likeCount: video.statistics?.likeCount || 0,
          commentCount: video.statistics?.commentCount || 0
        },
        publishedAt: video.snippet.publishedAt
      };

    } catch (error) {
      console.error('❌ YouTube video details fetch error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        return this.getMockVideoDetails(videoId);
      }
      
      throw new Error(`Video details fetch failed: ${error.message}`);
    }
  }

  async extractCaptions(videoId, language = 'en') {
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

      console.log(`🔍 Extracting captions with command: ${command}`);

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
      console.error('❌ YouTube captions extract error:', error.message);
      
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
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  async getChannelVideos(channelId, maxResults = 20, pageToken = null) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          part: 'snippet',
          channelId: channelId,
          maxResults: maxResults,
          order: 'date',
          type: 'video',
          pageToken: pageToken,
          key: this.apiKey
        },
        timeout: 10000
      });

      return {
        videos: response.data.items.map(item => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt
        })),
        nextPageToken: response.data.nextPageToken,
        totalResults: response.data.pageInfo?.totalResults || 0
      };

    } catch (error) {
      console.error('❌ Channel videos fetch error:', error.message);
      throw new Error(`Channel videos fetch failed: ${error.message}`);
    }
  }

  async searchVideos(query, maxResults = 20, pageToken = null, type = 'video') {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          part: 'snippet',
          q: query,
          maxResults: maxResults,
          type: type,
          pageToken: pageToken,
          key: this.apiKey
        },
        timeout: 10000
      });

      return {
        results: response.data.items.map(item => ({
          id: item.id.videoId || item.id.channelId || item.id.playlistId,
          type: item.id.kind.replace('youtube#', ''),
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.default?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt
        })),
        nextPageToken: response.data.nextPageToken,
        totalResults: response.data.pageInfo?.totalResults || 0
      };

    } catch (error) {
      console.error('❌ YouTube search error:', error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getPlaylistItems(playlistId, maxResults = 20, pageToken = null) {
    try {
      const response = await axios.get(`${this.baseURL}/playlistItems`, {
        params: {
          part: 'snippet',
          playlistId: playlistId,
          maxResults: maxResults,
          pageToken: pageToken,
          key: this.apiKey
        },
        timeout: 10000
      });

      return {
        items: response.data.items.map(item => ({
          videoId: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.default?.url,
          position: item.snippet.position,
          publishedAt: item.snippet.publishedAt
        })),
        nextPageToken: response.data.nextPageToken,
        totalResults: response.data.pageInfo?.totalResults || 0
      };

    } catch (error) {
      console.error('❌ Playlist items fetch error:', error.message);
      throw new Error(`Playlist items fetch failed: ${error.message}`);
    }
  }

  async checkTranscriptAvailability(videoId) {
    try {
      const captions = await this.extractCaptions(videoId, 'en');
      
      return {
        available: captions.length > 0,
        language: 'en',
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
