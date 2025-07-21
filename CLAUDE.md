# Techne Browser Extension

## Overview
Techne is a sophisticated browser extension that enhances the Hacker News experience by providing AI-powered content analysis, personalized tag recommendations, and conversational search capabilities. It helps users discover relevant discussions and understand nuanced tech conversations through a chat-first interface powered by local AI models.

## Key Features
- **AI-Powered Content Tagging**: Automatic tag generation for HN stories and comments
- **Personalized Tag Ranking**: ML-based tag ranking using user browsing history
- **Conversational Search**: Chat-first interface with LLM-powered intent detection for natural language search
- **Local AI Chat**: Fully local WebLLM-powered conversational interface with search integration
- **User Data Management**: Local storage with IndexedDB for privacy
- **Streamlined UI**: Clean 3-tab interface (Chat, Activity, Settings) with chat as primary interaction mode

## Tech Stack
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Webpack 5 + ts-loader
- **AI/ML**: Hugging Face Transformers.js, ONNX Runtime Web, WebLLM
- **Database**: Dexie.js (IndexedDB wrapper)
- **Extension**: Chrome Manifest V3

## Development

### Setup
```bash
npm install
```

### Build Commands
```bash
npm run build       # Production build
npm run dev         # Development build with watch mode
```

### Version Management
```bash
npm run version:patch    # 1.8.0 → 1.8.1
npm run version:minor    # 1.8.0 → 1.9.0
npm run version:major    # 1.8.0 → 2.0.0
```

The version script automatically updates both `package.json` and `public/manifest.json`.

### Testing Extension
1. Run `npm run build` to create the `dist/` folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder
5. Navigate to Hacker News to see the extension in action

## Project Structure
```
src/
├── background/           # Service worker and ML processing
│   ├── index.ts         # Main background script
│   ├── embed.js         # Text embedding functionality
│   ├── personalize.ts   # Tag ranking algorithms
│   └── contextDb.ts     # Database operations
├── content-scripts/     # Page-specific injection scripts
│   ├── main-page/       # HN front page functionality
│   ├── item-page/       # Individual story/comment pages
│   └── profile-page/    # User profile pages
├── popup/               # Extension popup UI
│   ├── index.tsx        # Main popup component
│   └── components/      # React components
├── utils/               # Shared utilities
├── types/               # TypeScript definitions
└── styles/              # CSS/Tailwind styles
```

## Configuration Files

### `src/config.ts`
Static application configuration:
- **API URLs**: Backend endpoints and base URLs
- **UI Styling**: Default colors and styling constants  
- **Business Rules**: MAX_STORY_TAGS, etc.
- **DEFAULT_MODEL**: Default AI model (`Llama-3.2-3B-Instruct-q4f16_1-MLC`)

### `src/utils/configStore.ts`
User preferences and runtime settings:
- **Chat Configuration**: Model selection, temperature, topP, maxTokens
- **Database Integration**: Saves/loads user preferences to IndexedDB
- **Dynamic Settings**: User-changeable settings that persist across sessions

### `public/manifest.json`
Extension configuration and permissions. Key settings:
- **manifest_version**: 3 (Chrome MV3)
- **permissions**: ["tabs"]
- **content_scripts**: Injected into HN pages
- **web_accessible_resources**: Extension assets
- **minimum_chrome_version**: 92

### `feature-flags.json`
Feature toggle configuration:
```json
{
  "tag_personalization": true,
  "chat_interface": true,
  "tag_search": true
}
```
Note: `tag_search` controls search functionality within the chat interface. The standalone search tab has been removed.

### `webpack.config.js`
Build configuration with multiple entry points:
- Background script
- Popup interface
- Content scripts for different HN pages

## API Integration
- **Techne Backend**: Azure Functions at `techne-pipeline-func-prod.azurewebsites.net`
- **Story Tags**: `/api/story-tags/` endpoint
- **Thread Tags**: `/api/thread-tags/` endpoint
- **Hacker News API**: Firebase API for story metadata

## Key Dependencies
- `@huggingface/transformers`: AI text embeddings
- `@mlc-ai/web-llm`: Local AI chat models
- `dexie`: IndexedDB operations
- `react`: UI framework
- `downshift`: Autocomplete components
- `progressbar.js`: Loading indicators

## Tag System
The extension supports multiple tag types:
- `thread_theme`: Discussion themes (used on main page and chat search)
- `thread_category`: Topic categories (used on item and profile pages)

Tags are visually integrated into the HN UI with a maximum of 3 tags per story.

## Data Storage
All user data is stored locally using IndexedDB:
- **Tag History**: Clicked tags with timestamps
- **Search History**: Previous search queries
- **Chat Conversations**: Conversation history with messages
- **Settings**: User preferences and feature toggles
- **Embeddings**: Cached text embeddings for performance

## User Interface
The popup provides a streamlined 3-tab interface:
- **Chat Tab**: Primary interface for both conversational AI and search functionality with LLM-powered intent detection
- **Activity Tab**: History of visited threads, clicked tags, and recent searches displayed in a two-column layout
- **Settings Tab**: User preferences and feature toggles

The interface uses an overlay menu bar for tab navigation and defaults to the chat tab (or settings if chat is disabled). All search functionality has been integrated into the conversational chat interface, eliminating the need for a separate search tab.

## Security & Privacy
- **Local-First**: All data stored locally
- **No Cross-Site Tracking**: Only operates on HN domains
- **Content Security Policy**: Strict CSP with WebAssembly support
- **Minimum Chrome Version**: Requires Chrome 92+

## Performance
- **Lazy Loading**: AI models loaded on-demand
- **Efficient Caching**: Embeddings cached to avoid recomputation
- **Memory Management**: Singleton pattern for ML models
- **Batch Processing**: Tags processed in batches

## Development Notes
- Extension uses Chrome Extension Manifest V3
- All content scripts inject into specific HN page patterns
- WebAssembly support enabled for ML model execution
- TypeScript strict mode enabled for type safety
- Tailwind CSS for responsive design
- Chat interface runs entirely locally with WebLLM models
- Chat interface is the primary interaction mode with integrated search functionality
- Feature flags control interface availability and default tabs

### Logging
This codebase uses a custom logger system (`src/utils/logger.ts`) instead of direct console statements:
```typescript
import { logger } from '../utils/logger';
logger.debug('message');  // Instead of console.log()
logger.error('error');    // Instead of console.error()
```
Available methods: `debug()`, `info()`, `warn()`, `error()`, `search()`, `chat()`, `model()`, `database()`, `api()`, `intent()`. Development shows all logs, production only shows errors.

## Agentic Search Evolution

The following phases outline the roadmap for evolving from current chat-first search to powerful agentic search capabilities, preparing for MCP (Model Context Protocol) integration.

### Current State (Phase 1 - Completed)
- **Chat-First Interface**: Removed standalone search tab, all search happens through conversational interface
- **SearchService Integration**: Backend search functionality preserved and accessible via chat
- **Intent Detection Foundation**: Basic intent detection with `IntentDetector` utility using local LLM
- **Unified UX**: Single interface for both chat and search, with recent searches in Activity tab
- **Backend**: Azure Functions with basic tag APIs, evolving toward MCP server capabilities

### Phase 2: Enhanced Intent Detection & Function Calling
- **Advanced Intent Detection**: Improve LLM-based intent detection with more sophisticated patterns
- **Function Calling Patterns**: Implement structured function calling for search operations
- **Multi-Step Reasoning**: Enable chat interface to handle complex, multi-part search queries
- **Search Context Management**: Maintain search context across conversation turns
- **Proof of Concept**: Use as testing ground for future MCP tool integration patterns

### Phase 3: MCP-Ready Chat Architecture
- **Tool-Oriented Design**: Redesign chat interface to support tool calling patterns
- **Message Routing**: Create extensible message handling that can route to different "tools"
- **Context Management**: Build conversation context management for multi-step reasoning
- **Function Calling**: Prepare infrastructure for future MCP function calling capabilities
- **Backward Compatibility**: Maintain all existing chat functionality

### Phase 4: MCP Integration Layer
- **MCP Client**: Implement MCP client capabilities in chat interface
- **Backend Connection**: Connect to backend MCP servers when they become available
- **Tool Orchestration**: Create system for managing multiple MCP tools and their interactions
- **Historical Data**: Access backend's historical HN data and vector indexing capabilities
- **Agent Behavior**: Enable multi-step reasoning: "find AI discussions from 2023, then show related startups"

### Phase 5: Full Agentic Search
- **Historical Analysis**: Search across years of HN data with powerful backend vector indexing
- **Multi-Step Reasoning**: Complex queries that require multiple API calls and context building
- **Topic Evolution**: Track how discussions evolve over time periods
- **Pattern Recognition**: Identify trends, user patterns, and emerging topics
- **Contextual Intelligence**: Build understanding across related discussions and time periods

### Key Design Principles
- **Chat-First**: All search functionality integrated into conversational interface
- **MCP-First**: Architecture designed for MCP server integration from the start
- **Tool Orchestration**: Chat interface as intelligent tool coordinator
- **Progressive Enhancement**: Evolve from current chat+search integration to full agentic capabilities
- **Future-Proof**: Can scale from simple intent detection to complex multi-step reasoning
- **Black Box Backend**: Design assumes backend is extensible black box that will expose MCP servers

### Technical Implementation Strategy
- **LLM-Based Intent Routing**: Use Llama 3.2's function calling capabilities for intent detection
- **Unified Interface**: Single chat interface handles both conversational AI and search requests
- **Extensible Architecture**: Chat interface designed to handle any number of MCP tools
- **Function Calling**: Conversation handling that can orchestrate multiple backend calls
- **Context Preservation**: Multi-step reasoning with conversation memory and context building
- **SearchService Integration**: Existing search functionality accessible through chat intent detection
- **Feature Flags**: Control rollout of agentic capabilities as backend evolves

### Modern Agentic Search Patterns (2024)
- **Hybrid Routing Systems**: Combine LLMs with traditional methods for optimal performance
- **Intent Detection Evolution**: LLMs excel at understanding user intent from natural language
- **Manual Function Calling**: WebLLM supports manual function calling with JSON parsing
- **Uncertainty-Based Routing**: Route between different approaches based on confidence scores
- **Structured Output Parsing**: Manual JSON parsing for tool calling until OpenAI API compatibility arrives

### Benefits of Chat-First Agentic Approach
- **Unified Experience**: Single interface for all user interactions eliminates context switching
- **Natural Language**: Conversational search that understands intent and context
- **Progressive Capability**: Can evolve from simple search to complex multi-step reasoning
- **Powerful Search**: Future access to historical data and sophisticated vector indexing via MCP
- **Intelligent Reasoning**: Multi-step queries that go beyond simple keyword matching
- **Scalable Architecture**: Can accommodate any backend MCP tools as they become available
- **Enhanced Discovery**: Find patterns and connections across time periods and topics

## Chrome Extension Promise Handling Guidelines

### Critical Chrome Extension Promise Error Patterns

When working with Chrome extension APIs, always handle promises properly to avoid uncaught promise rejections that create user-facing console errors.

#### Chrome Runtime Messages
**Problem**: `chrome.runtime.sendMessage()` returns a Promise that can reject with "Could not establish connection. Receiving end does not exist" when the receiving end is closed/unavailable.

**Solution**: Always add `.catch()` handlers to all `chrome.runtime.sendMessage()` calls:

```javascript
// ❌ BAD - Can cause uncaught promise rejection
chrome.runtime.sendMessage({
  type: 'SOME_MESSAGE',
  data: {}
});

// ✅ GOOD - Handles promise rejection
chrome.runtime.sendMessage({
  type: 'SOME_MESSAGE', 
  data: {}
}).catch((error) => {
  logger.debug('No listeners for message, this is expected');
});
```

#### Async Callbacks in Streaming Operations
**Problem**: When passing async callbacks to functions (like `onProgress` callbacks), the callback's Promise can reject and become uncaught.

**Solution**: Always await async callbacks and wrap them in try-catch:

```javascript
// ❌ BAD - Async callback not awaited
if (onProgress) {
  onProgress(content); // Returns unhandled Promise
}

// ✅ GOOD - Async callback properly awaited
if (onProgress) {
  await onProgress(content); // Await the Promise
}
```

#### Background Script Message Responses
**Problem**: Background scripts sending response messages back to UI can fail if UI is closed, causing uncaught rejections.

**Solution**: Combine try-catch blocks with `.catch()` handlers:

```javascript
// ✅ GOOD - Dual error handling
try {
  chrome.runtime.sendMessage({
    type: 'RESPONSE_MESSAGE',
    data: results
  }).catch((error) => {
    logger.debug('No listeners for response, this is expected');
  });
} catch (error) {
  logger.debug('Synchronous error in sendMessage');
}
```

### Transformers.js Browser Compatibility

#### Webpack Configuration for Transformers.js 3.6+
**Problem**: Newer versions include Node.js dependencies that break browser builds.

**Solution**: Use the dedicated browser build via webpack alias:

```javascript
// webpack.config.js
resolve: {
  alias: {
    "@huggingface/transformers": path.resolve(
      __dirname,
      "node_modules/@huggingface/transformers/dist/transformers.web.js"
    ),
  }
}
```

#### ONNX Runtime Logging Suppression
**Problem**: ONNX runtime produces verbose console logs that concern users.

**Solution**: Set `logSeverityLevel: 4` in pipeline session options:

```javascript
const pipeline = await pipeline("feature-extraction", "model-name", {
  device: "webgpu",
  session_options: {
    logSeverityLevel: 4, // Fatal only - suppress all non-fatal logs
  },
});
```

### Key Development Practices
- **Always use `.catch()` on Chrome extension promises** to prevent user-facing console errors
- **Await async callbacks** in streaming operations to handle their promise rejections
- **Use browser-specific builds** for ML libraries when available
- **Test extension message passing** with popup closed to verify error handling
- **Suppress non-fatal logs** in production to avoid alarming users