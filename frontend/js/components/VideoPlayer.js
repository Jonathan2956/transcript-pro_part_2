/**
 * VideoPlayer - Advanced YouTube video player with transcript sync
 * YouTube IFrame API के साथ integrated video player
 */
class VideoPlayer {
  constructor() {
    this.player = null;
    this.isReady = false;
    this.currentVideoId = null;
    this.currentTime = 0;
    this.duration = 0;
    this.isPlaying = false;
    this.playbackRate = 1.0;
    this.volume = 50;
    this.transcriptManager = null;
    
    this.init();
  }

  /**
   * Initialize video player
   */
  init() {
    this.loadYouTubeAPI();
    this.setupEventListeners();
    this.setupCustomControls();
    console.log('✅ VideoPlayer initialized');
  }

  /**
   * Load YouTube IFrame API
   */
  loadYouTubeAPI() {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      this.setupPlayer();
      return;
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Setup global callback
    window.onYouTubeIframeAPIReady = () => {
      this.setupPlayer();
    };
  }

  /**
   * Setup YouTube player
   */
  setupPlayer() {
    const playerContainer = document.getElementById('youtubePlayer');
    if (!playerContainer) {
      console.error('❌ YouTube player container not found');
      return;
    }

    this.player = new YT.Player('youtubePlayer', {
      height: '360',
      width: '640',
      videoId: this.currentVideoId,
      playerVars: {
        'playsinline': 1,
        'enablejsapi': 1,
        'origin': window.location.origin,
        'widget_referrer': window.location.origin,
        'rel': 0,
        'modestbranding': 1,
        'fs': 1
      },
      events: {
        'onReady': this.onPlayerReady.bind(this),
        'onStateChange': this.onPlayerStateChange.bind(this),
        'onError': this.onPlayerError.bind(this)
      }
    });
  }

  /**
   * Player ready event handler
   */
  onPlayerReady(event) {
    this.isReady = true;
    this.duration = event.target.getDuration();
    this.setupTimeUpdateListener();
    
    console.log('🎬 YouTube player ready');
    
    // Player ready event dispatch
    this.dispatchEvent('playerReady', {
      videoId: this.currentVideoId,
      duration: this.duration
    });
  }

  /**
   * Player state change event handler
   */
  onPlayerStateChange(event) {
    const states = {
      '-1': 'unstarted',
      '0': 'ended',
      '1': 'playing',
      '2': 'paused',
      '3': 'buffering',
      '5': 'video cued'
    };

    const state = states[event.data] || 'unknown';
    this.isPlaying = event.data === YT.PlayerState.PLAYING;
    
    console.log(`🎬 Player state: ${state}`);

    // Dispatch custom events
    this.dispatchEvent('playerStateChange', {
      state: state,
      isPlaying: this.isPlaying,
      currentTime: this.currentTime
    });

    // Handle playing state for transcript sync
    if (this.isPlaying && this.transcriptManager) {
      this.startTranscriptSync();
    }
  }

  /**
   * Player error event handler
   */
  onPlayerError(event) {
    console.error('❌ YouTube player error:', event.data);
    
    const errorMessages = {
      2: 'The request contains an invalid parameter value',
      5: 'The requested content cannot be played in an HTML5 player',
      100: 'The video requested was not found',
      101: 'The owner of the requested video does not allow it to be played in embedded players',
      150: 'The owner of the requested video does not allow it to be played in embedded players'
    };

    this.dispatchEvent('playerError', {
      errorCode: event.data,
      errorMessage: errorMessages[event.data] || 'Unknown error occurred'
    });
  }

  /**
   * Setup time update listener for transcript sync
   */
  setupTimeUpdateListener() {
    setInterval(() => {
      if (this.player && this.isReady) {
        const newTime = this.player.getCurrentTime();
        if (newTime !== this.currentTime) {
          this.currentTime = newTime;
          this.dispatchEvent('videoTimeUpdate', {
            currentTime: this.currentTime,
            duration: this.duration
          });
        }
      }
    }, 100); // Update every 100ms for smooth sync
  }

  /**
   * Start transcript synchronization
   */
  startTranscriptSync() {
    console.log('🔄 Starting transcript synchronization');
    // Transcript sync is handled by the time update listener
  }

  /**
   * ADVANCED: Load video by ID or URL
   */
  loadVideo(videoIdOrUrl, startTime = 0) {
    const videoId = this.extractVideoId(videoIdOrUrl);
    
    if (!videoId) {
      this.dispatchEvent('playerError', {
        errorCode: 'INVALID_VIDEO_ID',
        errorMessage: 'Invalid YouTube video ID or URL'
      });
      return;
    }

    this.currentVideoId = videoId;

    if (this.isReady) {
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: startTime
      });
    } else {
      // If player not ready, store video ID and load when ready
      setTimeout(() => {
        if (this.isReady) {
          this.loadVideo(videoId, startTime);
        }
      }, 1000);
    }

    console.log(`🎬 Loading video: ${videoId}`);
  }

  /**
   * ADVANCED: Extract video ID from various URL formats
   */
  extractVideoId(url) {
    if (!url) return null;

    // If it's already a video ID (11 characters)
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
      return url;
    }

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

  /**
   * ADVANCED: Play video
   */
  play() {
    if (this.isReady) {
      this.player.playVideo();
      this.isPlaying = true;
    }
  }

  /**
   * ADVANCED: Pause video
   */
  pause() {
    if (this.isReady) {
      this.player.pauseVideo();
      this.isPlaying = false;
    }
  }

  /**
   * ADVANCED: Seek to specific time
   */
  seekTo(timeInSeconds) {
    if (this.isReady) {
      this.player.seekTo(timeInSeconds, true);
      this.currentTime = timeInSeconds;
      
      this.dispatchEvent('videoSeek', {
        time: timeInSeconds
      });
    }
  }

  /**
   * ADVANCED: Set playback rate
   */
  setPlaybackRate(rate) {
    if (this.isReady) {
      this.player.setPlaybackRate(rate);
      this.playbackRate = rate;
      
      this.dispatchEvent('playbackRateChange', {
        rate: rate
      });
    }
  }

  /**
   * ADVANCED: Set volume
   */
  setVolume(volume) {
    if (this.isReady) {
      this.player.setVolume(volume);
      this.volume = volume;
      
      this.dispatchEvent('volumeChange', {
        volume: volume
      });
    }
  }

  /**
   * ADVANCED: Get video information
   */
  async getVideoInfo() {
    if (!this.currentVideoId) return null;

    try {
      // Use your backend API to get video info
      const response = await fetch(`/api/youtube/video/${this.currentVideoId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        throw new Error('Failed to fetch video info');
      }
    } catch (error) {
      console.error('❌ Video info fetch error:', error);
      return this.getFallbackVideoInfo();
    }
  }

  /**
   * ADVANCED: Get video captions/transcript
   */
  async getCaptions(language = 'en') {
    if (!this.currentVideoId) return null;

    try {
      const response = await fetch(`/api/youtube/captions/${this.currentVideoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        throw new Error('Failed to fetch captions');
      }
    } catch (error) {
      console.error('❌ Captions fetch error:', error);
      return null;
    }
  }

  /**
   * ADVANCED: Setup custom controls
   */
  setupCustomControls() {
    this.setupPlayPauseControl();
    this.setupVolumeControl();
    this.setupPlaybackRateControl();
    this.setupFullscreenControl();
    this.setupProgressControl();
  }

  /**
   * Setup play/pause control
   */
  setupPlayPauseControl() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        if (this.isPlaying) {
          this.pause();
          playPauseBtn.innerHTML = '<span>▶️</span>';
        } else {
          this.play();
          playPauseBtn.innerHTML = '<span>⏸️</span>';
        }
      });
    }
  }

  /**
   * Setup volume control
   */
  setupVolumeControl() {
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.setVolume(parseInt(e.target.value));
      });
      
      // Set initial volume
      volumeSlider.value = this.volume;
    }
  }

  /**
   * Setup playback rate control
   */
  setupPlaybackRateControl() {
    // You can add playback rate buttons in your HTML
    const rateButtons = document.querySelectorAll('.playback-rate-btn');
    rateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const rate = parseFloat(btn.dataset.rate);
        this.setPlaybackRate(rate);
        
        // Update active state
        rateButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  /**
   * Setup fullscreen control
   */
  setupFullscreenControl() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }
  }

  /**
   * Setup progress control
   */
  setupProgressControl() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * this.duration;
        this.seekTo(time);
      });
    }
  }

  /**
   * ADVANCED: Toggle fullscreen
   */
  toggleFullscreen() {
    const playerContainer = document.getElementById('youtubePlayer');
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      if (playerContainer.requestFullscreen) {
        playerContainer.requestFullscreen();
      } else if (playerContainer.webkitRequestFullscreen) {
        playerContainer.webkitRequestFullscreen();
      } else if (playerContainer.msRequestFullscreen) {
        playerContainer.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  /**
   * ADVANCED: Setup event listeners for custom events
   */
  setupEventListeners() {
    // Listen for transcript sentence clicks
    document.addEventListener('transcriptSentenceClick', (e) => {
      this.seekTo(e.detail.startTime);
    });

    // Listen for video load requests
    document.addEventListener('loadVideo', (e) => {
      this.loadVideo(e.detail.videoId, e.detail.startTime);
    });

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  /**
   * ADVANCED: Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    // Only handle if not in input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case ' ':
      case 'k':
        event.preventDefault();
        if (this.isPlaying) {
          this.pause();
        } else {
          this.play();
        }
        break;
      
      case 'f':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      
      case 'm':
        event.preventDefault();
        this.setVolume(this.volume > 0 ? 0 : 50);
        break;
      
      case 'ArrowLeft':
        event.preventDefault();
        this.seekTo(Math.max(0, this.currentTime - 5));
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        this.seekTo(Math.min(this.duration, this.currentTime + 5));
        break;
      
      case 'j':
        event.preventDefault();
        this.seekTo(Math.max(0, this.currentTime - 10));
        break;
      
      case 'l':
        event.preventDefault();
        this.seekTo(Math.min(this.duration, this.currentTime + 10));
        break;
    }
  }

  /**
   * ADVANCED: Dispatch custom events
   */
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }

  /**
   * Utility Methods
   */
  getAuthToken() {
    return localStorage.getItem('authToken') || '';
  }

  getFallbackVideoInfo() {
    return {
      videoId: this.currentVideoId,
      title: 'Video Title Not Available',
      duration: this.duration,
      thumbnail: `https://img.youtube.com/vi/${this.currentVideoId}/default.jpg`
    };
  }

  /**
   * ADVANCED: Get player state information
   */
  getPlayerState() {
    return {
      isReady: this.isReady,
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      playbackRate: this.playbackRate,
      volume: this.volume,
      videoId: this.currentVideoId
    };
  }

  /**
   * ADVANCED: Destroy player and cleanup
   */
  destroy() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    
    this.isReady = false;
    console.log('🗑️ VideoPlayer destroyed');
  }

  /**
   * ADVANCED: Set transcript manager for sync
   */
  setTranscriptManager(transcriptManager) {
    this.transcriptManager = transcriptManager;
    console.log('🔗 Transcript manager connected to video player');
  }
}

// Create global instance
window.videoPlayer = new VideoPlayer();
