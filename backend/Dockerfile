# =============================================
# TranscriptPro Backend - RENDER DOCKER DEPLOYMENT
# =============================================

FROM node:18-alpine

# FIX: yt-dlp + ffmpeg + python + build deps for Alpine
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    bash \
    tzdata \
    musl-dev \
    build-base && \
    pip3 install --no-cache-dir yt-dlp && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p logs temp uploads \
    && chmod -R 777 logs temp uploads

RUN addgroup -g 1001 -S nodejs \
    && adduser -S appuser -u 1001 -G nodejs \
    && chown -R appuser:nodejs /app

USER appuser

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:10000/api/health || exit 1

ENV NODE_ENV=production
ENV PORT=10000

CMD ["node", "server.js"]
