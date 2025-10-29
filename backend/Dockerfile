# =============================================
# TranscriptPro Backend Dockerfile
# Production के लिए optimized Docker image
# =============================================

# Official Node.js runtime use करें
FROM node:16-alpine

# Security best practices के लिए:
# 1. Non-root user create करें
# 2. Latest security updates apply करें
# 3. Unnecessary packages install ना करें

# Working directory set करें
WORKDIR /app

# Install system dependencies
# yt-dlp और FFmpeg YouTube integration के लिए required हैं
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    && pip3 install yt-dlp \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Dependencies install करें
RUN npm install --production --no-optional

# Source code copy करें
COPY . .

# Non-root user create करें (security के लिए)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S transcriptpro -u 1001

# File permissions set करें
RUN chown -R transcriptpro:nodejs /app

# Temporary directory create करें
RUN mkdir -p /app/temp /app/logs /app/uploads
RUN chown -R transcriptpro:nodejs /app/temp /app/logs /app/uploads

# Switch to non-root user
USER transcriptpro

# Port expose करें
EXPOSE 5000

# Health check define करें
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node scripts/health-check.js

# Environment variables set करें
ENV NODE_ENV=production
ENV PORT=5000

# Application start करें
CMD ["npm", "start"]
