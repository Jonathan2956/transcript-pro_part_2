# =============================================
# TranscriptPro Backend - RENDER DOCKER DEPLOYMENT
# =============================================

# ✅ CHANGE 1: Node 16 → Node 18 (Render recommendation)
FROM node:18-alpine

# Install system dependencies for yt-dlp (YouTube captions के लिए)
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \  # ✅ CHANGE 2: curl added for health checks
    && pip3 install yt-dlp \
    && rm -rf /var/cache/apk/*

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

# Create non-root user for security (Render requirement)
RUN addgroup -g 1001 -S nodejs \
    && adduser -S appuser -u 1001 -G nodejs \
    && chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port 10000 (Render के लिए required)
EXPOSE 10000

# ✅ Health check updated to use curl (wget से curl)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:10000/api/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Start the application
CMD ["node", "server.js"]
