# Quick Start Guide

## Multi-Agent Code Generation System

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd /mnt/g/HKU_course/data_mining/Code-Agent
   ```

2. **Run setup script:**
   ```bash
   # Linux/Mac
   ./setup.sh

   # Windows
   setup.bat
   ```

3. **Configure API key:**
   ```bash
   # Edit .env file
   cp .env.example .env
   nano .env  # or use your preferred editor
   ```

   Add your LLM API credentials:
   ```
   LLM_API_KEY=your-api-key-here
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_MODEL=gpt-4
   ```

4. **Test the system:**
   ```bash
   python test_system.py
   ```

### Usage

**Default task (arXiv CS Daily webpage):**
```bash
python main.py
```

**Custom task:**
```bash
python main.py --task "Build a todo list app with Bootstrap"
```

**Faster execution (skip evaluation):**
```bash
python main.py --no-evaluation
```

**Custom output directory:**
```bash
python main.py --output ./my_project
```

### Output

Generated files will be in `./output/` directory:
- HTML, CSS, JavaScript files
- `result.json` - Execution summary
- `execution_log.json` - Detailed progress log

### Project Structure

```
Code-Agent/
├── main.py              # Entry point
├── orchestrator.py      # Multi-agent coordinator
├── agents.py            # Planning, Coding, Evaluation agents
├── llm_client.py        # LLM API wrapper
├── tools.py             # Filesystem, web, execution tools
├── config.py            # Configuration
├── requirements.txt     # Dependencies
├── test_system.py       # System tests
├── README.md            # Full documentation
├── PROJECT_REPORT_TEMPLATE.md  # Report template
└── QUICK_START.md       # This file
```

### Key Features

- **3 Specialized Agents**: Planning, Coding, Evaluation
- **Multi-Agent Orchestration**: Automatic task coordination
- **Real-time Progress**: Colored console output with progress bars
- **Comprehensive Logging**: JSON logs and file logs
- **Error Recovery**: Retry logic and robust error handling
- **Frontend Optimization**: HTML, jQuery, Bootstrap expertise

### Troubleshooting

**No API key configured:**
```bash
export LLM_API_KEY="your-key"
python main.py
```

**Import errors:**
```bash
pip install -r requirements.txt --upgrade
```

**Permission errors:**
```bash
chmod 755 ./output
```

### Next Steps

1. Run the default test case to verify installation
2. Review generated code in `./output/`
3. Try custom tasks
4. Read full documentation in README.md
5. Use PROJECT_REPORT_TEMPLATE.md for your report

### Support

For questions:
- TA: Zongwei Li (zongwei9888@gmail.com)
- TA: Yangqin Jiang (mrjiangyq99@gmail.com)

---

**Happy Coding!**
