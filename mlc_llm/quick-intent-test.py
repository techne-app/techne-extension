#!/usr/bin/env python3
"""
Quick Intent Testing with Local MLC Model

Test different prompts and temperatures for intent detection
Usage:
    python scripts/quick-intent-test.py "find AI discussions"
    python scripts/quick-intent-test.py --batch
    python scripts/quick-intent-test.py --prompt simple "search for React"
    python scripts/quick-intent-test.py --temp 0.0 --prompt minimal "test query"
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from mlc_llm import MLCEngine
    MLC_AVAILABLE = True
except ImportError:
    print("⚠️  MLC LLM not installed. Install with:")
    print("   uv pip install --pre -f https://mlc.ai/wheels mlc-llm-nightly")
    print("   uv pip install --pre -f https://mlc.ai/wheels mlc-ai-nightly")
    MLC_AVAILABLE = False

# Test queries
TEST_QUERIES = [
    # Should be ACTION
    "find discussions about AI",
    "search for startups", 
    "can you find me discussions about React?",
    "show me posts about machine learning",
    "look up JavaScript discussions",
    "get me some blockchain threads",
    
    # Should be CHAT  
    "hello how are you",
    "what do you think about React?", 
    "can you explain machine learning?",
    "tell me about startups",
    "how does JavaScript work?",
    "what is blockchain?"
]

# Prompt template - original search intent detection that works well
PROMPT_TEMPLATE = """You are an intelligent assistant that determines if a user message is asking to search for something.

Analyze this message and determine:
1. Is the user asking to search for, find, or look up information?
2. If yes, what specific search query should be extracted?
3. How confident are you in this assessment?

User message: "{message}"

Respond with ONLY valid JSON in this exact format:
{{
  "isSearch": true or false,
  "searchQuery": "extracted query" or null,
  "confidence": number between 0 and 1,
  "reasoning": "brief explanation"
}}

Examples:
- "find discussions about AI" → {{"isSearch": true, "searchQuery": "AI", "confidence": 0.9, "reasoning": "Clear search intent with specific topic"}}
- "what about startups?" → {{"isSearch": true, "searchQuery": "startups", "confidence": 0.8, "reasoning": "Question about a topic implies search intent"}}
- "hello how are you" → {{"isSearch": false, "searchQuery": null, "confidence": 0.9, "reasoning": "Greeting with no search intent"}}
- "can you help me understand React" → {{"isSearch": false, "searchQuery": null, "confidence": 0.7, "reasoning": "Asking for explanation, not search"}}

JSON Response:"""

class IntentTester:
    def __init__(self):
        self.engine = None
        self.model_path = None
        self.find_model_path()
    
    def find_model_path(self):
        """Find the local model path"""
        # Try from current directory first (extension root)
        current_dir = Path.cwd()
        model_dir = current_dir / "models" / "Llama-3.2-3B-Instruct-q4f16_1-MLC"
        
        if model_dir.exists():
            self.model_path = str(model_dir)
            print(f"📁 Found model at: {self.model_path}")
            return
            
        # Try going up one level if we're in mlc_llm/
        script_dir = Path(__file__).parent
        if script_dir.name == "mlc_llm":
            repo_root = script_dir.parent
            model_dir = repo_root / "models" / "Llama-3.2-3B-Instruct-q4f16_1-MLC"
            
            if model_dir.exists():
                self.model_path = str(model_dir)
                print(f"📁 Found model at: {self.model_path}")
                return
        
        print(f"❌ Model not found. Tried:")
        print(f"   - {current_dir / 'models' / 'Llama-3.2-3B-Instruct-q4f16_1-MLC'}")
        if script_dir.name == "mlc_llm":
            repo_root = script_dir.parent
            print(f"   - {repo_root / 'models' / 'Llama-3.2-3B-Instruct-q4f16_1-MLC'}")
        print("💡 Make sure you're running from the repo root directory")
        print("💡 Or that the models/ folder exists with the Llama model")
        sys.exit(1)
    
    def init_engine(self):
        """Initialize the MLC engine"""
        if not MLC_AVAILABLE:
            print("❌ MLC LLM not available")
            return False
            
        if self.engine is None:
            print("🚀 Initializing MLC Engine...")
            try:
                self.engine = MLCEngine(self.model_path)
                print("✅ Engine initialized successfully")
                return True
            except Exception as e:
                print(f"❌ Failed to initialize engine: {e}")
                return False
        return True
    
    def call_model(self, prompt, temperature=0.1):
        """Call the model with the given prompt"""
        if not self.init_engine():
            return None
            
        print(f"\n🤖 Calling Llama-3.2-3B (temp={temperature})...")
        print(f"📝 Prompt preview: \"{prompt[:100]}...\"")
        
        try:
            response = self.engine.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=200,
                stream=False
            )
            
            content = response.choices[0].message.content
            print(f"📤 Model response length: {len(content)} chars")
            return content
            
        except Exception as e:
            print(f"❌ Model call failed: {e}")
            return None
    
    def parse_response(self, response):
        """Parse JSON response from model"""
        if not response:
            return {"error": "No response from model"}
            
        try:
            # Extract JSON from response (in case there's extra text)
            json_match = re.search(r'\{[^{}]*\}', response)
            if not json_match:
                return {"error": "No JSON found in response", "raw": response}
            
            parsed = json.loads(json_match.group())
            
            # Validate original format fields
            if "isSearch" not in parsed:
                return {"error": "Missing isSearch field", "raw": response}
            
            if not isinstance(parsed["isSearch"], bool):
                return {"error": f"Invalid isSearch field: {parsed['isSearch']}", "raw": response}
            
            if "confidence" not in parsed or not (0 <= parsed["confidence"] <= 1):
                return {"error": "Invalid confidence field", "raw": response}
            
            # Convert to standard format for consistent processing
            parsed["intentCategory"] = "action" if parsed["isSearch"] else "chat"
            
            return parsed
            
        except json.JSONDecodeError as e:
            return {"error": f"JSON parse error: {e}", "raw": response}
        except Exception as e:
            return {"error": f"Parse error: {e}", "raw": response}
    
    def get_expected_result(self, query):
        """Determine expected result based on keywords"""
        action_keywords = ['find', 'search', 'show', 'get', 'look up', 'retrieve']
        query_lower = query.lower()
        
        for keyword in action_keywords:
            if keyword in query_lower:
                return 'action'
        return 'chat'
    
    def test_single_query(self, query, temperature=0.1):
        """Test a single query"""
        print(f"\n🧪 Testing: \"{query}\"")
        print(f"🌡️  Temperature: {temperature}")
        
        # Build prompt
        prompt = PROMPT_TEMPLATE.format(message=query)
        
        # Call model
        response = self.call_model(prompt, temperature)
        if not response:
            return None
        
        # Parse response
        parsed = self.parse_response(response)
        
        # Show results
        print(f"\n📄 Raw response: \"{response}\"")
        print(f"\n📊 Parsed result:")
        
        if "error" in parsed:
            print(f"   ❌ Parse Error: {parsed['error']}")
            if "raw" in parsed:
                print(f"   📄 Raw: {parsed['raw']}")
            return None
        
        print(f"   Category: {parsed.get('intentCategory', 'ERROR')}")
        print(f"   Confidence: {parsed.get('confidence', 'ERROR')}")
        print(f"   Reasoning: {parsed.get('reasoning', 'N/A')}")
        
        # Check correctness
        expected = self.get_expected_result(query)
        correct = parsed.get('intentCategory') == expected
        
        print(f"   Expected: {expected} → {'✅ CORRECT' if correct else '❌ WRONG'}")
        
        return {
            'query': query,
            'parsed': parsed,
            'expected': expected,
            'correct': correct,
            'raw_response': response
        }
    
    def test_batch(self, temperature=0.1):
        """Test all queries in batch"""
        print(f"\n🚀 Batch testing all queries with temperature {temperature}")
        
        results = []
        for query in TEST_QUERIES:
            result = self.test_single_query(query, temperature)
            if result:
                results.append(result)
        
        # Summary
        if results:
            correct = sum(1 for r in results if r['correct'])
            total = len(results)
            accuracy = (correct / total * 100) if total > 0 else 0
            
            print(f"\n📈 BATCH RESULTS:")
            print(f"   Accuracy: {correct}/{total} ({accuracy:.1f}%)")
            
            # Show incorrect results
            incorrect = [r for r in results if not r['correct']]
            if incorrect:
                print(f"   ❌ Incorrect ({len(incorrect)}):")
                for r in incorrect:
                    print(f"      \"{r['query']}\" → {r['parsed']['intentCategory']} (expected {r['expected']})")
        
        return results

def main():
    parser = argparse.ArgumentParser(description='Test search intent detection with local MLC model')
    parser.add_argument('query', nargs='?', help='Query to test')
    parser.add_argument('--batch', action='store_true', help='Test all queries')
    parser.add_argument('--temp', type=float, default=0.1, help='Temperature (0.0-1.0)')
    
    args = parser.parse_args()
    
    if not args.query and not args.batch:
        parser.print_help()
        print(f"\nExamples:")
        print(f"  python mlc_llm/quick-intent-test.py \"find AI discussions\"")
        print(f"  python mlc_llm/quick-intent-test.py --batch")
        print(f"  python mlc_llm/quick-intent-test.py --temp 0.3 \"search for React\"")
        return
    
    tester = IntentTester()
    
    try:
        if args.batch:
            tester.test_batch(args.temp)
        elif args.query:
            tester.test_single_query(args.query, args.temp)
            
    except KeyboardInterrupt:
        print("\n👋 Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())