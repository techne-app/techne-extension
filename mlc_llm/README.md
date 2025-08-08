# Intent Detection Testing with MLC LLM

Test intent detection prompts and parameters using local MLC LLM models. This tool helps debug and optimize prompt engineering for reliable intent classification.

## Prerequisites

- **git-lfs**: Required for downloading large model files
- **Python 3.10+**: For running MLC LLM
- **uv**: Modern Python package manager

```bash
# Install git-lfs (required for model downloads)
brew install git-lfs
git lfs install

# Install uv if you don't have it
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Model Setup

### 1. Download MLC Model

From the repo root, download a complete MLC-compiled model:

```bash
cd models

# Remove any existing incomplete model
rm -rf Llama-3.2-3B-Instruct-q4f16_1-MLC

# Download complete model with git-lfs (required for .bin files)
git clone https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC

# Verify large files downloaded correctly (should be 100+ MB each)
ls -lah Llama-3.2-3B-Instruct-q4f16_1-MLC/*.bin

cd ..
```

### 2. Python Environment Setup

```bash
cd mlc_llm

# Create virtual environment with uv
uv venv

# Activate virtual environment
source .venv/bin/activate  # On macOS/Linux
# or .venv\Scripts\activate  # On Windows

# Install MLC LLM (requires special wheel repository)
uv pip install --pre -f https://mlc.ai/wheels mlc-llm-nightly
uv pip install --pre -f https://mlc.ai/wheels mlc-ai-nightly

cd ..
```

## Usage

**Important**: Always run from the repo root directory so the script can find the model.

```bash
# Activate the virtual environment FIRST
source mlc_llm/.venv/bin/activate

# Test single query with different prompts
python mlc_llm/quick-intent-test.py "find AI discussions"
python mlc_llm/quick-intent-test.py --prompt simple "search for React"
python mlc_llm/quick-intent-test.py --prompt minimal "show me blockchain"

# Test with different temperatures
python mlc_llm/quick-intent-test.py --temp 0.0 "find startups"
python mlc_llm/quick-intent-test.py --temp 0.5 "hello there"

# Batch test all queries for accuracy analysis
python mlc_llm/quick-intent-test.py --batch
python mlc_llm/quick-intent-test.py --batch --prompt simple --temp 0.3
```

## Available Prompt Templates

- **`current`** - The full prompt from your extension (verbose with examples)
- **`simple`** - Simplified classification prompt  
- **`minimal`** - Ultra-short prompt (often ignores instructions)
- **`explicit`** - Clear keyword-based prompt

## What The Script Does

1. **Loads your local model** from `models/Llama-3.2-3B-Instruct-q4f16_1-MLC/`
2. **Tests prompt variations** with configurable temperature settings
3. **Shows raw model responses** so you can see exactly what the LLM outputs
4. **Parses JSON results** and validates the response format
5. **Compares against expected results** (action vs chat based on keywords)
6. **Calculates accuracy metrics** for batch testing

## Example Output

```bash
$ python mlc_llm/quick-intent-test.py "find AI discussions"

🧪 Testing: "find AI discussions"
📋 Prompt: current, Temperature: 0.1
🤖 Calling Llama-3.2-3B (temp=0.1)...
📤 Model response length: 300 chars

📄 Raw response: "{
  "intentCategory": "chat",
  "confidence": 1,
  "reasoning": "The user's message does not contain keywords like find, search..."
}"

📊 Parsed result:
   Category: chat
   Confidence: 1
   Reasoning: The user's message does not contain keywords like find, search...
   Expected: action → ❌ WRONG
```

## Key Findings

Testing reveals that **Llama-3.2-3B is unreliable for intent detection**:

- **Contradicts itself**: Claims "find" isn't a search keyword while listing "find" as a search example
- **Poor instruction following**: 3B model too small for complex classification tasks
- **Inconsistent reasoning**: Same query gets different classifications across runs

**Recommendation**: Use simple keyword-based detection instead of LLM classification for production intent detection.

## Troubleshooting

### Model Download Issues
- **Empty .bin files**: You need `git-lfs` installed before cloning
- **"EOF while parsing" errors**: Config files are missing/empty - re-download complete model

### Python Environment Issues  
- **"No module named tvm"**: Install both MLC packages: `mlc-llm-nightly` and `mlc-ai-nightly`
- **Import errors**: Use the special wheel repository URLs, not standard PyPI

### Runtime Issues
- **"Corrupted parameter" errors**: Model files didn't download completely - verify `.bin` file sizes
- **Memory errors**: Model requires ~4GB GPU memory - try smaller batch sizes or "interactive" mode