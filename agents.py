"""
Specialized Agents for Multi-Agent System
- Project Planning Agent
- Code Generation Agent
- Code Evaluation Agent
"""

import json
from typing import List, Dict, Any, Optional
from llm_client import LLMClient
from tools import ToolManager
import logging


class BaseAgent:
    """Base class for all agents"""

    def __init__(
            self,
            name: str,
            llm_client: LLMClient,
            tool_manager: ToolManager,
            temperature: float = 0.7,
            max_tokens: int = 4000
    ):
        self.name = name
        self.llm_client = llm_client
        self.tool_manager = tool_manager
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.conversation_history: List[Dict[str, str]] = []
        self.logger = logging.getLogger(self.name)

    def get_system_prompt(self) -> str:
        """Return the system prompt for this agent"""
        raise NotImplementedError

    def reset_conversation(self):
        """Reset conversation history"""
        self.conversation_history = []

    def add_message(self, role: str, content: str):
        """Add a message to conversation history"""
        self.conversation_history.append({
            "role": role,
            "content": content
        })

    def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a task"""
        raise NotImplementedError


class ProjectPlanningAgent(BaseAgent):
    """Agent responsible for project planning and task decomposition"""

    def get_system_prompt(self) -> str:
        return """You are a Senior Software Architect and Project Planning Agent specializing in frontend development.

Your responsibilities:
1. Analyze project requirements and break them down into concrete, executable tasks
2. Design software architecture focusing on simplicity and frontend technologies
3. Create detailed implementation plans with clear specifications
4. Prioritize using native HTML, jQuery, Bootstrap, and vanilla JavaScript
5. Minimize complexity - choose the simplest solution that works
6. Plan for robustness, error handling, and user feedback (progress bars, logs)
7. **CRITICAL: For API-dependent projects, plan API testing and validation FIRST**

**SPECIAL ATTENTION FOR arXiv/API-BASED PROJECTS:**

When planning projects that use external APIs (especially arXiv):

⚠️ **ALWAYS include an API Testing task as Task #1:**
- Test API connectivity and CORS restrictions
- Verify data can be fetched successfully
- Document any limitations (CORS, rate limits, etc.)
- Plan fallback strategies BEFORE writing main application code

⚠️ **API Integration Strategy:**
- Assume browser CORS restrictions exist for all third-party APIs
- Plan for BOTH online (API) and offline (sample data) modes
- Include comprehensive error handling for ALL API calls
- Always provide sample/mock data as fallback
- Never depend solely on external API availability

⚠️ **Robustness Requirements:**
- Application MUST work even if API is completely unavailable
- Clear user feedback for API failures
- Automatic fallback to cached or sample data
- Retry logic with exponential backoff
- Visual indicators for data source (live API vs. sample data)

When planning projects:
- Break down requirements into 5-9 clear, actionable tasks
- **Task 1 should ALWAYS be API testing/validation for API-dependent projects**
- For each task, specify:
  * Task ID and title
  * Detailed description
  * Files to create/modify
  * Key implementation details (especially API handling)
  * Dependencies on other tasks
- Focus on frontend-first solutions
- Prefer CDN-hosted libraries over npm packages
- Plan for single-page applications when possible
- Include error handling and user feedback mechanisms

**Example Task Structure for arXiv Projects:**

Task 1: API Connectivity Testing and Fallback Setup
- Test arXiv API endpoints
- Identify CORS restrictions
- Create sample data structure
- Implement fallback mechanism

Task 2: Base HTML and UI Structure
- Create main page layout
- Set up navigation
- Add loading states

Task 3: API Integration Module
- Build API client with error handling
- Implement retry logic
- Add sample data fallback
- Cache responses

[... remaining tasks ...]

Output your plan as a JSON object with this structure:
{
  "project_overview": "Brief description of the project",
  "architecture": "High-level architecture description focusing on frontend",
  "api_considerations": "Special notes about API usage, CORS issues, fallback strategies",
  "technology_stack": ["List of technologies to use"],
  "tasks": [
    {
      "task_id": "T1",
      "title": "API Testing and Validation",
      "description": "Test arXiv API connectivity, identify CORS issues, create fallback data",
      "files": ["js/api-test.js", "data/sample-papers.json"],
      "implementation_details": "Create a test module that attempts API calls and documents results. Prepare sample data for fallback.",
      "dependencies": [],
      "priority": "CRITICAL"
    }
  ],
  "file_structure": {
    "index.html": "Main HTML file",
    "css/": "Stylesheets directory",
    "js/": "JavaScript files directory",
    "data/": "Sample/fallback data directory"
  }
}

Be specific, actionable, and focus on simplicity. **ALWAYS plan for API failure scenarios.**"""

    def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute planning task"""
        self.logger.info(f"Starting project planning for task: {task[:100]}...")

        # Build messages
        messages = [
            {"role": "system", "content": self.get_system_prompt()},
            {"role": "user", "content": f"Plan the following project:\n\n{task}"}
        ]

        if context:
            messages.append({
                "role": "user",
                "content": f"Additional context:\n{json.dumps(context, indent=2)}"
            })

        # Call LLM
        response = self.llm_client.retry_chat_completion(
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )

        if not response["success"]:
            self.logger.error(f"Planning failed: {response.get('error')}")
            return {
                "success": False,
                "error": response.get("error"),
                "plan": None
            }

        # Parse the plan
        try:
            content = response["content"]
            self.logger.info(f"Received planning response: {len(content)} characters")

            # Extract JSON from response
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                json_str = content[json_start:json_end].strip()
            elif "```" in content:
                json_start = content.find("```") + 3
                json_end = content.find("```", json_start)
                json_str = content[json_start:json_end].strip()
            else:
                # Try to find JSON object
                json_start = content.find("{")
                json_end = content.rfind("}") + 1
                json_str = content[json_start:json_end].strip()

            plan = json.loads(json_str)

            self.logger.info(f"Successfully parsed plan with {len(plan.get('tasks', []))} tasks")

            return {
                "success": True,
                "plan": plan,
                "raw_response": content
            }

        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse plan JSON: {str(e)}")
            # Return raw content as fallback
            return {
                "success": False,
                "error": f"Failed to parse plan: {str(e)}",
                "plan": None,
                "raw_response": response["content"]
            }


class CodeGenerationAgent(BaseAgent):
    """Agent responsible for generating code based on tasks"""

    def get_system_prompt(self) -> str:
        return """You are an Expert Frontend Developer specialized in creating clean, functional web applications.

Your expertise:
- Native HTML5, CSS3, and vanilla JavaScript
- jQuery for DOM manipulation and AJAX
- Bootstrap 5 for responsive layouts
- Single-page application patterns
- API integration and data fetching
- Error handling and user feedback

Your development principles:
1. **Simplicity First**: Write the simplest code that works
2. **Frontend Focus**: Solve problems in the browser when possible
3. **CDN Libraries**: Use CDN-hosted libraries (Bootstrap, jQuery)
4. **Progressive Enhancement**: Start with basic functionality, enhance gradually
5. **User Feedback**: Always include loading states, progress indicators, and error messages
6. **Robustness**: Handle errors gracefully, validate data, provide fallbacks
7. **Clean Code**: Well-structured, readable, with clear comments only where needed
8. **API Resilience**: ALWAYS assume external APIs may fail

**CRITICAL: API Integration Best Practices**

When working with external APIs (especially arXiv, GitHub, etc.):

⚠️ **MANDATORY Requirements:**
1. **Test API First**: Before implementing full features, test if API is accessible
2. **Assume CORS Issues**: Browser will block most third-party API calls
3. **Always Have Fallback**: Include sample/mock data that works offline
4. **Never Trust API**: Wrap ALL API calls in try-catch with error handling
5. **User Feedback**: Show clear messages about data source (live vs. sample)

⚠️ **arXiv API Specific:**
- URL: `http://export.arxiv.org/api/query` (note: HTTP, not HTTPS)
- **WILL FAIL in browser due to CORS** - this is expected!
- **Solution**: Provide rich sample data immediately
- Parse XML response format
- Handle rate limiting (3 seconds between requests)
- Show users sample data with clear notice

⚠️ **Code Structure for API Calls:**

```javascript
// Example API client with proper error handling
function fetchFromAPI(params) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: API_URL,
            method: 'GET',
            dataType: 'xml', // or 'json'
            timeout: 10000,
            success: function(data) {
                resolve(parseData(data));
            },
            error: function(xhr, status, error) {
                console.warn('API call failed:', error);
                console.info('Using sample data as fallback');
                // IMMEDIATELY fallback to sample data
                resolve(getSampleData());
            }
        });
    });
}

// Always have rich sample data ready
function getSampleData() {
    return [
        {
            id: '2306.12345',
            title: 'Sample Research Paper Title',
            authors: ['Author One', 'Author Two'],
            abstract: 'Detailed abstract text...',
            // ... complete data structure
        },
        // ... more samples (at least 5-10 for good demo)
    ];
}
```

When generating code:
- Create complete, working files (no placeholders or TODOs)
- Use modern but widely-supported JavaScript features
- Include error handling for all async operations
- Add loading indicators for network requests
- Log important events to console for debugging
- Make UI responsive with Bootstrap grid system
- Use semantic HTML5 elements
- Follow accessibility best practices
- **ALWAYS include sample data for APIs**
- **ALWAYS assume API will fail and handle gracefully**

You have access to these tools:
- create_file: Create a new file with content
- read_file: Read existing file content
- create_directory: Create directories
- web_search: Search for documentation or resources

**For arXiv Projects Specifically:**

When creating API integration:
1. Create sample data JSON file FIRST
2. Build API client with immediate fallback
3. Test that app works with sample data ONLY
4. Add API call as enhancement (that gracefully fails)
5. Show badge/indicator: "📊 Demo Mode" vs "🌐 Live Data"

Use tools to create files. Always create complete, functional code that works even without API access."""

    def execute(self, task: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute code generation task"""
        task_id = task.get("task_id", "unknown")
        self.logger.info(f"Starting code generation for task: {task_id}")

        # Reset conversation for each task
        self.reset_conversation()

        # Build initial message
        task_description = f"""Generate code for this task:

Task ID: {task.get('task_id')}
Title: {task.get('title')}
Description: {task.get('description')}
Files to create: {', '.join(task.get('files', []))}
Implementation details: {task.get('implementation_details', 'None')}

Generate complete, working code. Use the create_file tool to create each file.
Make sure the code is production-ready with proper error handling and user feedback."""

        messages = [
            {"role": "system", "content": self.get_system_prompt()},
            {"role": "user", "content": task_description}
        ]

        if context:
            messages.append({
                "role": "user",
                "content": f"Additional context:\n{json.dumps(context, indent=2)}"
            })

        # Execute with tool calling
        max_iterations = 10
        iteration = 0
        created_files = []

        while iteration < max_iterations:
            iteration += 1
            self.logger.info(f"Iteration {iteration}/{max_iterations}")

            # Get all available tools
            tools = self.tool_manager.get_all_tools()

            # Call LLM with tools
            response = self.llm_client.retry_chat_completion(
                messages=messages,
                tools=tools,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )

            if not response["success"]:
                self.logger.error(f"Code generation failed: {response.get('error')}")
                return {
                    "success": False,
                    "error": response.get("error"),
                    "created_files": created_files
                }

            # Add assistant message to history
            assistant_content = response["content"] or ""
            if response["tool_calls"]:
                # Format tool calls for message history
                formatted_tool_calls = []
                for tc in response["tool_calls"]:
                    try:
                        formatted_tool_calls.append({
                            "id": tc["id"],
                            "type": tc["type"],
                            "function": {
                                "name": tc["function"]["name"],
                                "arguments": json.dumps(tc["function"]["arguments"], ensure_ascii=False)
                            }
                        })
                    except Exception as e:
                        self.logger.warning(f"Failed to format tool call: {str(e)}")
                        continue

                messages.append({
                    "role": "assistant",
                    "content": assistant_content,
                    "tool_calls": formatted_tool_calls
                })
            else:
                messages.append({
                    "role": "assistant",
                    "content": assistant_content
                })

            # If no tool calls, we're done
            if not response["tool_calls"]:
                self.logger.info("Code generation completed")
                break

            # Execute tool calls
            for tool_call in response["tool_calls"]:
                tool_name = tool_call["function"]["name"]
                tool_args = tool_call["function"]["arguments"]

                self.logger.info(f"Executing tool: {tool_name}")

                # Execute tool
                result = self.tool_manager.execute_tool(tool_name, tool_args)

                # Track created files
                if tool_name == "create_file" and result.get("success"):
                    created_files.append(tool_args.get("file_path"))

                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": json.dumps(result)
                })

        return {
            "success": True,
            "created_files": created_files,
            "iterations": iteration,
            "final_message": messages[-1].get("content") if messages else None
        }


class CodeEvaluationAgent(BaseAgent):
    """Agent responsible for evaluating code quality and functionality"""

    def get_system_prompt(self) -> str:
        return """You are a Senior Code Reviewer and Quality Assurance Engineer.

Your responsibilities:
1. Review code for correctness, quality, and best practices
2. Test functionality against requirements
3. Identify bugs, security issues, and potential improvements
4. Verify error handling and edge cases
5. Check code readability and maintainability

Evaluation criteria:
- **Functionality**: Does it meet the requirements?
- **Correctness**: Are there logical errors or bugs?
- **Robustness**: Does it handle errors and edge cases?
- **Code Quality**: Is it clean, readable, and maintainable?
- **Best Practices**: Does it follow frontend best practices?
- **User Experience**: Does it provide good feedback to users?
- **Security**: Are there any security vulnerabilities?

You have access to tools to read files and examine the code structure.

Provide your evaluation as a JSON object:
{
  "overall_quality": "excellent|good|fair|poor",
  "functionality_score": 0-10,
  "code_quality_score": 0-10,
  "robustness_score": 0-10,
  "issues": [
    {
      "severity": "critical|major|minor",
      "type": "bug|security|quality|style",
      "description": "Issue description",
      "file": "affected_file.js",
      "suggestion": "How to fix it"
    }
  ],
  "strengths": ["List of things done well"],
  "recommendations": ["Suggestions for improvement"],
  "passes_requirements": true/false
}

Be thorough but fair in your evaluation."""

    def execute(self, task: Dict[str, Any], files: List[str], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute code evaluation"""
        self.logger.info(f"Starting code evaluation for {len(files)} files")

        # Reset conversation
        self.reset_conversation()

        # Read all files
        file_contents = {}
        for file_path in files:
            result = self.tool_manager.execute_tool("read_file", {"file_path": file_path})
            if result.get("success"):
                file_contents[file_path] = result.get("content", "")
            else:
                self.logger.warning(f"Could not read file: {file_path}")

        # Build evaluation request
        evaluation_request = f"""Evaluate the code for this task:

Task: {task.get('title')}
Description: {task.get('description')}
Requirements: {task.get('implementation_details', 'See description')}

Files created: {len(file_contents)}

"""

        for file_path, content in file_contents.items():
            evaluation_request += f"\n--- {file_path} ---\n{content}\n"

        messages = [
            {"role": "system", "content": self.get_system_prompt()},
            {"role": "user", "content": evaluation_request}
        ]

        # Call LLM
        response = self.llm_client.retry_chat_completion(
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )

        if not response["success"]:
            self.logger.error(f"Evaluation failed: {response.get('error')}")
            return {
                "success": False,
                "error": response.get("error"),
                "evaluation": None
            }

        # Parse evaluation
        try:
            content = response["content"]

            # Extract JSON from response
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                json_str = content[json_start:json_end].strip()
            elif "```" in content:
                json_start = content.find("```") + 3
                json_end = content.find("```", json_start)
                json_str = content[json_start:json_end].strip()
            else:
                json_start = content.find("{")
                json_end = content.rfind("}") + 1
                json_str = content[json_start:json_end].strip()

            evaluation = json.loads(json_str)

            self.logger.info(f"Evaluation completed: {evaluation.get('overall_quality')}")

            return {
                "success": True,
                "evaluation": evaluation,
                "raw_response": content
            }

        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse evaluation JSON: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to parse evaluation: {str(e)}",
                "evaluation": None,
                "raw_response": response["content"]
            }
