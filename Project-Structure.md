📦 Project Root
├── .gitignore
├── README.md
├── Project-Structure.md
│
├── workflows
│   └── setup.yml
│
├── backend
│   ├── .env.example
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   ├── server.js
│   │
│   ├── models
│   │   └── User.js
│   │
│   ├── routes
│   │   ├── al.js
│   │   └── youtube.js
│   │
│   ├── scripts
│   │   └── setup.sh
│   │
│   ├── services
│   │   ├── OpenRouter Service.js
│   │   ├── TranscriptProcessor.js
│   │   └── YouTubeService.js
│   │
│   └── utils
│       └── logger.js
│
├── frontend
│   ├── .env.example
│   ├── index.html
│   │
│   ├── css
│   │   └── pronunciation.css
│   │
│   ├── js
│   │   ├── components
│   │   │   ├── Dual WindowManager.js
│   │   │   ├── TranscriptManager.js
│   │   │   └── VideoPlayer.js
│   │   │
│   │   ├── services
│   │   │   ├── AlService.js
│   │   │   └── PronunciationService.js
│   │   │
│   │   ├── utils
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │
│   └── js (root-level scripts if any)
│
└── (other possible files...)





workflows/setup.yml


backend/models/User.js
backend/routes/al.js
backend/routes/youtube.js
backend/scripts/setup.sh
backend/services/OpenRouter Service.js
backend/services/TranscriptProcessor.js
backend/services/YouTubeService.js
backend/utils/logger.js
backend/.env.example
backend/Dockerfile
backend/docker-compose.yml
backend/package.json
backend/server.js

frontend/css/pronunciation.css
frontend/js/components/Dual WindowManager.js
frontend/js/components/TranscriptManager.js
frontend/js/components/VideoPlayer.js
frontend/js/services/AlService.js
frontend/js/services/PronunciationService.js
frontend/js/utils/constants.js
frontend/js/utils/helpers.js
frontend/.env.example
frontend/index.html
Project-Structure.md
.gitignore
README.md
