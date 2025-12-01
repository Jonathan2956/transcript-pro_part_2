# =============================================
# TranscriptPro Backend - Render Optimized
# =============================================

FROM node:16-alpine

# Working directory
WORKDIR /usr/src/app

# System dependencies (yt-dlp और FFmpeg के लिए)
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    && pip3 install yt-dlp \
    && rm -rf /var/cache/apk/*

# Package files copy
COPY package*.json ./

# Production dependencies install
RUN npm install --production --no-optional

# Source code copy
COPY . .

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S transcriptpro -u 1001 && \
    chown -R transcriptpro:nodejs /usr/src/app

# File permissions
RUN mkdir -p /usr/src/app/temp /usr/src/app/logs /usr/src/app/uploads && \
    chown -R transcriptpro:nodejs /usr/src/app/temp /usr/src/app/logs /usr/src/app/uploads

# Switch to non-root user
USER transcriptpro

# Port expose
EXPOSE 10000

# Health check (Render के लिए optimized)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Start application
CMD ["node", "server.js"]
