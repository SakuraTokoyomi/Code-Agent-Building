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
  Build an "arXiv CS Daily" webpage with three core functionalities to deliver a streamlined experience
  for tracking daily computer science preprints:

  **1. Domain-Specific Navigation System**
  Implement categorized navigation based on arXiv's primary CS fields (cs.AI, cs.TH, cs.SY, cs.CV,
  cs.LG, cs.CL, cs.RO, cs.DB, cs.SE, cs.NE). Enable users to quickly filter and switch between major
  subfields.

  **2. Daily Updated Paper List**
  Create a daily updated list displaying the latest papers with essential details only. Each entry
  should include the paper title (hyperlinked to its detail page), submission time, and the specific
  arXiv field tag (e.g., [cs.CV]). The list should be clean and easy to scan.

  **3. Dedicated Paper Detail Page**
  Design a comprehensive detail page that centralizes critical resources: direct PDF link (hosted on
  arXiv), core metadata (title, authors with affiliations, submission date), and citation generation
  tools supporting common formats (BibTeX, standard academic citation) with one-click copy
  functionality.

  **Technical Stack:**
  - Use native HTML, jQuery, Bootstrap for frontend
  - Single-page application (SPA) architecture
  - Responsive design with mobile support
  - Loading indicators and error handling
  - Clean, functional code structure

  ---

  **CRITICAL: arXiv API Query Syntax Rules**

  **API Endpoint:** http://localhost:5000/api/papers will proxy your requests to http://export.arxiv.org/api/query
                    use localhost to avoid CORS issues
                    
  **Query Format Requirements - READ CAREFULLY:**

  The arXiv API uses a specific category query syntax that MUST be followed exactly:

  1. **For main category "cs" (all computer science papers):**
     - You MUST use the wildcard pattern: `cat:cs.*`
     - Using `cat:cs` WITHOUT the wildcard will return ZERO results
     - This is the most common mistake - the API requires the asterisk wildcard for main categories

  2. **For specific subcategories (cs.AI, cs.CV, cs.LG, etc.):**
     - Use direct category code: `cat:cs.AI`, `cat:cs.CV`, `cat:cs.LG`
     - NO wildcard needed for subcategories

  3. **Required URL Parameters:**
     - `search_query`: The category search string (as described above)
     - `start`: Pagination start index (0 for first page)
     - `max_results`: Number of papers to retrieve (recommend 10-50)
     - `sortBy`: MUST be `submittedDate` to get latest papers
     - `sortOrder`: MUST be `descending` to get newest first

  4. **Response Format:**
     - The API returns Atom XML format
     - Uses XML namespace: `http://www.w3.org/2005/Atom`
     - Root element is `<feed>` containing multiple `<entry>` elements

  ---

  **XML Data Structure to Parse:**

  The API response contains a `<feed>` element with these important child elements:

  **At feed level:**
  - `<opensearch:totalResults>`: Total number of results available
    - **VALIDATION REQUIREMENT:** Always check this value
    - If this is 0, your query syntax is incorrect
    - Display this in console/log for debugging

  **Each paper entry contains:**
  - `<id>`: The arXiv URL identifier (extract the paper ID from this)
  - `<title>`: Paper title (may contain newlines - strip them)
  - `<summary>`: Abstract text (may contain newlines - normalize whitespace)
  - `<published>`: Publication date in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
  - `<updated>`: Last update date in same format
  - `<author>` elements (multiple): Each contains `<name>` child element
  - `<link>` elements (multiple): Look for one with attribute `title="pdf"` - its `href` attribute is
  the PDF URL
  - `<category>` elements (multiple): The `term` attribute contains category codes (cs.AI, cs.CV, etc.)

  ---

  **Implementation Requirements:**

  **Phase 1 - Core API Integration (MUST WORK FIRST):**
  1. Implement API fetching function that constructs correct URL
  2. BEFORE making request, log/display the full URL being called
  3. Parse XML response (handle the Atom namespace properly)
  4. Extract all required fields from each entry
  5. Log the totalResults value to verify query worked
  6. If totalResults is 0, show error message with the query URL for debugging

  **Phase 2 - Navigation System:**
  1. Create clickable category buttons for: All CS, AI, CV, LG, CL, RO, etc.
  2. When category clicked, update the search_query parameter appropriately
  3. Remember: "All CS" uses `cat:cs.*`, specific categories use `cat:cs.XX`
  4. Reset pagination to start=0 on category change
  5. Show loading indicator while fetching
  6. Update paper list with new results

  **Phase 3 - Paper List Display:**
  1. Show papers in a clean list or card layout
  2. Display for each paper: title (clickable), submission date, category tags
  3. Format the date nicely (not raw ISO format)
  4. Title click should navigate to detail view (SPA routing)
  5. Show paper count and current category at top

  **Phase 4 - Paper Detail Page:**
  1. Extract paper ID from URL when navigating to detail
  2. Display full metadata: title, all authors, dates, complete abstract, all categories
  3. Provide clickable PDF link (open in new tab)
  4. Generate BibTeX citation from metadata
  5. Generate standard text citation
  6. Implement one-click copy for both citation formats
  7. Provide back button to return to list

  **Citation Format Specifications:**

  **BibTeX format must include:**
  - Entry type: @article
  - Cite key: use the arXiv ID (numeric part only, without version)
  - title field: full paper title
  - author field: all authors separated by " and "
  - journal field: "arXiv preprint arXiv:{ID}"
  - year field: extracted from published date

  **Standard citation format:**
  - Authors (all names, separated by commas)
  - Paper title in quotes
  - "arXiv preprint arXiv:{ID}"
  - Year in parentheses

  ---

  **Error Handling Requirements:**

  1. **Network errors:** Show user-friendly message, offer retry button
  2. **Zero results:** Display message explaining possible query issue, show the URL attempted
  3. **XML parsing errors:** Catch and display error message
  4. **Missing fields:** Handle gracefully (some papers may lack certain metadata)
  5. **CORS issues:** If browser blocks request, provide clear instruction

  ---

  **Validation & Testing Checklist:**

  Before considering the task complete, verify:

  1. ✓ Console logs show the API URL being called
  2. ✓ Console logs show totalResults > 0
  3. ✓ "All CS" category successfully fetches papers using `cat:cs.*`
  4. ✓ Each specific subcategory (AI, CV, LG) fetches relevant papers
  5. ✓ Paper list displays title, date, categories correctly
  6. ✓ Clicking paper title navigates to detail page
  7. ✓ Detail page shows complete metadata
  8. ✓ PDF link works and opens arXiv PDF
  9. ✓ BibTeX citation generates correctly
  10. ✓ Copy button successfully copies citation to clipboard
  11. ✓ Loading indicators appear during API calls
  12. ✓ Error messages display when appropriate
  13. ✓ Layout is responsive on mobile devices

  ---

  **Debugging Instructions:**

  If papers are not loading:
  1. Check browser console for the API URL - is it using `cat:cs.*` or `cat:cs`?
  2. Copy the URL and test it directly in browser - does it return XML with entries?
  3. Check the totalResults value in the XML - is it greater than 0?
  4. Verify the XML parsing is handling the Atom namespace correctly
  5. Ensure the entry elements are being found and iterated over

  ---

  **File Structure:**
  Save all files to: G:\HKU_course\data_mining\Code-Agents\output

  Required files:
  - index.html (main page structure)
  - CSS file(s) for styling
  - JavaScript file(s) for functionality
  - README.md with setup instructions

  ---

  **Development Approach:**

  IMPORTANT: Build incrementally in this order:
  1. First, create a minimal HTML page with just API fetching
  2. Verify papers are successfully retrieved (check console)
  3. Only after API works, add the paper list display
  4. Then add category navigation
  5. Finally add detail page and citations

  Do NOT build the full UI before testing the API integration.
  Test the API first with console logging to confirm data retrieval works.

  ---

  **Success Criteria:**

  The implementation is complete when:
  - Users can click category buttons and see relevant papers
  - Paper list updates smoothly with loading states
  - Detail pages show all metadata and working PDF links
  - Citations generate correctly and copy to clipboard
  - No errors in browser console
  - Works on both desktop and mobile browsers
  - Code is clean, well-organized, and commented

  Complete the entire implementation with full functionality and verify all items in the testing
  checklist pass.
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
