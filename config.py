"""
Configuration for the Multi-Agent Code Generation System
"""

import os
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Load .env file from the same directory as this config file
    env_path = Path(__file__).parent / '.env'
    load_dotenv(dotenv_path=env_path)
except ImportError:
    # If python-dotenv is not installed, skip loading
    pass

# LLM API Configuration
# You can use any of these models - just set your API key and base URL
LLM_CONFIGS = {
    "deepseek": {
        "api_key": os.getenv("DEEPSEEK_API_KEY", ""),
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat"
    },
    "openai": {
        "api_key": os.getenv("OPENAI_API_KEY", ""),
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    },
    "custom": {
        "api_key": os.getenv("LLM_API_KEY", ""),
        "base_url": os.getenv("LLM_BASE_URL", "https://api.openai.com/v1"),
        "model": os.getenv("LLM_MODEL", "gpt-4")
    }
}

# Default LLM provider to use
DEFAULT_PROVIDER = "custom"


# Agent Configuration
AGENT_CONFIG = {
    "planning_agent": {
        "name": "Project Planning Agent",
        "temperature": 0.7,
        "max_tokens": 4000
    },
    "coding_agent": {
        "name": "Code Generation Agent",
        "temperature": 0.3,
        "max_tokens": 4000
    },
    "evaluation_agent": {
        "name": "Code Evaluation Agent",
        "temperature": 0.5,
        "max_tokens": 3000
    }
}

# Logging Configuration
LOG_DIR = "./logs"
LOG_FILE = "agent_system.log"

# Output Configuration
OUTPUT_DIR = "./output"
