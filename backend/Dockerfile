# =============================================
# TranscriptPro Backend - RENDER DOCKER DEPLOYMENT
# =============================================

# Recommended Node version for Render
FROM node:18-alpine

# -------------------------------------------------
# FIX: yt-dlp + ffmpeg + python dependencies (working)
# -------------------------------------------------
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    bash \
    tzdata && \
    pip3 install --no-cache-dir yt-dlp && \
    rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy app source code
COPY . .

# Create necessary directories
RUN mkdir -p logs temp uploads \
    && chmod -R 777 logs temp uploads

# Create non-root user (Render requirement)
RUN addgroup -g 1001 -S nodejs \
    && adduser -S appuser -u 1001 -G nodejs \
    && chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:10000/api/health || exit 1

ENV NODE_ENV=production
ENV PORT=10000

# Start backend
CMD ["node", "server.js"]
