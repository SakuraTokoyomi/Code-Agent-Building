#!/bin/bash

# Setup script for Multi-Agent Code Generation System

echo "🚀 Setting up Multi-Agent Code Generation System..."

# Check Python version
echo "📋 Checking Python version..."
python_version=$(python --version 2>&1 | awk '{print $2}')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.8 or higher is required. You have $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python -m venv venv
    echo "✅ Virtual environment created"
else
    echo "ℹ️  Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Dependencies installed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p output

echo "✅ Directories created"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your API keys"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📌 Next steps:"
echo "1. Edit .env file and add your LLM API key"
echo "2. Activate virtual environment: source venv/bin/activate"
echo "3. Run the system: python main.py"
echo ""
echo "📚 For more information, see README.md"
