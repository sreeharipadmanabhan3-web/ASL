#!/bin/bash

echo "🤟 ASL Recognition App Setup"
echo "============================"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Check if python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ python3 is not installed. Please install Python 3 first."
    exit 1
fi

echo ""
echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo ""
echo "🔨 Building frontend..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server, run:"
echo "  cd backend && python run.py"
echo ""
echo "Then open http://localhost:5000 in your browser"
echo ""
echo "Default login: admin / 1234"
