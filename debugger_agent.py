"""
Enhanced Code Evaluation Agent with Self-Debugging Capability
Detects common frontend issues like CORS, missing dependencies, etc.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from llm_client import LLMClient
from tools import ToolManager


class CodeDebuggerAgent:
    """Agent that can detect and fix common code issues"""

    def __init__(
            self,
            name: str,
            llm_client: LLMClient,
            tool_manager: ToolManager,
            temperature: float = 0.3,
            max_tokens: int = 4000
    ):
        self.name = name
        self.llm_client = llm_client
        self.tool_manager = tool_manager
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.logger = logging.getLogger(self.name)

    def get_system_prompt(self) -> str:
        return """You are an Expert Code Debugger and Problem Solver specializing in frontend web development.

Your expertise includes detecting and fixing:
1. **CORS Issues**: Identify when frontend code tries to access APIs that don't allow CORS
2. **Missing Dependencies**: Detect missing libraries or incorrect CDN links
3. **API Integration Problems**: Find issues with API calls and data fetching
4. **JavaScript File Loading Issues**: Detect missing script tags or wrong file paths
5. **Common JavaScript Errors**: Identify syntax errors, undefined variables, etc.

**CRITICAL PRIORITIES FOR API-BASED APPLICATIONS:**

⚠️ **#1 Priority: Check JavaScript File Loading**
- Verify all script tags reference existing files
- Check file names match (e.g., main.js vs app.js)
- Ensure correct loading order (dependencies first)
- Common issue: HTML references js/main.js but file is js/app.js

⚠️ **#2 Priority: CORS and API Issues**
Problem: Browser blocks direct AJAX/fetch calls to http://export.arxiv.org/api
- Solution: Use JSONP or create a proxy, OR provide sample data fallback

⚠️ **#3 Priority: Sample Data Fallback**
- Check if sample data exists and is comprehensive
- Verify fallback logic works correctly
- Ensure app displays something even if API fails

**Your Task:**
1. Analyze the code files provided
2. Identify specific issues that would prevent the code from working
3. Generate FIXES for each issue
4. Use create_file tool to write corrected versions

**PRIORITY ORDER FOR FIXES:**
1. Fix script tag references (file paths, loading order)
2. Add missing sample data files
3. Fix CORS/API issues with proper fallback
4. Add error handling and user feedback
5. Fix other bugs

**IMPORTANT:**
- For script loading issues, ALWAYS fix the HTML file
- For arXiv API CORS issue, ensure sample data fallback works
- Always create complete, working files (no placeholders)
- Test your fix logic mentally before generating code
- Focus on making the app WORK, not just theoretically correct

Output your analysis as JSON:
{
  "issues_found": [
    {
      "type": "script_loading|cors|missing_dep|api|syntax|other",
      "severity": "critical|major|minor",
      "file": "path/to/file.js",
      "description": "Detailed description of the issue",
      "fix_needed": true/false
    }
  ],
  "fixes": [
    {
      "file": "path/to/file.js",
      "action": "replace|create|modify",
      "reason": "Why this fix is needed"
    }
  ]
}

After analysis, use create_file tool to create fixed versions."""

    def analyze_and_fix(self, files: List[str], project_description: str) -> Dict[str, Any]:
        """Analyze code for issues and generate fixes"""
        self.logger.info(f"Analyzing {len(files)} files for issues...")

        # Read all files
        file_contents = {}
        for file_path in files:
            result = self.tool_manager.execute_tool("read_file", {"file_path": file_path})
            if result.get("success"):
                file_contents[file_path] = result.get("content", "")
            else:
                self.logger.warning(f"Could not read file: {file_path}")

        if not file_contents:
            return {
                "success": False,
                "error": "No files to analyze",
                "issues_found": [],
                "fixed_files": []
            }

        # Build analysis request
        analysis_request = f"""Analyze this code for issues that prevent it from working:

Project Description: {project_description}

Files to analyze:
"""

        for file_path, content in file_contents.items():
            analysis_request += f"\n--- {file_path} ---\n{content[:3000]}\n"  # Limit content length

        analysis_request += """

IMPORTANT: Look specifically for:
1. CORS issues when calling external APIs (like arXiv)
2. Missing error handling
3. Broken API integration

If you find the arXiv CORS issue, you MUST fix it by:
- Adding a fallback to use sample data when API fails
- Ensuring the app still works even if API is blocked

Generate fixes for ALL critical issues found."""

        # Create messages
        messages = [
            {"role": "system", "content": self.get_system_prompt()},
            {"role": "user", "content": analysis_request}
        ]

        # Get tools
        tools = self.tool_manager.get_all_tools()

        # Execute with tool calling
        max_iterations = 5
        iteration = 0
        fixed_files = []
        analysis_result = None

        while iteration < max_iterations:
            iteration += 1
            self.logger.info(f"Debug iteration {iteration}/{max_iterations}")

            response = self.llm_client.retry_chat_completion(
                messages=messages,
                tools=tools,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )

            if not response["success"]:
                self.logger.error(f"Debug analysis failed: {response.get('error')}")
                break

            # Try to extract analysis from response
            if response["content"] and not analysis_result:
                try:
                    content = response["content"]
                    if "```json" in content:
                        json_start = content.find("```json") + 7
                        json_end = content.find("```", json_start)
                        json_str = content[json_start:json_end].strip()
                    elif "{" in content:
                        json_start = content.find("{")
                        json_end = content.rfind("}") + 1
                        json_str = content[json_start:json_end].strip()
                    else:
                        json_str = ""

                    if json_str:
                        analysis_result = json.loads(json_str)
                        self.logger.info(f"Found {len(analysis_result.get('issues_found', []))} issues")
                except:
                    pass

            # Add assistant message
            assistant_content = response["content"] or ""
            if response["tool_calls"]:
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
                self.logger.info("Debug analysis completed")
                break

            # Execute tool calls
            for tool_call in response["tool_calls"]:
                tool_name = tool_call["function"]["name"]
                tool_args = tool_call["function"]["arguments"]

                self.logger.info(f"Executing tool: {tool_name}")

                result = self.tool_manager.execute_tool(tool_name, tool_args)

                if tool_name == "create_file" and result.get("success"):
                    fixed_files.append(tool_args.get("file_path"))
                    self.logger.info(f"Created fix: {tool_args.get('file_path')}")

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": json.dumps(result)
                })

        return {
            "success": True,
            "analysis": analysis_result,
            "fixed_files": fixed_files,
            "iterations": iteration
        }
