"""
Main entry point for the Multi-Agent Code Generation System
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional
import argparse

from colorama import init, Fore, Style
from tqdm import tqdm

from config import LOG_DIR, LOG_FILE, OUTPUT_DIR, DEFAULT_PROVIDER
from llm_client import LLMClient
from tools import ToolManager
from orchestrator import MultiAgentOrchestrator

# Initialize colorama for colored console output
init(autoreset=True)


class ProgressTracker:
    """Tracks and displays progress of the multi-agent system"""

    def __init__(self):
        self.current_phase = None
        self.progress_bar = None
        self.log_entries = []

    def update(self, progress_data: dict):
        """Update progress based on orchestrator callback"""
        message = progress_data.get("message", "")
        status = progress_data.get("status", "")
        current = progress_data.get("current", 0)
        total = progress_data.get("total", 0)

        # Log the message
        self.log_entries.append({
            "timestamp": datetime.now().isoformat(),
            "status": status,
            "message": message
        })

        # Print colored status
        if status == "planning":
            print(f"\n{Fore.CYAN}📋 PLANNING: {message}{Style.RESET_ALL}")
        elif status == "coding":
            print(f"\n{Fore.GREEN}💻 CODING: {message}{Style.RESET_ALL}")
        elif status == "evaluating":
            print(f"\n{Fore.YELLOW}🔍 EVALUATING: {message}{Style.RESET_ALL}")
        elif status == "debugging":
            print(f"\n{Fore.MAGENTA}🐛 DEBUGGING: {message}{Style.RESET_ALL}")
        elif status == "completed":
            print(f"\n{Fore.GREEN}✅ COMPLETED: {message}{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.WHITE}{message}{Style.RESET_ALL}")

        # Update progress bar if we have total
        if total > 0:
            if self.progress_bar is None or self.current_phase != status:
                if self.progress_bar:
                    self.progress_bar.close()
                self.progress_bar = tqdm(total=total, desc=status.upper())
                self.current_phase = status

            if self.progress_bar:
                self.progress_bar.n = current
                self.progress_bar.refresh()

    def close(self):
        """Close progress bar"""
        if self.progress_bar:
            self.progress_bar.close()

    def save_log(self, log_file: str):
        """Save log entries to file"""
        try:
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump(self.log_entries, f, indent=2)
            print(f"{Fore.BLUE}📝 Log saved to: {log_file}{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}❌ Failed to save log: {str(e)}{Style.RESET_ALL}")


def setup_logging(log_dir: str = LOG_DIR, log_file: str = LOG_FILE):
    """Setup logging configuration"""
    # Create log directory
    Path(log_dir).mkdir(parents=True, exist_ok=True)

    log_path = Path(log_dir) / log_file

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_path, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )

    return str(log_path)


def print_banner():
    """Print application banner"""
    banner = f"""
{Fore.CYAN}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          🤖 Multi-Agent Code Generation System 🤖           ║
║                                                              ║
║              AI-Driven Software Development                  ║
║                   COMP7103C Project                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝{Style.RESET_ALL}
"""
    print(banner)


def print_result_summary(result: dict, output_dir: str):
    """Print execution result summary"""
    print(f"\n{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}EXECUTION SUMMARY{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}\n")

    if result["success"]:
        print(f"{Fore.GREEN}✅ Status: SUCCESS{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}❌ Status: FAILED{Style.RESET_ALL}")
        if "error" in result:
            print(f"{Fore.RED}Error: {result['error']}{Style.RESET_ALL}")

    print(f"\n{Fore.YELLOW}📊 Statistics:{Style.RESET_ALL}")
    print(f"   • Tasks Completed: {len(result.get('tasks_completed', []))}")
    print(f"   • Files Created: {result.get('total_files', 0)}")
    print(f"   • Iterations: {result.get('iterations', 0)}")

    if result.get('duration_seconds'):
        duration = result['duration_seconds']
        print(f"   • Duration: {duration:.2f} seconds")

    print(f"\n{Fore.YELLOW}📁 Generated Files:{Style.RESET_ALL}")
    for file_path in result.get('files_created', []):
        full_path = Path(output_dir) / file_path
        print(f"   • {file_path}")

    print(f"\n{Fore.BLUE}📂 Output Directory: {output_dir}{Style.RESET_ALL}")

    # Print evaluations if available
    if result.get('evaluations'):
        print(f"\n{Fore.YELLOW}🔍 Code Quality Evaluations:{Style.RESET_ALL}")
        for idx, eval_data in enumerate(result['evaluations'], 1):
            quality = eval_data.get('overall_quality', 'N/A')
            func_score = eval_data.get('functionality_score', 0)
            code_score = eval_data.get('code_quality_score', 0)

            color = Fore.GREEN if quality == 'excellent' else Fore.YELLOW if quality == 'good' else Fore.RED

            print(f"   {idx}. Quality: {color}{quality}{Style.RESET_ALL} | "
                  f"Functionality: {func_score}/10 | Code Quality: {code_score}/10")

    print(f"\n{Fore.CYAN}{'='*70}{Style.RESET_ALL}\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Multi-Agent Code Generation System for COMP7103C"
    )
    parser.add_argument(
        "--task",
        type=str,
        help="Task description (if not provided, will use default arXiv CS Daily task)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=OUTPUT_DIR,
        help=f"Output directory (default: {OUTPUT_DIR})"
    )
    parser.add_argument(
        "--provider",
        type=str,
        default=DEFAULT_PROVIDER,
        choices=["deepseek", "openai", "custom"],
        help=f"LLM provider to use (default: {DEFAULT_PROVIDER})"
    )
    parser.add_argument(
        "--no-evaluation",
        action="store_true",
        help="Skip code evaluation phase for faster execution"
    )

    args = parser.parse_args()

    # Print banner
    print_banner()

    # Setup logging
    log_path = setup_logging()
    print(f"{Fore.BLUE}📝 Logging to: {log_path}{Style.RESET_ALL}\n")

    # Create output directory
    output_dir = args.output
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Default task: arXiv CS Daily webpage
    if not args.task:
        task_description = """  
Build an 'arXiv CS Daily' webpage - a pure frontend web application that uses the arXiv API (https://export.arxiv.org/api/query) to track daily computer science preprints. 

REQUIREMENTS: 
1. Domain-Specific Navigation System: Create categorized navigation tabs based on arXiv CS fields including: cs.AI (Artificial Intelligence), cs.CL (Computation and Language), cs.CV (Computer Vision), cs.LG (Machine Learning), cs.NE (Neural Computing), cs.RO (Robotics), cs.SE (Software Engineering), cs.SY (Systems and Control), cs.CR (Cryptography), cs.DB (Databases), cs.DC (Distributed Computing), cs.HC (Human-Computer Interaction), cs.TH (Theory of Computation). Allow users to filter and switch between CS subfields. Include an 'All' tab to show papers from all CS categories. Highlight the currently active category with visual indicator. 

2. Daily Updated Paper List: Fetch papers from arXiv API using URL format: https://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending proxied by local flask. Display latest papers with: paper title (clickable to open detail view), submission date/time, arXiv field tag (e.g., [cs.CV]), and primary author name. Show loading spinner while fetching data. Handle API errors gracefully with user-friendly error messages. Implement pagination with 'Load More' button. Each paper card should have hover effects. 

3. Dedicated Paper Detail Page: Show as modal or SPA-style view when clicking a paper title (no page reload). Display: full title, all authors, complete abstract, submission date, arXiv ID. Provide direct PDF link button (https://arxiv.org/pdf/ID.pdf). Provide link to arXiv abstract page (https://arxiv.org/abs/ID). Citation generation tools with one-click copy functionality: BibTeX format and APA-style citation. Back button to return to paper list. 

DESIGN: Clean, modern, academic-style interface. 

TECHNICAL: 
1. Frontend: HTML5, CSS3, vanilla JavaScript (NO frameworks). Parse XML response from arXiv API using DOMParser. Store user preferences in localStorage. 
2. Backend: One single file Python Flask backend to reroute requests directly to export.arxiv.org

**IMPORTANT**: NO DEMONSTRATION, the code must be production ready.
  
"""
    else:
        task_description = args.task

    print(f"{Fore.CYAN}📋 Task Description:{Style.RESET_ALL}")
    print(f"{Fore.WHITE}{task_description[:200]}...{Style.RESET_ALL}\n")

    # Initialize components
    print(f"{Fore.YELLOW}🔧 Initializing system components...{Style.RESET_ALL}")

    try:
        llm_client = LLMClient(provider=args.provider)
        tool_manager = ToolManager(base_dir=output_dir)
        orchestrator = MultiAgentOrchestrator(
            llm_client=llm_client,
            tool_manager=tool_manager,
            max_iterations=3 if not args.no_evaluation else 1
        )

        print(f"{Fore.GREEN}✅ System initialized successfully{Style.RESET_ALL}\n")

    except Exception as e:
        print(f"{Fore.RED}❌ Failed to initialize system: {str(e)}{Style.RESET_ALL}")
        return 1

    # Create progress tracker
    progress_tracker = ProgressTracker()

    # Execute task
    print(f"{Fore.CYAN}🚀 Starting execution...{Style.RESET_ALL}\n")

    try:
        result = orchestrator.execute(
            task_description=task_description,
            callback=progress_tracker.update
        )

        progress_tracker.close()

        # Save execution log
        log_file = Path(output_dir) / "execution_log.json"
        progress_tracker.save_log(str(log_file))

        # Save result
        result_file = Path(output_dir) / "result.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, default=str)

        print(f"{Fore.BLUE}📊 Result saved to: {result_file}{Style.RESET_ALL}")

        # Print summary
        print_result_summary(result, output_dir)

        return 0 if result["success"] else 1

    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}⚠️  Execution interrupted by user{Style.RESET_ALL}")
        progress_tracker.close()
        return 1

    except Exception as e:
        print(f"\n{Fore.RED}❌ Execution failed: {str(e)}{Style.RESET_ALL}")
        progress_tracker.close()
        logging.exception("Execution error")
        return 1


if __name__ == "__main__":
    sys.exit(main())
