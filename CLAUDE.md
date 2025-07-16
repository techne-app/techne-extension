# Techne Browser Extension

## Overview
Techne is a sophisticated browser extension that enhances the Hacker News experience by providing AI-powered content analysis, personalized tag recommendations, and semantic search capabilities. It helps users discover relevant discussions and understand nuanced tech conversations beyond keyword matching.

## Key Features
- **AI-Powered Content Tagging**: Automatic tag generation for HN stories and comments
- **Personalized Tag Ranking**: ML-based tag ranking using user browsing history
- **Semantic Search**: Natural language search for relevant threads
- **User Data Management**: Local storage with IndexedDB for privacy
- **Extension Popup**: Rich UI for browsing history and searching

## Tech Stack
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Webpack 5 + ts-loader
- **AI/ML**: Hugging Face Transformers.js, ONNX Runtime Web
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
  "chat_interface": false,
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
- `dexie`: IndexedDB operations
- `react`: UI framework
- `downshift`: Autocomplete components
- `progressbar.js`: Loading indicators

## Tag System
The extension supports multiple tag types:
- `thread_theme`: Discussion themes
- `thread_category`: Topic categories
- `story_tag`: Story-level tags
- `topic_tag`: General topic tags

Tags are visually integrated into the HN UI with a maximum of 3 tags per story.

## Data Storage
All user data is stored locally using IndexedDB:
- **Tag History**: Clicked tags with timestamps
- **Search History**: Previous search queries
- **Settings**: User preferences and feature toggles
- **Embeddings**: Cached text embeddings for performance

## User Interface
The popup provides:
- **Visited Threads**: History of clicked tags
- **Thread Search**: Semantic search with autocomplete
- **Search Archive**: Historical queries
- **Settings**: User preferences

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