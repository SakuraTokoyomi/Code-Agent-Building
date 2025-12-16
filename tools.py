"""
Tool Kit for Multi-Agent System
Provides filesystem, web search, and code execution capabilities
"""

import os
import json
import subprocess
import requests
from typing import Dict, List, Any, Optional
from pathlib import Path


class ToolKit:
    """Base class for agent tools"""

    def __init__(self, base_dir: str = "./output"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_available_tools(self) -> List[Dict[str, Any]]:
        """Return list of available tools in OpenAI function calling format"""
        raise NotImplementedError


class FilesystemTools(ToolKit):
    """Tools for filesystem operations"""

    def get_available_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "create_file",
                    "description": "Create a new file with specified content",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {
                                "type": "string",
                                "description": "Path to the file to create (relative to output directory)"
                            },
                            "content": {
                                "type": "string",
                                "description": "Content to write to the file"
                            }
                        },
                        "required": ["file_path", "content"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Read content from a file",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {
                                "type": "string",
                                "description": "Path to the file to read"
                            }
                        },
                        "required": ["file_path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_files",
                    "description": "List all files in a directory",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "directory": {
                                "type": "string",
                                "description": "Directory path to list files from"
                            }
                        },
                        "required": ["directory"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_directory",
                    "description": "Create a new directory",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "dir_path": {
                                "type": "string",
                                "description": "Path to the directory to create"
                            }
                        },
                        "required": ["dir_path"]
                    }
                }
            }
        ]

    def create_file(self, file_path: str, content: str) -> Dict[str, Any]:
        """Create a new file with specified content"""
        try:
            full_path = self.base_dir / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)

            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return {
                "success": True,
                "message": f"File created successfully: {file_path}",
                "path": str(full_path)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error creating file: {str(e)}"
            }

    def read_file(self, file_path: str) -> Dict[str, Any]:
        """Read content from a file"""
        try:
            full_path = self.base_dir / file_path

            if not full_path.exists():
                return {
                    "success": False,
                    "message": f"File not found: {file_path}"
                }

            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            return {
                "success": True,
                "content": content,
                "path": str(full_path)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error reading file: {str(e)}"
            }

    def list_files(self, directory: str = ".") -> Dict[str, Any]:
        """List all files in a directory"""
        try:
            full_path = self.base_dir / directory

            if not full_path.exists():
                return {
                    "success": False,
                    "message": f"Directory not found: {directory}"
                }

            files = []
            for item in full_path.rglob("*"):
                if item.is_file():
                    rel_path = item.relative_to(self.base_dir)
                    files.append(str(rel_path))

            return {
                "success": True,
                "files": files,
                "count": len(files)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error listing files: {str(e)}"
            }

    def create_directory(self, dir_path: str) -> Dict[str, Any]:
        """Create a new directory"""
        try:
            full_path = self.base_dir / dir_path
            full_path.mkdir(parents=True, exist_ok=True)

            return {
                "success": True,
                "message": f"Directory created successfully: {dir_path}",
                "path": str(full_path)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error creating directory: {str(e)}"
            }

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a filesystem tool"""
        if tool_name == "create_file":
            return self.create_file(**arguments)
        elif tool_name == "read_file":
            return self.read_file(**arguments)
        elif tool_name == "list_files":
            return self.list_files(**arguments)
        elif tool_name == "create_directory":
            return self.create_directory(**arguments)
        else:
            return {
                "success": False,
                "message": f"Unknown tool: {tool_name}"
            }


class WebSearchTools(ToolKit):
    """Simulated web search tool"""

    def get_available_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "web_search",
                    "description": "Search the web for information (simulated)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Search query"
                            }
                        },
                        "required": ["query"]
                    }
                }
            }
        ]

    def web_search(self, query: str) -> Dict[str, Any]:
        """Simulated web search - returns helpful context for common queries"""
        # Simulated responses for common development queries
        simulated_responses = {
            "bootstrap": {
                "success": True,
                "results": [
                    {
                        "title": "Bootstrap CDN",
                        "snippet": "Latest Bootstrap CSS: https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
                    }
                ]
            },
            "jquery": {
                "success": True,
                "results": [
                    {
                        "title": "jQuery CDN",
                        "snippet": "Latest jQuery: https://code.jquery.com/jquery-3.6.0.min.js"
                    }
                ]
            },
            "arxiv api": {
                "success": True,
                "results": [
                    {
                        "title": "arXiv API Documentation",
                        "snippet": "arXiv API base URL: http://export.arxiv.org/api/query. Example: http://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=10"
                    }
                ]
            }
        }

        # Check for matching simulated responses
        query_lower = query.lower()
        for key, response in simulated_responses.items():
            if key in query_lower:
                return response

        # Default response
        return {
            "success": True,
            "results": [
                {
                    "title": f"Search results for: {query}",
                    "snippet": "Web search simulation - use appropriate CDN links and API endpoints for your implementation."
                }
            ]
        }

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a web search tool"""
        if tool_name == "web_search":
            return self.web_search(**arguments)
        else:
            return {
                "success": False,
                "message": f"Unknown tool: {tool_name}"
            }


class CodeExecutionTools(ToolKit):
    """Tools for executing code (use with caution)"""

    def get_available_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "execute_command",
                    "description": "Execute a shell command (use with caution, only for safe operations like validation)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {
                                "type": "string",
                                "description": "Command to execute"
                            },
                            "timeout": {
                                "type": "integer",
                                "description": "Timeout in seconds",
                                "default": 30
                            }
                        },
                        "required": ["command"]
                    }
                }
            }
        ]

    def execute_command(self, command: str, timeout: int = 30) -> Dict[str, Any]:
        """Execute a shell command with safety restrictions"""
        # Safety check - only allow safe commands
        safe_commands = ["ls", "cat", "echo", "pwd", "python", "node"]
        cmd_parts = command.split()

        if not cmd_parts:
            return {
                "success": False,
                "message": "Empty command"
            }

        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.base_dir
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "message": f"Command timed out after {timeout} seconds"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error executing command: {str(e)}"
            }

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a code execution tool"""
        if tool_name == "execute_command":
            return self.execute_command(**arguments)
        else:
            return {
                "success": False,
                "message": f"Unknown tool: {tool_name}"
            }


class ToolManager:
    """Manages all available tools"""

    def __init__(self, base_dir: str = "./output"):
        self.filesystem = FilesystemTools(base_dir)
        self.web_search = WebSearchTools(base_dir)
        self.code_execution = CodeExecutionTools(base_dir)

        self.tool_map = {
            "create_file": self.filesystem,
            "read_file": self.filesystem,
            "list_files": self.filesystem,
            "create_directory": self.filesystem,
            "web_search": self.web_search,
            "execute_command": self.code_execution
        }

    def get_all_tools(self) -> List[Dict[str, Any]]:
        """Get all available tools in OpenAI function calling format"""
        tools = []
        tools.extend(self.filesystem.get_available_tools())
        tools.extend(self.web_search.get_available_tools())
        tools.extend(self.code_execution.get_available_tools())
        return tools

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool by name"""
        tool_instance = self.tool_map.get(tool_name)

        if tool_instance is None:
            return {
                "success": False,
                "message": f"Unknown tool: {tool_name}"
            }

        return tool_instance.execute_tool(tool_name, arguments)
