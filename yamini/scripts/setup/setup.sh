#!/bin/bash

echo "======================================"
echo "Yamini Infotech Backend Setup Script"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql@15"
    echo "  Ubuntu: sudo apt install postgresql"
    exit 1
fi

echo "✅ PostgreSQL found"

# Check if database exists
echo ""
echo "Checking if database 'yamini_infotech' exists..."
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw yamini_infotech; then
    echo "✅ Database 'yamini_infotech' exists"
else
    echo "⚠️  Database 'yamini_infotech' does not exist"
    echo "Creating database..."
    psql -U postgres -c "CREATE DATABASE yamini_infotech;"
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database"
        echo "Please create it manually: psql -U postgres -c 'CREATE DATABASE yamini_infotech;'"
        exit 1
    fi
fi

# Create .env file if it doesn't exist
echo ""
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env and update your database credentials"
else
    echo "✅ .env file already exists"
fi

# Install Python dependencies
echo ""
echo "Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Initialize database
echo ""
echo "Initializing database..."
python3 init_db.py

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ Setup completed successfully!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Review and update .env file with your database credentials"
    echo "2. Start the server: uvicorn main:app --reload --port 8000"
    echo "3. Access API docs: http://localhost:8000/docs"
    echo ""
else
    echo "❌ Database initialization failed"
    echo "Please check the error messages above"
    exit 1
fi
