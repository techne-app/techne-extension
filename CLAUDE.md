# Techne Browser Extension

## Overview
Techne is a sophisticated browser extension that enhances the Hacker News experience by providing AI-powered content analysis, personalized tag recommendations, and semantic search capabilities. It helps users discover relevant discussions and understand nuanced tech conversations beyond keyword matching.

## Key Features
- **AI-Powered Content Tagging**: Automatic tag generation for HN stories and comments
- **Personalized Tag Ranking**: ML-based tag ranking using user browsing history
- **Semantic Search**: Natural language search for relevant threads
- **Chat Interface**: Local AI-powered conversational interface with WebLLM
- **User Data Management**: Local storage with IndexedDB for privacy
- **Extension Popup**: Rich UI with tabbed interface for search, activity, chat, and settings

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
- `thread_theme`: Discussion themes (used on main page and search)
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
The popup provides four main tabs:
- **Search Tab**: Semantic search with autocomplete and results display
- **Activity Tab**: History of visited threads and clicked tags
- **Chat Tab**: Local AI chat interface with conversation management
- **Settings Tab**: User preferences and feature toggles

The interface uses an overlay menu bar for tab navigation and defaults to the chat tab when the chat interface is enabled.

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
- Feature flags control interface availability and default tabs

## Agentic Search Evolution

The following phases outline the roadmap for evolving from current basic search to powerful agentic search capabilities, while maintaining backward compatibility and preparing for MCP (Model Context Protocol) integration.

### Current State
- **Existing Search**: Limited to recent top 30 stories with frontend semantic matching
- **Chat Interface**: Local WebLLM-powered conversations with basic message handling
- **Backend**: Azure Functions with basic tag APIs, evolving toward MCP server capabilities

### Phase 1: Current Search as "Tool"
- **Search Tool Integration**: Wrap existing search functionality as a chat "tool"
- **Intent Detection**: Chat interface detects search intent and routes to current search logic
- **Proof of Concept**: Use as testing ground for future MCP tool integration patterns
- **Seamless UX**: Maintain all existing search capabilities within conversational interface
- **Bridge Architecture**: Create patterns that will extend to MCP tools

### Phase 2: MCP-Ready Chat Architecture
- **Tool-Oriented Design**: Redesign chat interface to support tool calling patterns
- **Message Routing**: Create extensible message handling that can route to different "tools"
- **Context Management**: Build conversation context management for multi-step reasoning
- **Function Calling**: Prepare infrastructure for future MCP function calling capabilities
- **Backward Compatibility**: Maintain all existing chat functionality

### Phase 3: MCP Integration Layer
- **MCP Client**: Implement MCP client capabilities in chat interface
- **Backend Connection**: Connect to backend MCP servers when they become available
- **Tool Orchestration**: Create system for managing multiple MCP tools and their interactions
- **Historical Data**: Access backend's historical HN data and vector indexing capabilities
- **Agent Behavior**: Enable multi-step reasoning: "find AI discussions from 2023, then show related startups"

### Phase 4: Full Agentic Search
- **Historical Analysis**: Search across years of HN data with powerful backend vector indexing
- **Multi-Step Reasoning**: Complex queries that require multiple API calls and context building
- **Topic Evolution**: Track how discussions evolve over time periods
- **Pattern Recognition**: Identify trends, user patterns, and emerging topics
- **Contextual Intelligence**: Build understanding across related discussions and time periods

### Key Design Principles
- **MCP-First**: Architecture designed for MCP server integration from the start
- **Tool Orchestration**: Chat interface as intelligent tool coordinator
- **Backward Compatible**: Current search functionality remains intact throughout evolution
- **Future-Proof**: Can scale from simple search to full agentic capabilities without breaking changes
- **Black Box Backend**: Design assumes backend is extensible black box that will expose MCP servers

### Technical Implementation Strategy
- **Extensible Architecture**: Chat interface designed to handle any number of MCP tools
- **Function Calling**: Conversation handling that can orchestrate multiple backend calls
- **Context Preservation**: Multi-step reasoning with conversation memory and context building
- **Graceful Degradation**: Fallback to current search capabilities when backend tools unavailable
- **Feature Flags**: Control rollout of agentic capabilities as backend evolves

### Benefits of Agentic Approach
- **Powerful Search**: Access to historical data and sophisticated vector indexing
- **Intelligent Reasoning**: Multi-step queries that go beyond simple keyword matching
- **Natural Interface**: Conversational search that understands intent and context
- **Scalable Architecture**: Can accommodate any backend MCP tools as they become available
- **Enhanced Discovery**: Find patterns and connections across time periods and topics