transcript-pro/
│
├── backend/                          # Backend Node.js server
│   ├── controllers/                  # Route controllers
│   │   ├── authController.js
│   │   ├── transcriptController.js
│   │   ├── vocabularyController.js
│   │   ├── progressController.js
│   │   └── youtubeController.js
│   │
│   ├── models/                       # MongoDB models
│   │   ├── User.js
│   │   ├── VideoTranscript.js
│   │   ├── Vocabulary.js
│   │   └── UserProgress.js
│   │
│   ├── routes/                       # API routes
│   │   ├── auth.js
│   │   ├── transcripts.js
│   │   ├── vocabulary.js
│   │   ├── progress.js
│   │   ├── ai.js
│   │   └── youtube.js
│   │
│   ├── middleware/                   # Custom middleware
│   │   ├── auth.js
│   │   ├── security.js
│   │   └── validation.js
│   │
│   ├── services/                     # Business logic services
│   │   ├── TranscriptService.js
│   │   ├── VocabularyService.js
│   │   ├── UserProgressService.js
│   │   ├── AIService.js
│   │   ├── YouTubeService.js
│   │   ├── EmailService.js
│   │   ├── PaymentService.js
│   │   └── AnalyticsService.js
│   │
│   ├── utils/                        # Utility functions
│   │   ├── logger.js
│   │   ├── helpers.js
│   │   └── constants.js
│   │
│   ├── config/                       # Configuration files
│   │   ├── database.js
│   │   └── cloudinary.js
│   │
│   ├── public/                       # Static files
│   │   └── uploads/
│   │
│   ├── scripts/                      # Setup and utility scripts
│   │   ├── setup.sh
│   │   ├── install-production.sh
│   │   └── health-check.js
│   │
│   ├── tests/                        # Test files
│   │   ├── unit/
│   │   └── integration/
│   │
│   ├── .env                          # Environment variables (create from .env.example)
│   ├── .env.example                  # Environment template
│   ├── package.json
│   ├── server.js                     # Main server file
│   ├── ecosystem.config.js           # PM2 configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
│
├── frontend/                         # Frontend application
│   ├── css/
│   │   ├── style.css
│   │   ├── mobile.css
│   │   └── themes/
│   │       ├── dark.css
│   │       └── light.css
│   │
│   ├── js/
│   │   ├── app.js                    # Main application
│   │   ├── services/
│   │   │   ├── ApiService.js
│   │   │   ├── YouTubeService.js
│   │   │   ├── AIService.js
│   │   │   └── DatabaseManager.js
│   │   │
│   │   ├── components/
│   │   │   ├── DualWindowManager.js
│   │   │   ├── TranscriptManager.js
│   │   │   ├── VocabularyManager.js
│   │   │   ├── VideoPlayer.js
│   │   │   └── AuthManager.js
│   │   │
│   │   ├── utils/
│   │   │   ├── helpers.js
│   │   │   └── constants.js
│   │   │
│   │   └── libs/                     # Third-party libraries
│   │       └── youtube-iframe-api.js
│   │
│   ├── assets/
│   │   ├── icons/
│   │   │   ├── icon-192.png
│   │   │   ├── icon-512.png
│   │   │   └── favicon.ico
│   │   │
│   │   ├── images/
│   │   └── audio/
│   │
│   ├── pages/                        # Additional HTML pages
│   │   ├── login.html
│   │   ├── register.html
│   │   └── dashboard.html
│   │
│   ├── index.html                    # Main HTML file
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker
│   └── robots.txt
│
├── docs/                            # Documentation
│   ├── api/
│   ├── setup/
│   └── deployment/
│
├── scripts/                         # Project-wide scripts
│   ├── deploy.sh
│   ├── backup-db.sh
│   └── setup-project.sh
│
├── .gitignore
├── README.md
├── LICENSE
└── package.json                     # Root package.json (if using monorepo)
