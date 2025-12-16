# Multi-Agent Code Generation System

A sophisticated multi-agent collaborative system for autonomous software development, built for COMP7103C Course Assignment.

## 🎯 Overview

This system uses specialized AI agents to autonomously complete software development tasks from natural language descriptions. It implements a multi-agent architecture where agents collaborate to plan, code, and evaluate complete software projects.

## 🏗️ Architecture

### Core Components

1. **Project Planning Agent**
   - Analyzes requirements and designs software architecture
   - Breaks down tasks into executable sub-tasks
   - Specializes in frontend-first solutions
   - Creates detailed implementation plans

2. **Code Generation Agent**
   - Implements code based on task specifications
   - Expert in HTML5, CSS3, JavaScript, jQuery, Bootstrap
   - Uses function calling to create files
   - Focuses on simplicity and robustness

3. **Code Evaluation Agent**
   - Reviews code quality and functionality
   - Identifies bugs and security issues
   - Provides improvement recommendations
   - Validates requirements compliance

4. **Multi-Agent Orchestrator**
   - Coordinates agent communication
   - Manages task scheduling and dependencies
   - Tracks global project state
   - Handles iteration and refinement

### Tool Kit

The system provides agents with:
- **Filesystem Tools**: `create_file`, `read_file`, `list_files`, `create_directory`
- **Web Search Tool**: Simulated search for documentation and resources
- **Code Execution Tool**: Safe command execution for validation

## 🚀 Quick Start

### Prerequisites

```bash
# Python 3.8 or higher
python --version

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Set up your LLM API credentials:

```bash
# For custom LLM provider (OpenAI-compatible API)
export LLM_API_KEY="your-api-key"
export LLM_BASE_URL="https://api.your-provider.com/v1"
export LLM_MODEL="your-model-name"

# Or for specific providers
export DEEPSEEK_API_KEY="your-deepseek-key"
export OPENAI_API_KEY="your-openai-key"
```

### Basic Usage

Run with default task (arXiv CS Daily webpage):

```bash
python main.py
```

Run with custom task:

```bash
python main.py --task "Build a todo list web application with local storage"
```

Run with specific output directory:

```bash
python main.py --output ./my_project --provider custom
```

Skip evaluation for faster execution:

```bash
python main.py --no-evaluation
```

## 📋 Command-Line Options

```
--task TEXT          Task description in natural language
--output PATH        Output directory (default: ./output)
--provider CHOICE    LLM provider: deepseek, openai, custom (default: custom)
--no-evaluation      Skip code evaluation phase for faster execution
```

## 🎓 Test Case: arXiv CS Daily Webpage

The default test case implements an "arXiv CS Daily" webpage with:

1. **Domain-Specific Navigation**
   - Categories for cs.AI, cs.CV, cs.LG, cs.CL, cs.SY, cs.TH
   - Quick filtering between subfields

2. **Daily Updated Paper List**
   - Paper titles with hyperlinks
   - Submission times
   - arXiv field tags
   - Fetches from arXiv API

3. **Paper Detail Page**
   - PDF links to arXiv
   - Author information with affiliations
   - Citation generation (BibTeX, standard)
   - One-click copy functionality

### Running the Test Case

```bash
python main.py
```

The system will:
1. Plan the project architecture
2. Generate HTML, CSS, and JavaScript files
3. Create a complete single-page application
4. Evaluate code quality (unless skipped)

Output files will be in `./output/` directory.

## 📁 Project Structure

```
Code-Agent/
├── main.py              # Main entry point with CLI
├── orchestrator.py      # Multi-agent orchestrator
├── agents.py            # Specialized agent implementations
├── llm_client.py        # LLM API client wrapper
├── tools.py             # Tool kit for agents
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── logs/               # Execution logs (auto-created)
│   └── agent_system.log
└── output/             # Generated code (auto-created)
    ├── index.html
    ├── result.json
    └── execution_log.json
```

## 🔧 Configuration

Edit `config.py` to customize:

```python
# LLM provider settings
DEFAULT_PROVIDER = "custom"  # or "deepseek", "openai"

# Agent parameters
AGENT_CONFIG = {
    "planning_agent": {
        "temperature": 0.7,
        "max_tokens": 4000
    },
    "coding_agent": {
        "temperature": 0.3,  # Lower for more deterministic code
        "max_tokens": 4000
    },
    "evaluation_agent": {
        "temperature": 0.5,
        "max_tokens": 3000
    }
}

# Output directories
LOG_DIR = "./logs"
OUTPUT_DIR = "./output"
```

## 📊 Output Files

After execution, find these files in the output directory:

- **Generated Code Files**: HTML, CSS, JS files for your project
- **result.json**: Execution summary with statistics
- **execution_log.json**: Detailed progress log
- **logs/agent_system.log**: Complete system logs

## 🎨 Features

### Progress Tracking
- Real-time colored console output
- Progress bars for task execution
- Phase indicators (Planning, Coding, Evaluating)

### Logging
- Comprehensive file logging
- Timestamped execution logs
- JSON-formatted result summaries

### Error Handling
- Robust error recovery
- Retry logic for LLM API calls
- Graceful degradation

### Code Quality
- Frontend-first approach
- Clean, readable code
- Comprehensive error handling
- User feedback mechanisms (loading indicators, progress bars)

## 🧪 Example Usage

### Example 1: Todo List Application

```bash
python main.py --task "Create a todo list web app with these features:
- Add, edit, delete todos
- Mark as complete
- Filter by status
- Local storage persistence
- Bootstrap UI"
```

### Example 2: Weather Dashboard

```bash
python main.py --task "Build a weather dashboard that:
- Shows current weather for user location
- 5-day forecast
- Search by city
- Weather icons
- Responsive design"
```

### Example 3: Portfolio Website

```bash
python main.py --task "Generate a personal portfolio website with:
- Home page with introduction
- Projects section with cards
- Contact form
- Smooth scrolling
- Modern design"
```

## 🔍 How It Works

1. **Planning Phase**
   - Agent analyzes task description
   - Designs architecture and file structure
   - Creates task breakdown with dependencies

2. **Coding Phase**
   - For each task in the plan:
     - Agent receives task specification
     - Uses tools to create files
     - Generates complete, working code

3. **Evaluation Phase** (optional)
   - Reviews generated code
   - Checks functionality and quality
   - Identifies issues and improvements

4. **Iteration** (if needed)
   - System can iterate based on evaluation
   - Fixes critical issues
   - Refines implementation

## 🛠️ Supported LLM Providers

### DeepSeek
```bash
export DEEPSEEK_API_KEY="your-key"
python main.py --provider deepseek
```

### OpenAI
```bash
export OPENAI_API_KEY="your-key"
python main.py --provider openai
```

### Custom (Any OpenAI-compatible API)
```bash
export LLM_API_KEY="your-key"
export LLM_BASE_URL="https://api.example.com/v1"
export LLM_MODEL="model-name"
python main.py --provider custom
```

Recommended models:
- DeepSeek V3.1
- GPT-4
- Claude (via proxy)
- Qwen Coder
- Llama 3.3

## 📈 Performance Tips

1. **Use appropriate models**:
   - Development: Smaller models (faster, cheaper)
   - Production: Larger models (better quality)

2. **Skip evaluation** for faster iteration:
   ```bash
   python main.py --no-evaluation
   ```

3. **Adjust temperature** in `config.py`:
   - Lower (0.2-0.4) for more deterministic code
   - Higher (0.7-0.9) for more creative solutions

4. **Monitor logs** for debugging:
   ```bash
   tail -f logs/agent_system.log
   ```

## 🐛 Troubleshooting

### API Connection Issues
```bash
# Check your API key is set
echo $LLM_API_KEY

# Test API connection
curl -H "Authorization: Bearer $LLM_API_KEY" $LLM_BASE_URL/models
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

### Permission Errors
```bash
# Ensure output directory is writable
chmod 755 ./output
```

## 📝 Logging

The system provides comprehensive logging:

- **Console Output**: Colored, real-time progress
- **File Logs**: `logs/agent_system.log`
- **Execution Log**: `output/execution_log.json`
- **Result Summary**: `output/result.json`

View logs:
```bash
# View latest log
tail -100 logs/agent_system.log

# Follow logs in real-time
tail -f logs/agent_system.log

# View execution summary
cat output/result.json | python -m json.tool
```

## 🎯 Design Principles

1. **Simplicity First**: Generate the simplest code that works
2. **Frontend Focus**: Solve problems in the browser when possible
3. **Progressive Enhancement**: Start basic, enhance gradually
4. **User Feedback**: Always include loading states and error messages
5. **Robustness**: Handle errors gracefully with fallbacks
6. **Clean Code**: Readable, maintainable, well-structured

## 🤝 Contributing

This is a course project for COMP7103C. For improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use for educational purposes.

## 👥 Authors

COMP7103C Course Assignment Project

## 📧 Contact

For questions about this project:
- TA: Zongwei Li (zongwei9888@gmail.com)
- TA: Yangqin Jiang (mrjiangyq99@gmail.com)

## 🙏 Acknowledgments

- Course: COMP7103C - Data Mining
- Inspired by: AutoGen, ChatDev, and other multi-agent frameworks
- Built with: OpenAI API, Claude, DeepSeek, and other LLMs

## 📚 References

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [arXiv API Documentation](https://arxiv.org/help/api/)
- [Bootstrap Documentation](https://getbootstrap.com/)
- [jQuery Documentation](https://jquery.com/)

---

**Happy Coding! 🚀**
