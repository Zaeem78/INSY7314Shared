#!/bin/bash

# International Payment System Startup Script
echo "🚀 Starting International Payment System..."
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Function to install dependencies if node_modules doesn't exist
install_deps() {
    local dir=$1
    local name=$2

    if [ ! -d "$dir/node_modules" ]; then
        echo "📦 Installing dependencies for $name..."
        cd "$dir"
        npm install
        cd ..
    else
        echo "✅ Dependencies already installed for $name"
    fi
}

# Install backend dependencies
install_deps "backend" "Backend API"

# Install frontend dependencies
install_deps "frontend" "Frontend App"

echo ""
echo "🎯 Starting servers..."
echo "===================="

# Start backend (in background)
echo "🔧 Starting Backend API on port 3001..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🌐 Starting Frontend App on port 3000..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 International Payment System is running!"
echo "========================================"
echo "📊 Backend API: http://localhost:3001"
echo "🌐 Frontend App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
wait $BACKEND_PID $FRONTEND_PID
