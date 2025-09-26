#!/bin/bash

echo "🚀 Brand2Stand Backend Setup Script"
echo "===================================="

# Check if backend directory exists
if [ ! -d "backend" ]; then
  echo "❌ Backend directory not found"
  echo "Please run this script from the project root"
  exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo ""
  echo "⚠️  No .env file found in backend/"
  echo "Creating .env from template..."
  
  if [ -f "env-template.txt" ]; then
    cp env-template.txt .env
    echo "✅ Created backend/.env from template"
    echo ""
    echo "🔴 CRITICAL: Edit backend/.env and add your API keys:"
    echo "   - FAL_API_KEY"
    echo "   - OPENAI_API_KEY"
    echo ""
    echo "Get your keys from:"
    echo "   - Fal.ai: https://fal.ai/dashboard"
    echo "   - OpenAI: https://platform.openai.com/api-keys"
  else
    echo "❌ No env template found. Creating basic .env..."
    cat > .env << EOF
# Add your API keys here
FAL_API_KEY=your-fal-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
PORT=3001
FRONTEND_URL=http://localhost:5173
EOF
    echo "✅ Created basic backend/.env"
  fi
fi

# Check if API keys are configured
if grep -q "your-fal-api-key-here" .env; then
  echo ""
  echo "🔴 WARNING: Fal.ai API key not configured!"
  echo "   Edit backend/.env and add your actual FAL_API_KEY"
  echo ""
  read -p "Continue anyway? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Exiting. Please configure your API keys first."
    exit 1
  fi
fi

# Start the backend server
echo ""
echo "🚀 Starting backend server on port 3001..."
echo "===================================="
npm start
