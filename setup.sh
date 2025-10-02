#!/bin/bash

# MyBazaar Setup Script
# This script helps you set up the MyBazaar application

echo "🛒 MyBazaar Setup Script"
echo "========================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version 18 or higher is required"
    echo "   Current version: $(node -v)"
    echo "   Please upgrade Node.js and try again"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install backend dependencies"
        exit 1
    fi
else
    echo "✅ Backend dependencies already installed"
fi
cd ..
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "✅ Frontend dependencies already installed"
fi
cd ..
echo ""

# Check for .env files
echo "🔧 Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found"
    echo "   Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo "   📝 Please edit backend/.env with your configuration"
else
    echo "✅ Backend .env file exists"
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Frontend .env file not found"
    echo "   Copying from .env.example..."
    cp frontend/.env.example frontend/.env
    echo "   📝 Please edit frontend/.env with your configuration"
else
    echo "✅ Frontend .env file exists"
fi
echo ""

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p backend/uploads
echo "✅ Uploads directory created"
echo ""

# Final instructions
echo "✅ Setup complete!"
echo ""
echo "📋 Next Steps:"
echo "==============="
echo ""
echo "1. Set up your database:"
echo "   - Create a Supabase account at https://supabase.com"
echo "   - Create a new project"
echo "   - Run the SQL from database-schema.sql in the SQL Editor"
echo "   - Copy your connection details to backend/.env"
echo ""
echo "2. Configure environment variables:"
echo "   - Edit backend/.env with your database credentials"
echo "   - Edit frontend/.env with your API URL"
echo ""
echo "3. Start the development servers:"
echo "   Terminal 1 (Backend):"
echo "     cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "     cd frontend && npm start"
echo ""
echo "4. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - WebSocket: ws://localhost:5001"
echo ""
echo "📖 For detailed instructions, see README.md and DEPLOYMENT.md"
echo ""
echo "🎓 Happy coding! Made for students, by students."
