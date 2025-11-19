/**
 * Helpers - Utility functions for the application
 * Common tasks और operations के लिए helper functions
 */

const Helpers = {
  /**
   * Format time in seconds to MM:SS format
   */
  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Format time to detailed format (HH:MM:SS)
   */
  formatTimeDetailed(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  },

  /**
   * Debounce function for performance optimization
   */
  debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  /**
   * Throttle function for rate limiting
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Generate unique ID
   */
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Safe JSON parse with fallback
   */
  safeJsonParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.warn('JSON parse error:', error);
      return fallback;
    }
  },

  /**
   * Deep clone object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  /**
   * Check if device is mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Check if device is touch capable
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Get browser language
   */
  getBrowserLanguage() {
    return navigator.language || navigator.userLanguage || 'en';
  },

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Truncate text with ellipsis
   */
  truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
  },

  /**
   * Escape HTML characters
   */
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate YouTube URL
   */
  isValidYouTubeUrl(url) {
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  },

  /**
   * Get YouTube video ID from URL
   */
  getYouTubeVideoId(url) {
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
  },

  /**
   * Create download link for file
   */
  downloadFile(data, filename, type = 'text/plain') {
    const file = new Blob([data], { type: type });
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (fallbackError) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  },

  /**
   * Get query parameters from URL
   */
  getQueryParams(url = window.location.search) {
    const params = {};
    const urlParams = new URLSearchParams(url);
    
    for (const [key, value] of urlParams) {
      params[key] = value;
    }
    
    return params;
  },

  /**
   * Set query parameters in URL
   */
  setQueryParams(params, url = window.location.href) {
    const urlObj = new URL(url);
    
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined) {
        urlObj.searchParams.delete(key);
      } else {
        urlObj.searchParams.set(key, params[key]);
      }
    });
    
    return urlObj.toString();
  },

  /**
   * Smooth scroll to element
   */
  smoothScrollTo(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  },

  /**
   * Detect preferred color scheme
   */
  getPreferredColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },

  /**
   * Format number with commas
   */
  formatNumber(number) {
    return new Intl.NumberFormat().format(number);
  },

  /**
   * Calculate reading time
   */
  calculateReadingTime(text, wordsPerMinute = 200) {
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  },

  /**
   * Generate random color
   */
  generateRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  },

  /**
   * Check if element is in viewport
   */
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Add loading spinner
   */
  showLoadingSpinner(container) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <div class="spinner"></div>
      <p>Loading...</p>
    `;
    
    if (container) {
      container.appendChild(spinner);
    }
    
    return spinner;
  },

  /**
   * Remove loading spinner
   */
  hideLoadingSpinner(spinner) {
    if (spinner && spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
    }
  },

  /**
   * Show notification/toast
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add to container
    container.appendChild(notification);

    // Auto remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, duration);

    // Close button event
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });

    return notification;
  },

  /**
   * Local storage helpers with expiration
   */
  storage: {
    set(key, value, expirationMinutes = null) {
      const item = {
        value: value,
        timestamp: expirationMinutes ? Date.now() : null,
        expiration: expirationMinutes ? expirationMinutes * 60 * 1000 : null
      };
      
      localStorage.setItem(key, JSON.stringify(item));
    },

    get(key) {
      const itemStr = localStorage.getItem(key);
      
      if (!itemStr) return null;
      
      try {
        const item = JSON.parse(itemStr);
        
        // Check expiration
        if (item.timestamp && item.expiration) {
          if (Date.now() - item.timestamp > item.expiration) {
            localStorage.removeItem(key);
            return null;
          }
        }
        
        return item.value;
      } catch (error) {
        return null;
      }
    },

    remove(key) {
      localStorage.removeItem(key);
    },

    clear() {
      localStorage.clear();
    }
  },

  /**
   * Session storage helpers
   */
  session: {
    set(key, value) {
      sessionStorage.setItem(key, JSON.stringify(value));
    },

    get(key) {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    },

    remove(key) {
      sessionStorage.removeItem(key);
    }
  },

  /**
   * Cookie helpers
   */
  cookies: {
    set(name, value, days = 7) {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
    },

    get(name) {
      return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
      }, '');
    },

    remove(name) {
      this.set(name, '', -1);
    }
  }
};

// Make helpers globally available
window.Helpers = Helpers;
