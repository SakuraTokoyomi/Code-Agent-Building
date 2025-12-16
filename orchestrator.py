"""
Multi-Agent Orchestrator
Coordinates the execution of multiple agents to complete software projects
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from agents import ProjectPlanningAgent, CodeGenerationAgent, CodeEvaluationAgent
from debugger_agent import CodeDebuggerAgent
from llm_client import LLMClient
from tools import ToolManager


class MultiAgentOrchestrator:
    """Orchestrates multiple agents to complete software development tasks"""

    def __init__(
            self,
            llm_client: LLMClient,
            tool_manager: ToolManager,
            max_iterations: int = 3
    ):
        self.llm_client = llm_client
        self.tool_manager = tool_manager
        self.max_iterations = max_iterations
        self.logger = logging.getLogger("Orchestrator")

        # Initialize agents
        self.planning_agent = ProjectPlanningAgent(
            name="ProjectPlanningAgent",
            llm_client=llm_client,
            tool_manager=tool_manager,
            temperature=0.7,
            max_tokens=4000
        )

        self.coding_agent = CodeGenerationAgent(
            name="CodeGenerationAgent",
            llm_client=llm_client,
            tool_manager=tool_manager,
            temperature=0.3,
            max_tokens=4000
        )

        self.evaluation_agent = CodeEvaluationAgent(
            name="CodeEvaluationAgent",
            llm_client=llm_client,
            tool_manager=tool_manager,
            temperature=0.5,
            max_tokens=3000
        )

        self.debugger_agent = CodeDebuggerAgent(
            name="CodeDebuggerAgent",
            llm_client=llm_client,
            tool_manager=tool_manager,
            temperature=0.3,
            max_tokens=4000
        )

        # State management
        self.state = {
            "status": "idle",  # idle, planning, coding, evaluating, completed, failed
            "current_task": None,
            "plan": None,
            "tasks_completed": [],
            "tasks_pending": [],
            "all_created_files": [],
            "evaluations": [],
            "iterations": 0,
            "start_time": None,
            "end_time": None
        }

    def execute(self, task_description: str, callback=None) -> Dict[str, Any]:
        """
        Execute a complete software development task

        Args:
            task_description: Natural language description of the task
            callback: Optional callback function for progress updates

        Returns:
            Dictionary containing execution results
        """
        self.logger.info("=" * 80)
        self.logger.info("Starting Multi-Agent Orchestrator")
        self.logger.info("=" * 80)

        self.state["start_time"] = datetime.now()
        self.state["status"] = "planning"

        try:
            # Step 1: Planning Phase
            self._update_progress("Planning project architecture...", callback)
            planning_result = self._execute_planning(task_description)

            if not planning_result["success"]:
                self.state["status"] = "failed"
                return self._build_result(success=False, error="Planning failed")

            self.state["plan"] = planning_result["plan"]
            self.state["tasks_pending"] = planning_result["plan"].get("tasks", [])

            self.logger.info(f"Plan created with {len(self.state['tasks_pending'])} tasks")

            # Step 2: Code Generation Phase
            self.state["status"] = "coding"
            coding_results = self._execute_coding(callback)

            # Step 3: Evaluation Phase (optional - can be skipped for speed)
            self.state["status"] = "evaluating"
            self._execute_evaluation(callback)

            # Step 3.5: Debug and Fix Phase (NEW!)
            self.state["status"] = "debugging"
            self._execute_debugging(callback, task_description)

            # Step 4: Check if we need to iterate
            should_iterate = self._should_iterate()

            if should_iterate and self.state["iterations"] < self.max_iterations:
                self.logger.info("Issues found, iterating...")
                self.state["iterations"] += 1
                # Could implement iteration logic here
                # For now, we'll just complete

            # Complete
            self.state["status"] = "completed"
            self.state["end_time"] = datetime.now()

            self._update_progress("Project completed successfully!", callback)

            return self._build_result(success=True)

        except Exception as e:
            self.logger.error(f"Orchestrator error: {str(e)}", exc_info=True)
            self.state["status"] = "failed"
            return self._build_result(success=False, error=str(e))

    def _execute_planning(self, task_description: str) -> Dict[str, Any]:
        """Execute planning phase"""
        self.logger.info("Phase 1: Project Planning")

        result = self.planning_agent.execute(task_description)

        if result["success"]:
            self.logger.info("Planning completed successfully")
        else:
            self.logger.error("Planning failed")

        return result

    def _execute_coding(self, callback=None) -> Dict[str, Any]:
        """Execute coding phase for all tasks"""
        self.logger.info("Phase 2: Code Generation")

        results = []
        total_tasks = len(self.state["tasks_pending"])

        for idx, task in enumerate(self.state["tasks_pending"]):
            task_id = task.get("task_id", f"T{idx+1}")
            task_title = task.get("title", "Untitled")

            progress_msg = f"Generating code for task {idx+1}/{total_tasks}: {task_title}"
            self._update_progress(progress_msg, callback, idx+1, total_tasks)

            self.logger.info(f"Executing task: {task_id} - {task_title}")
            self.state["current_task"] = task_id

            # Execute code generation
            result = self.coding_agent.execute(task, context=self.state["plan"])

            if result["success"]:
                self.logger.info(f"Task {task_id} completed: {len(result['created_files'])} files created")
                self.state["tasks_completed"].append(task_id)
                self.state["all_created_files"].extend(result["created_files"])
            else:
                self.logger.error(f"Task {task_id} failed: {result.get('error')}")

            results.append(result)

        return {
            "success": True,
            "results": results,
            "total_files": len(self.state["all_created_files"])
        }

    def _execute_evaluation(self, callback=None) -> Dict[str, Any]:
        """Execute evaluation phase"""
        self.logger.info("Phase 3: Code Evaluation")

        # For now, we'll do a simple evaluation of all created files
        if not self.state["all_created_files"]:
            self.logger.warning("No files to evaluate")
            return {"success": True, "evaluations": []}

        self._update_progress("Evaluating generated code...", callback)

        # Evaluate based on original plan
        for task in self.state["tasks_completed"]:
            # Find the task object
            task_obj = next((t for t in self.state["plan"]["tasks"] if t["task_id"] == task), None)

            if not task_obj:
                continue

            # Get files for this task
            task_files = task_obj.get("files", [])

            if not task_files:
                continue

            # Evaluate
            result = self.evaluation_agent.execute(
                task=task_obj,
                files=task_files,
                context=self.state["plan"]
            )

            if result["success"]:
                self.state["evaluations"].append(result["evaluation"])
                quality = result["evaluation"].get("overall_quality", "unknown")
                self.logger.info(f"Task {task} evaluation: {quality}")
            else:
                self.logger.warning(f"Evaluation failed for task {task}")

        return {
            "success": True,
            "evaluations": self.state["evaluations"]
        }

    def _execute_debugging(self, callback=None, task_description: str = "") -> Dict[str, Any]:
        """Execute debugging and fixing phase"""
        self.logger.info("Phase 3.5: Code Debugging and Fixing")

        if not self.state["all_created_files"]:
            self.logger.warning("No files to debug")
            return {"success": True, "fixed_files": []}

        self._update_progress("Analyzing code for common issues (CORS, API problems)...", callback)

        # Run debugger agent on all created files
        result = self.debugger_agent.analyze_and_fix(
            files=self.state["all_created_files"],
            project_description=task_description
        )

        if result["success"]:
            fixed_files = result.get("fixed_files", [])
            if fixed_files:
                self.logger.info(f"Fixed {len(fixed_files)} files")
                self._update_progress(f"Fixed {len(fixed_files)} issues in generated code", callback)

                # Update created files list with fixed versions
                for fixed_file in fixed_files:
                    if fixed_file not in self.state["all_created_files"]:
                        self.state["all_created_files"].append(fixed_file)
            else:
                self.logger.info("No critical issues found that need fixing")
                self._update_progress("Code analysis complete - no critical issues found", callback)

            # Log analysis
            analysis = result.get("analysis")
            if analysis:
                issues = analysis.get("issues_found", [])
                self.logger.info(f"Debug analysis found {len(issues)} issues")
                for issue in issues:
                    self.logger.info(f"  - {issue.get('type')}: {issue.get('description')}")

        else:
            self.logger.warning(f"Debugging failed: {result.get('error')}")

        return {
            "success": True,
            "fixed_files": result.get("fixed_files", [])
        }

    def _should_iterate(self) -> bool:
        """Determine if we should iterate based on evaluations"""
        # Check if any evaluation found critical issues
        for evaluation in self.state["evaluations"]:
            if evaluation.get("overall_quality") == "poor":
                return True

            # Check for critical issues
            issues = evaluation.get("issues", [])
            critical_issues = [i for i in issues if i.get("severity") == "critical"]

            if critical_issues:
                return True

        return False

    def _update_progress(self, message: str, callback=None, current: int = 0, total: int = 0):
        """Update progress and call callback if provided"""
        self.logger.info(message)

        if callback:
            callback({
                "message": message,
                "status": self.state["status"],
                "current": current,
                "total": total,
                "files_created": len(self.state["all_created_files"])
            })

    def _build_result(self, success: bool, error: Optional[str] = None) -> Dict[str, Any]:
        """Build final result dictionary"""
        duration = None
        if self.state["start_time"] and self.state["end_time"]:
            duration = (self.state["end_time"] - self.state["start_time"]).total_seconds()

        result = {
            "success": success,
            "status": self.state["status"],
            "plan": self.state["plan"],
            "tasks_completed": self.state["tasks_completed"],
            "files_created": self.state["all_created_files"],
            "total_files": len(self.state["all_created_files"]),
            "evaluations": self.state["evaluations"],
            "iterations": self.state["iterations"],
            "duration_seconds": duration
        }

        if error:
            result["error"] = error

        return result

    def get_state(self) -> Dict[str, Any]:
        """Get current orchestrator state"""
        return self.state.copy()

    def reset(self):
        """Reset orchestrator state"""
        self.state = {
            "status": "idle",
            "current_task": None,
            "plan": None,
            "tasks_completed": [],
            "tasks_pending": [],
            "all_created_files": [],
            "evaluations": [],
            "iterations": 0,
            "start_time": None,
            "end_time": None
        }
