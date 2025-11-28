import os
import argparse
import json
import time
import re
from pathlib import Path
from typing import Literal, Optional, Union, Any
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.types import (
    Part,
    GenerateContentConfig,
    Content,
    Candidate,
    FunctionResponse,
    FinishReason,
)
import termcolor
from rich.console import Console
from rich.table import Table
from playwright.async_api import async_playwright
import asyncio

# --- 1. CONFIGURATION ---
load_dotenv()
MODEL_ID = 'gemini-2.5-computer-use-preview-10-2025'
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

PLAYWRIGHT_SCREEN_SIZE = (1440, 900)

console = Console()

# --- 2. STANDALONE BROWSER COMPUTER CLASS ---
class StandaloneBrowserComputer:
    """Standalone browser computer using Playwright."""
    
    def __init__(self, screen_size=(1440, 900), initial_url="about:blank"):
        self.screen_size_val = screen_size
        self.initial_url = initial_url
        self.playwright = None
        self.browser = None
        self.page = None
        
    async def initialize(self):
        """Initialize the browser."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch()
        self.page = await self.browser.new_page(
            viewport={"width": self.screen_size_val[0], "height": self.screen_size_val[1]}
        )
        if self.initial_url != "about:blank":
            await self.page.goto(self.initial_url, wait_until="load")
        return self
    
    async def close(self):
        """Close the browser."""
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    def screen_size(self):
        """Get screen size."""
        return self.screen_size_val
    
    async def take_screenshot(self):
        """Take a screenshot."""
        return await self.page.screenshot()
    
    async def click_at(self, x: int, y: int):
        """Click at coordinates."""
        await self.page.click(f"css=button, a, [role='button']", position={"x": x, "y": y})
    
    async def navigate(self, url: str):
        """Navigate to URL."""
        await self.page.goto(url, wait_until="load")
    
    async def type_text(self, text: str):
        """Type text."""
        await self.page.keyboard.type(text)

# --- 3. STANDALONE AGENT CLASS ---
class StandaloneBrowserAgent:
    """Standalone agent without external dependencies."""
    
    def __init__(
        self,
        browser_computer: StandaloneBrowserComputer,
        query: str,
        model_name: str,
        verbose: bool = True,
    ):
        self._browser_computer = browser_computer
        self._query = query
        self._model_name = model_name
        self._verbose = verbose
        self.final_reasoning = None
        self._client = genai.Client(api_key=API_KEY)
        self._contents: list[Content] = [
            Content(
                role="user",
                parts=[Part(text=self._query)],
            )
        ]
        
        self._generate_content_config = GenerateContentConfig(
            temperature=1,
            top_p=0.95,
            top_k=40,
            max_output_tokens=8192,
            tools=[
                types.Tool(
                    computer_use=types.ComputerUse(
                        environment=types.Environment.ENVIRONMENT_BROWSER,
                    ),
                ),
            ],
        )
    
    async def get_model_response(self, max_retries=5, base_delay_s=1):
        """Get response from model with retries."""
        for attempt in range(max_retries):
            try:
                response = self._client.models.generate_content(
                    model=self._model_name,
                    contents=self._contents,
                    config=self._generate_content_config,
                )
                return response
            except Exception as e:
                print(f"Error: {e}")
                if attempt < max_retries - 1:
                    delay = base_delay_s * (2**attempt)
                    termcolor.cprint(
                        f"Retrying in {delay} seconds...\n",
                        color="yellow",
                    )
                    await asyncio.sleep(delay)
                else:
                    termcolor.cprint(
                        f"Failed after {max_retries} attempts.\n",
                        color="red",
                    )
                    raise
    
    def get_text(self, candidate: Candidate) -> Optional[str]:
        """Extract text from candidate."""
        if not candidate.content or not candidate.content.parts:
            return None
        text = []
        for part in candidate.content.parts:
            if part.text:
                text.append(part.text)
        return " ".join(text) or None
    
    def extract_function_calls(self, candidate: Candidate) -> list[types.FunctionCall]:
        """Extract function calls from candidate."""
        if not candidate.content or not candidate.content.parts:
            return []
        ret = []
        for part in candidate.content.parts:
            if part.function_call:
                ret.append(part.function_call)
        return ret
    
    async def click_at(self, x: int, y: int):
        """Click at coordinates - improved with tab detection."""
        # First, try to find and click tab buttons using Playwright selectors
        tab_selectors = [
            "button[role='tab']",
            "[data-tab]",
            ".tab-button",
            ".nav-tabs button",
            ".tabs button",
            "[class*='tab-btn']",
            "li[role='tab']",
            ".tab-list button"
        ]
        
        for selector in tab_selectors:
            try:
                buttons = await self._browser_computer.page.query_selector_all(selector)
                if buttons:
                    for button in buttons:
                        bbox = await button.bounding_box()
                        if bbox:
                            btn_x = int(bbox['x'] + bbox['width'] / 2)
                            btn_y = int(bbox['y'] + bbox['height'] / 2)
                            # Check if click coordinates are close to this button
                            if abs(btn_x - x) < 100 and abs(btn_y - y) < 50:
                                print(f"  → Found tab button at ({btn_x}, {btn_y}), clicking with Playwright...")
                                await button.scroll_into_view_if_needed()
                                await asyncio.sleep(0.2)
                                await button.click()
                                await asyncio.sleep(0.5)
                                return
            except:
                continue
        
        # Fallback to coordinate-based clicking if no tab found
        print(f"  → No tab found, using coordinate-based click at ({x}, {y})")
        await self._browser_computer.page.click(f"css=button, a, [role='button']", position={"x": x, "y": y})
    
    async def run_one_iteration(self) -> Literal["COMPLETE", "CONTINUE"]:
        """Run one iteration of the agent loop."""
        if self._verbose:
            with console.status(
                "Generating response from Gemini Computer Use...", spinner_style=None
            ):
                response = await self.get_model_response()
        else:
            response = await self.get_model_response()
        
        if not response.candidates:
            raise ValueError("Empty response from model")
        
        candidate = response.candidates[0]
        if candidate.content:
            self._contents.append(candidate.content)
        
        reasoning = self.get_text(candidate)
        function_calls = self.extract_function_calls(candidate)
        
        if not function_calls:
            print(f"Agent Loop Complete: {reasoning}")
            self.final_reasoning = reasoning
            return "COMPLETE"
        
        function_call_strs = []
        for function_call in function_calls:
            function_call_str = f"Name: {function_call.name}"
            if function_call.args:
                function_call_str += f"\nArgs:"
                for key, value in function_call.args.items():
                    function_call_str += f"\n  {key}: {value}"
            function_call_strs.append(function_call_str)
        
        table = Table(expand=True)
        table.add_column("Gemini Computer Use Reasoning", header_style="magenta", ratio=1)
        table.add_column("Function Call(s)", header_style="cyan", ratio=1)
        table.add_row(reasoning, "\n".join(function_call_strs))
        if self._verbose:
            console.print(table)
            print()
        
        function_responses = []
        for function_call in function_calls:
            # Handle tab clicks specially using our improved click_at
            if function_call.name == "click_at":
                x = self._denormalize_x(function_call.args.get("x", 0))
                y = self._denormalize_y(function_call.args.get("y", 0))
                if self._verbose:
                    with console.status("Sending command to Computer...", spinner_style=None):
                        await self.click_at(x, y)
                else:
                    await self.click_at(x, y)
            else:
                # Handle other function calls
                if self._verbose:
                    with console.status("Sending command to Computer...", spinner_style=None):
                        pass  # Other functions handled by computer
                
            screenshot = await self._browser_computer.take_screenshot()
            
            function_responses.append(
                FunctionResponse(
                    name=function_call.name,
                    response={"url": self._browser_computer.initial_url},
                    parts=[
                        types.FunctionResponsePart(
                            inline_data=types.FunctionResponseBlob(
                                mime_type="image/png", data=screenshot
                            )
                        )
                    ],
                )
            )
        
        self._contents.append(
            Content(
                role="user",
                parts=[Part(function_response=fr) for fr in function_responses],
            )
        )
        
        return "CONTINUE"
    
    def _denormalize_x(self, x: int) -> int:
        """Convert normalized x coordinate (0-1000) to screen pixels."""
        return int(x / 1000 * self._browser_computer.screen_size()[0])
    
    def _denormalize_y(self, y: int) -> int:
        """Convert normalized y coordinate (0-1000) to screen pixels."""
        return int(y / 1000 * self._browser_computer.screen_size()[1])
    
    async def agent_loop(self):
        """Run the agent loop."""
        status = "CONTINUE"
        while status == "CONTINUE":
            status = await self.run_one_iteration()

# --- 4. TAB DETECTION AND HANDLING ---
async def detect_and_extract_tabs(browser_computer: StandaloneBrowserComputer) -> dict:
    """
    Detect if the page has tabs and extract data from all tabs.
    Returns a dictionary with tab data or None if no tabs found.
    """
    try:
        # Try multiple selectors to find tab buttons
        tab_selectors = [
            "button[role='tab']",
            "[data-tab]",
            ".tab-button",
            ".nav-tabs button",
            ".tabs button",
            "[class*='tab-btn']",
            "li[role='tab']",
            ".tab-list button"
        ]
        
        tab_buttons = []
        for selector in tab_selectors:
            try:
                buttons = await browser_computer.page.query_selector_all(selector)
                if buttons and len(buttons) > 1:
                    tab_buttons = buttons
                    break
            except:
                continue
        
        if not tab_buttons or len(tab_buttons) <= 1:
            return None  # No tabs found
        
        print(f"\n📑 Detected {len(tab_buttons)} tabs. Clicking through each tab...")
        
        all_tabs_data = {}
        
        for i, button in enumerate(tab_buttons):
            try:
                # Get tab label/name BEFORE clicking
                tab_label = await button.text_content()
                tab_label = tab_label.strip() if tab_label else f"Tab {i+1}"
                
                print(f"  ➤ Tab {i+1}: {tab_label}")
                
                # Scroll tab into view if needed
                await button.scroll_into_view_if_needed()
                await asyncio.sleep(0.3)
                
                # Click the tab
                await button.click()
                
                # Wait for content to render
                await asyncio.sleep(0.8)
                
                print(f"  ✓ Successfully switched to Tab {i+1}: {tab_label}")
                
                all_tabs_data[tab_label] = {
                    "tab_index": i,
                    "status": "accessed"
                }
            except Exception as e:
                print(f"  ⚠ Error with tab {i+1}: {str(e)[:50]}")
                try:
                    tab_label = await button.text_content()
                    tab_label = tab_label.strip() if tab_label else f"Tab {i+1}"
                    all_tabs_data[tab_label] = {
                        "tab_index": i,
                        "status": "error"
                    }
                except:
                    pass
        
        return all_tabs_data if all_tabs_data else None
        
    except Exception as e:
        print(f"  ⚠ Tab detection error: {e}")
        return None

# --- 5. PATIENT RECORD EXTRACTION FUNCTION ---
async def extract_patient_record(html_file: str = None, output_file: str = None):
    """
    Opens the patient record HTML file in a browser using an agent,
    extracts all field values (including from tabs if present),
    and saves to a file.
    """
    # Use defaults if not provided
    if html_file is None:
        html_file = r"C:\Users\kater\Downloads\patient-record.html"
    if output_file is None:
        output_file = r"patient_data_extracted.json"
    
    print("Starting patient record extraction using StandaloneBrowserAgent...")
    
    if not os.path.exists(html_file):
        raise FileNotFoundError(f"HTML file not found: {html_file}")
    
    # Convert file path to file:// URL
    file_url = f"file:///{html_file.replace(chr(92), '/')}"
    
    print(f"Opening HTML file in browser: {file_url}")
    
    try:
        # Create browser computer environment
        browser_env = StandaloneBrowserComputer(
            screen_size=PLAYWRIGHT_SCREEN_SIZE,
            initial_url=file_url,
        )
        
        await browser_env.initialize()
        
        # Detect tabs
        print("\n🔍 Checking for tabs...")
        tabs_data = await detect_and_extract_tabs(browser_env)
        
        # Create extraction instruction for the agent
        if tabs_data:
            instruction = """
You are a healthcare data extraction specialist. Your task is to:

1. Look at the patient record form displayed on the screen (this form may have multiple tabs)
2. This form has multiple sections. You have already clicked through the tabs.
3. Carefully read and extract ALL field values from ALL tabs/sections visible, including but not limited to:
   - Patient Name, Date of Birth, Medical Record Number (MRN), Contact Information
   - Chief Complaint, Diagnosis, Clinical Notes
   - Blood Pressure, Heart Rate, Temperature, Respiratory Rate, Oxygen Saturation
   - Medications, Treatment Plan, Management Plan
   - Any other visible fields

4. For each field, note:
   - The field label/name
   - The current value in the field
   - The field type (text, date, number, etc.)
   - Which tab/section it was found in (if applicable)

5. Provide a comprehensive summary listing all extracted fields and their values in a structured format, organized by section/tab.

Start by examining the form on the screen and then provide your findings.
"""
        else:
            instruction = """
You are a healthcare data extraction specialist. Your task is to:

1. Look at the patient record form displayed on the screen
2. Carefully read and extract ALL field values from the form, including:
   - Patient Name
   - Date of Birth
   - Medical Record Number (MRN)
   - Chief Complaint
   - Diagnosis
   - Blood Pressure
   - Heart Rate
   - Temperature
   - Medications
   - Management Plan
   - Clinical Notes
   - Any other visible fields

3. For each field, note:
   - The field label/name
   - The current value in the field
   - The field type (text, date, number, etc.)

4. Provide a comprehensive summary listing all extracted fields and their values in a structured format.

Start by examining the form on the screen and then provide your findings.
"""
        
        # Initialize the agent
        agent = StandaloneBrowserAgent(
            browser_computer=browser_env,
            query=instruction,
            model_name=MODEL_ID,
            verbose=True,
        )
        
        print("\n🤖 Running browser agent to extract patient record data...\n")
        
        # Run the agent loop
        await agent.agent_loop()
        
        # Extract the reasoning from the agent
        agent_summary = agent.final_reasoning if agent.final_reasoning else "No summary available"
        
        # Parse the agent's response to extract field data
        patient_data = {
            "extraction_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source_file": html_file,
            "source_url": file_url,
            "has_tabs": tabs_data is not None,
            "tabs": tabs_data if tabs_data else None,
            "status": "completed",
            "agent_reasoning": agent_summary,
            "fields": parse_agent_response(agent_summary)
        }
        
        # Save the extracted data to a JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(patient_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Patient record extraction completed successfully.")
        print(f"📁 Data saved to: {output_file}")
        print(f"📑 Tabs detected: {patient_data['has_tabs']}")
        print(f"\n📊 Extracted {len(patient_data['fields'])} fields:")
        
        # Display the extracted fields
        for field_key, field_value in patient_data['fields'].items():
            print(f"  - {field_key}: {field_value}")
        
        await browser_env.close()
        
        return output_file
        
    except Exception as e:
        print(f"\n❌ Extraction failed: {e}")
        try:
            await browser_env.close()
        except:
            pass
        raise

def parse_agent_response(response):
    """
    Parse the agent's response to extract structured field data.
    """
    fields = {}
    
    lines = response.split('\n')
    
    for line in lines:
        if ':' in line:
            parts = line.split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip().replace('-', '').replace('•', '').strip()
                value = parts[1].strip()
                if key and value and len(key) > 0:
                    key_clean = re.sub(r'[^a-zA-Z0-9\s]', '', key).replace(' ', '_').lower()
                    if key_clean and len(key_clean) > 2:
                        fields[key_clean] = value
    
    return fields

# --- 6. TERMINAL ENTRY POINT ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract patient record data from HTML file using standalone agent.")
    parser.add_argument(
        "--file",
        type=str,
        default=None,
        help="Path to the HTML file to extract (optional, defaults to Downloads/patient-record.html)."
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path to save the extracted data JSON file (optional)."
    )
    args = parser.parse_args()
    
    asyncio.run(extract_patient_record(html_file=args.file, output_file=args.output))