#!/bin/bash

# =============================================
# TranscriptPro Setup Script
# Development environment setup के लिए
# =============================================

set -e  # Error होने पर script stop करें

echo "🚀 TranscriptPro Setup Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        print_success "Node.js found: $NODE_VERSION"
        
        # Check Node.js version
        REQUIRED_VERSION=16
        CURRENT_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        
        if [ "$CURRENT_VERSION" -lt "$REQUIRED_VERSION" ]; then
            print_error "Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 16 or higher."
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        echo "Download from: https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Check if MongoDB is available
check_mongodb() {
    print_status "Checking MongoDB connection..."
    
    # Check if MongoDB is running locally
    if command -v mongod &> /dev/null && pgrep mongod > /dev/null; then
        print_success "Local MongoDB is running"
        return 0
    else
        print_warning "Local MongoDB is not running"
        echo "You can:"
        echo "1. Install and start MongoDB locally"
        echo "2. Use MongoDB Atlas (cloud)"
        echo "3. Use Docker to run MongoDB"
        return 1
    fi
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    
    cd backend
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in backend directory"
        exit 1
    fi
    
    # npm install करें
    if npm install; then
        print_success "Backend dependencies installed successfully"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    
    cd ..
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend .env file
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend/.env from .env.example..."
        cp backend/.env.example backend/.env
        print_success "Backend .env file created"
        print_warning "Please update backend/.env with your actual API keys and configuration"
    else
        print_success "Backend .env file already exists"
    fi
    
    # Frontend environment (if needed)
    if [ ! -f "frontend/.env" ] && [ -f "frontend/.env.example" ]; then
        print_status "Creating frontend/.env from .env.example..."
        cp frontend/.env.example frontend/.env
        print_success "Frontend .env file created"
    fi
}

# Install yt-dlp for YouTube integration
install_yt_dlp() {
    print_status "Installing yt-dlp for YouTube captions extraction..."
    
    if command -v python3 &> /dev/null; then
        if pip3 install yt-dlp; then
            print_success "yt-dlp installed successfully"
        else
            print_warning "Failed to install yt-dlp using pip3"
            echo "You can install manually: https://github.com/yt-dlp/yt-dlp#installation"
        fi
    else
        print_warning "Python3 not found, skipping yt-dlp installation"
        echo "Please install yt-dlp manually for YouTube captions extraction"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if we should run database setup
    if [ "$1" = "--skip-db" ]; then
        print_warning "Skipping database setup"
        return 0
    fi
    
    # Try to connect to MongoDB and create initial data
    cd backend
    if node scripts/setup-database.js; then
        print_success "Database setup completed"
    else
        print_warning "Database setup failed or skipped"
    fi
    cd ..
}

# Build frontend (if it's a React/Vue app)
build_frontend() {
    print_status "Building frontend..."
    
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        cd frontend
        
        # Check if it's a React app
        if [ -f "package.json" ] && grep -q "\"react-scripts\"" "package.json"; then
            print_status "Building React frontend..."
            if npm install && npm run build; then
                print_success "Frontend built successfully"
            else
                print_error "Frontend build failed"
            fi
        else
            print_success "Static frontend detected, no build needed"
        fi
        
        cd ..
    else
        print_success "No frontend build required"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p backend/logs
    mkdir -p backend/uploads
    mkdir -p backend/temp
    mkdir -p backend/backups
    
    print_success "Directories created"
}

# Set file permissions
set_permissions() {
    print_status "Setting file permissions..."
    
    chmod +x backend/scripts/*.sh
    chmod +x scripts/*.sh
    
    print_success "Permissions set"
}

# Display next steps
show_next_steps() {
    echo ""
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update API keys in backend/.env file:"
    echo "   - OpenAI API Key"
    echo "   - Google Translate API Key" 
    echo "   - YouTube Data API Key"
    echo "   - MongoDB connection string"
    echo ""
    echo "2. Start the development server:"
    echo "   cd backend && npm run dev"
    echo ""
    echo "3. Open the frontend:"
    echo "   Open frontend/index.html in your browser"
    echo ""
    echo "4. For production deployment:"
    echo "   docker-compose up -d"
    echo ""
    echo "📚 Documentation: https://github.com/your-username/transcript-pro"
    echo ""
}

# Main setup function
main() {
    echo ""
    echo "============================================="
    echo "      TranscriptPro Setup Script"
    echo "============================================="
    echo ""
    
    # Run setup steps
    check_nodejs
    check_npm
    check_mongodb
    install_backend_deps
    setup_environment
    install_yt_dlp
    create_directories
    set_permissions
    build_frontend
    setup_database "$1"
    show_next_steps
}

# Script execution start
main "$@"
