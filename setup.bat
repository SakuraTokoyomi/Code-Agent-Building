@echo off
REM Setup script for Multi-Agent Code Generation System (Windows)

echo 🚀 Setting up Multi-Agent Code Generation System...

REM Check Python version
echo 📋 Checking Python version...
python --version
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    exit /b 1
)

REM Create virtual environment
echo 📦 Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ℹ️  Virtual environment already exists
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo ✅ Dependencies installed

REM Create necessary directories
echo 📁 Creating directories...
if not exist "logs" mkdir logs
if not exist "output" mkdir output

echo ✅ Directories created

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit .env file and add your API keys
) else (
    echo ℹ️  .env file already exists
)

echo.
echo ✅ Setup complete!
echo.
echo 📌 Next steps:
echo 1. Edit .env file and add your LLM API key
echo 2. Activate virtual environment: venv\Scripts\activate.bat
echo 3. Run the system: python main.py
echo.
echo 📚 For more information, see README.md

pause
