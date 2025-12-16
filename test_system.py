"""
Simple test script to verify the system is working correctly
"""

import os
import sys
from pathlib import Path

def test_imports():
    """Test that all modules can be imported"""
    print("Testing imports...")
    try:
        import config
        import llm_client
        import tools
        import agents
        import orchestrator
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import failed: {str(e)}")
        return False

def test_configuration():
    """Test that configuration is valid"""
    print("\nTesting configuration...")
    try:
        from config import LLM_CONFIGS, DEFAULT_PROVIDER, AGENT_CONFIG

        if DEFAULT_PROVIDER not in LLM_CONFIGS:
            print(f"❌ Invalid DEFAULT_PROVIDER: {DEFAULT_PROVIDER}")
            return False

        print(f"✅ Configuration valid (provider: {DEFAULT_PROVIDER})")
        return True
    except Exception as e:
        print(f"❌ Configuration test failed: {str(e)}")
        return False

def test_api_key():
    """Test that API key is set"""
    print("\nTesting API key...")
    try:
        from config import DEFAULT_PROVIDER, LLM_CONFIGS

        config = LLM_CONFIGS[DEFAULT_PROVIDER]
        api_key = config.get("api_key", "")

        if not api_key:
            print(f"⚠️  Warning: No API key found for provider '{DEFAULT_PROVIDER}'")
            print(f"   Please set the appropriate environment variable:")
            if DEFAULT_PROVIDER == "custom":
                print(f"   export LLM_API_KEY='your-key'")
            elif DEFAULT_PROVIDER == "deepseek":
                print(f"   export DEEPSEEK_API_KEY='your-key'")
            elif DEFAULT_PROVIDER == "openai":
                print(f"   export OPENAI_API_KEY='your-key'")
            return False

        print(f"✅ API key configured (length: {len(api_key)})")
        return True
    except Exception as e:
        print(f"❌ API key test failed: {str(e)}")
        return False

def test_directories():
    """Test that required directories exist or can be created"""
    print("\nTesting directories...")
    try:
        from config import LOG_DIR, OUTPUT_DIR

        dirs = [LOG_DIR, OUTPUT_DIR]
        for directory in dirs:
            path = Path(directory)
            if not path.exists():
                path.mkdir(parents=True, exist_ok=True)
                print(f"✅ Created directory: {directory}")
            else:
                print(f"✅ Directory exists: {directory}")

        return True
    except Exception as e:
        print(f"❌ Directory test failed: {str(e)}")
        return False

def test_tools():
    """Test that tools can be initialized"""
    print("\nTesting tools...")
    try:
        from tools import ToolManager

        tool_manager = ToolManager(base_dir="./test_output")
        tools = tool_manager.get_all_tools()

        print(f"✅ Tool manager initialized with {len(tools)} tools")

        # Test file creation
        result = tool_manager.execute_tool("create_file", {
            "file_path": "test.txt",
            "content": "Hello, World!"
        })

        if result.get("success"):
            print("✅ File creation test passed")

            # Clean up
            import shutil
            if Path("./test_output").exists():
                shutil.rmtree("./test_output")

            return True
        else:
            print(f"❌ File creation test failed: {result.get('message')}")
            return False

    except Exception as e:
        print(f"❌ Tools test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("="*60)
    print("Multi-Agent Code Generation System - Test Suite")
    print("="*60)

    tests = [
        test_imports,
        test_configuration,
        test_api_key,
        test_directories,
        test_tools
    ]

    results = []
    for test in tests:
        results.append(test())

    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)

    passed = sum(results)
    total = len(results)

    print(f"Passed: {passed}/{total}")

    if passed == total:
        print("✅ All tests passed!")
        return 0
    elif passed >= total - 1:
        print("⚠️  Most tests passed, but API key is not configured")
        print("   The system will not work without an API key")
        return 1
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
