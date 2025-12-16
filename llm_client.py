"""
LLM Client for interacting with various LLM APIs
Supports OpenAI-compatible APIs
"""

import json
import time
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from config import LLM_CONFIGS, DEFAULT_PROVIDER


class LLMClient:
    """Client for LLM API interaction"""

    def __init__(self, provider: str = DEFAULT_PROVIDER):
        self.provider = provider
        config = LLM_CONFIGS.get(provider, LLM_CONFIGS["custom"])

        self.client = OpenAI(
            api_key=config["api_key"],
            base_url=config["base_url"],
            timeout=120.0,  # 增加超时时间到120秒
            max_retries=2,   # 限制重试次数为2次，避免无限重试
            default_headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            }
        )
        self.model = config["model"]
        # print(config["api_key"],config["base_url"],config["model"])
        self.logger = logging.getLogger("LLMClient")

    def chat_completion(
            self,
            messages: List[Dict[str, str]],
            tools: Optional[List[Dict[str, Any]]] = None,
            temperature: float = 0.7,
            max_tokens: int = 4000,
            tool_choice: str = "auto"
    ) -> Dict[str, Any]:
        """
        Call LLM API with chat completion

        Args:
            messages: List of message dictionaries
            tools: Optional list of tools for function calling
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            tool_choice: Tool choice mode ("auto", "none", or specific tool)

        Returns:
            Response dictionary
        """
        try:
            kwargs = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }

            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = tool_choice

            response = self.client.chat.completions.create(**kwargs)

            # Parse response
            message = response.choices[0].message

            result = {
                "success": True,
                "content": message.content,
                "tool_calls": [],
                "finish_reason": response.choices[0].finish_reason
            }

            # Parse tool calls if present
            if hasattr(message, 'tool_calls') and message.tool_calls:
                result["tool_calls"] = []
                for tc in message.tool_calls:
                    try:
                        # Try to parse arguments
                        try:
                            arguments = json.loads(tc.function.arguments)
                        except json.JSONDecodeError as e:
                            # If JSON parsing fails, try to fix common issues
                            self.logger.warning(f"JSON decode error for tool call: {str(e)}")
                            # Try to clean up the string
                            cleaned_args = tc.function.arguments.replace('\n', '\\n').replace('\r', '\\r')
                            try:
                                arguments = json.loads(cleaned_args)
                            except:
                                # If still fails, log and skip this tool call
                                self.logger.error(f"Failed to parse tool arguments, skipping: {tc.function.arguments[:100]}")
                                continue

                        result["tool_calls"].append({
                            "id": tc.id,
                            "type": tc.type,
                            "function": {
                                "name": tc.function.name,
                                "arguments": arguments
                            }
                        })
                    except Exception as e:
                        self.logger.error(f"Error processing tool call: {str(e)}")
                        continue

            return result

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "content": None,
                "tool_calls": []
            }

    def retry_chat_completion(
            self,
            messages: List[Dict[str, str]],
            tools: Optional[List[Dict[str, Any]]] = None,
            temperature: float = 0.7,
            max_tokens: int = 4000,
            tool_choice: str = "auto",
            max_retries: int = 3,
            retry_delay: float = 1.0
    ) -> Dict[str, Any]:
        """
        Call LLM API with retry logic

        Args:
            messages: List of message dictionaries
            tools: Optional list of tools
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            tool_choice: Tool choice mode
            max_retries: Maximum number of retries
            retry_delay: Delay between retries in seconds

        Returns:
            Response dictionary
        """
        for attempt in range(max_retries):
            result = self.chat_completion(
                messages=messages,
                tools=tools,
                temperature=temperature,
                max_tokens=max_tokens,
                tool_choice=tool_choice
            )

            if result["success"]:
                return result

            # If not successful and not the last attempt, wait and retry
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))

        # If all retries failed, return the last result
        return result
