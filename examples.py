"""
Example: Using the Multi-Agent System Programmatically

This script demonstrates how to use the system as a library
instead of through the CLI.
"""

import os
import json
import logging
from pathlib import Path

from llm_client import LLMClient
from tools import ToolManager
from orchestrator import MultiAgentOrchestrator

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


def progress_callback(progress_data):
    """
    Callback function for progress updates

    Args:
        progress_data: Dictionary containing progress information
    """
    message = progress_data.get("message", "")
    status = progress_data.get("status", "")
    current = progress_data.get("current", 0)
    total = progress_data.get("total", 0)

    print(f"[{status.upper()}] {message}")
    if total > 0:
        print(f"  Progress: {current}/{total}")


def example_1_simple_task():
    """
    Example 1: Simple todo list application
    """
    print("\n" + "="*70)
    print("Example 1: Generate a Simple Todo List App")
    print("="*70 + "\n")

    # Initialize components
    llm_client = LLMClient(provider="custom")
    tool_manager = ToolManager(base_dir="./examples/todo_app")
    orchestrator = MultiAgentOrchestrator(
        llm_client=llm_client,
        tool_manager=tool_manager,
        max_iterations=2
    )

    # Define task
    task = """
    Create a simple todo list web application with these features:
    - Add new todos
    - Mark todos as complete
    - Delete todos
    - Save to local storage
    - Bootstrap UI
    - Responsive design
    """

    # Execute
    result = orchestrator.execute(
        task_description=task,
        callback=progress_callback
    )

    # Print results
    print("\n" + "-"*70)
    print("RESULT:")
    print(f"Success: {result['success']}")
    print(f"Files created: {result['total_files']}")
    print(f"Duration: {result.get('duration_seconds', 0):.2f} seconds")
    print("-"*70 + "\n")

    return result


def example_2_weather_dashboard():
    """
    Example 2: Weather dashboard with API integration
    """
    print("\n" + "="*70)
    print("Example 2: Generate a Weather Dashboard")
    print("="*70 + "\n")

    # Initialize components
    llm_client = LLMClient(provider="custom")
    tool_manager = ToolManager(base_dir="./examples/weather_dashboard")
    orchestrator = MultiAgentOrchestrator(
        llm_client=llm_client,
        tool_manager=tool_manager,
        max_iterations=2
    )

    # Define task
    task = """
    Build a weather dashboard web application:
    - Show current weather for user's location
    - Display 5-day forecast
    - Search weather by city name
    - Show weather icons and conditions
    - Temperature in Celsius and Fahrenheit
    - Use OpenWeatherMap API (or similar)
    - Responsive Bootstrap design
    - Error handling for API failures
    """

    # Execute
    result = orchestrator.execute(
        task_description=task,
        callback=progress_callback
    )

    # Print results
    print("\n" + "-"*70)
    print("RESULT:")
    print(f"Success: {result['success']}")
    print(f"Files created: {result['total_files']}")
    print(f"Duration: {result.get('duration_seconds', 0):.2f} seconds")

    # Print evaluation if available
    if result.get('evaluations'):
        print("\nCode Quality Evaluation:")
        for eval_data in result['evaluations']:
            print(f"  Overall Quality: {eval_data.get('overall_quality')}")
            print(f"  Functionality: {eval_data.get('functionality_score')}/10")
            print(f"  Code Quality: {eval_data.get('code_quality_score')}/10")

    print("-"*70 + "\n")

    return result


def example_3_custom_agents():
    """
    Example 3: Using individual agents directly
    """
    print("\n" + "="*70)
    print("Example 3: Using Individual Agents")
    print("="*70 + "\n")

    from agents import ProjectPlanningAgent, CodeGenerationAgent

    # Initialize components
    llm_client = LLMClient(provider="custom")
    tool_manager = ToolManager(base_dir="./examples/custom")

    # Create planning agent
    planning_agent = ProjectPlanningAgent(
        name="CustomPlanner",
        llm_client=llm_client,
        tool_manager=tool_manager,
        temperature=0.7,
        max_tokens=4000
    )

    # Plan a project
    task = "Create a simple calculator web app with Bootstrap UI"
    print(f"Planning task: {task}\n")

    planning_result = planning_agent.execute(task)

    if planning_result["success"]:
        plan = planning_result["plan"]
        print("Plan created successfully!")
        print(f"Tasks: {len(plan.get('tasks', []))}")
        print(f"Technology Stack: {plan.get('technology_stack', [])}")

        # Use coding agent to implement first task
        if plan.get('tasks'):
            coding_agent = CodeGenerationAgent(
                name="CustomCoder",
                llm_client=llm_client,
                tool_manager=tool_manager,
                temperature=0.3,
                max_tokens=4000
            )

            first_task = plan['tasks'][0]
            print(f"\nImplementing task: {first_task.get('title')}")

            coding_result = coding_agent.execute(first_task, context=plan)

            if coding_result["success"]:
                print(f"Task completed! Files created: {coding_result['created_files']}")
            else:
                print(f"Task failed: {coding_result.get('error')}")
    else:
        print(f"Planning failed: {planning_result.get('error')}")

    print("\n" + "-"*70 + "\n")


def example_4_batch_processing():
    """
    Example 4: Process multiple tasks in batch
    """
    print("\n" + "="*70)
    print("Example 4: Batch Processing Multiple Tasks")
    print("="*70 + "\n")

    tasks = [
        {
            "name": "landing_page",
            "description": "Create a landing page for a SaaS product with hero section, features, and pricing",
            "output_dir": "./examples/batch/landing_page"
        },
        {
            "name": "contact_form",
            "description": "Create a contact form with validation and Bootstrap styling",
            "output_dir": "./examples/batch/contact_form"
        },
        {
            "name": "gallery",
            "description": "Create an image gallery with lightbox effect and filtering",
            "output_dir": "./examples/batch/gallery"
        }
    ]

    results = []

    for idx, task_info in enumerate(tasks, 1):
        print(f"\n[{idx}/{len(tasks)}] Processing: {task_info['name']}")
        print("-" * 50)

        # Initialize for each task
        llm_client = LLMClient(provider="custom")
        tool_manager = ToolManager(base_dir=task_info['output_dir'])
        orchestrator = MultiAgentOrchestrator(
            llm_client=llm_client,
            tool_manager=tool_manager,
            max_iterations=1  # Quick iteration for batch
        )

        # Execute
        result = orchestrator.execute(
            task_description=task_info['description'],
            callback=None  # No callback for batch
        )

        results.append({
            "name": task_info['name'],
            "success": result['success'],
            "files": result['total_files'],
            "duration": result.get('duration_seconds', 0)
        })

        print(f"✓ Completed in {result.get('duration_seconds', 0):.2f}s")

    # Print summary
    print("\n" + "="*70)
    print("BATCH PROCESSING SUMMARY")
    print("="*70)

    for result in results:
        status = "✓" if result['success'] else "✗"
        print(f"{status} {result['name']}: {result['files']} files in {result['duration']:.2f}s")

    success_count = sum(1 for r in results if r['success'])
    print(f"\nTotal: {success_count}/{len(results)} succeeded")
    print("="*70 + "\n")


def main():
    """
    Main function to run examples
    """
    print("\n")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║                                                                ║")
    print("║      Multi-Agent Code Generation System - Examples            ║")
    print("║                                                                ║")
    print("╚════════════════════════════════════════════════════════════════╝")

    # Check API key
    if not os.getenv("LLM_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        print("\n⚠️  WARNING: No API key found!")
        print("Please set LLM_API_KEY environment variable")
        print("Example: export LLM_API_KEY='your-key'\n")
        return

    # Menu
    print("\nSelect an example to run:")
    print("1. Simple Todo List App")
    print("2. Weather Dashboard")
    print("3. Using Individual Agents")
    print("4. Batch Processing Multiple Tasks")
    print("0. Exit")

    choice = input("\nEnter choice (0-4): ").strip()

    if choice == "1":
        example_1_simple_task()
    elif choice == "2":
        example_2_weather_dashboard()
    elif choice == "3":
        example_3_custom_agents()
    elif choice == "4":
        example_4_batch_processing()
    elif choice == "0":
        print("Goodbye!")
    else:
        print("Invalid choice!")


if __name__ == "__main__":
    main()
