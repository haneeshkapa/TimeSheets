#!/bin/bash

echo "Starting Timesheet Application..."

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Kill any existing processes
pkill -f "ts-node" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# Start backend with TypeScript
echo "Starting backend server on port 5001..."
cd backend
nohup npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "Starting frontend server on port 3000..."
cd ../frontend
nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "🚀 Timesheet Application is starting..."
echo ""
echo "📡 Backend API: http://localhost:5001"
echo "🌐 Frontend App: http://localhost:3000"
echo ""
echo "Demo Credentials:"
echo "Admin: admin / admin123"
echo "Users: john / user123 or jane / user123"
echo ""
echo "Logs:"
echo "Backend: backend/backend.log"  
echo "Frontend: frontend/frontend.log"
echo ""
echo "To stop the servers, run: pkill -f 'ts-node' && pkill -f 'react-scripts start'"