// Mock Chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn((path: string) => `chrome-extension://mock-id/${path}`)
  },
  tabs: {
    create: jest.fn(),
    update: jest.fn(),
    query: jest.fn().mockResolvedValue([])
  },
  windows: {
    update: jest.fn()
  },
  action: {
    onClicked: {
      addListener: jest.fn()
    }
  }
};

// Set up global Chrome mock
(global as any).chrome = mockChrome;

// Mock logger to avoid console output during tests
jest.mock('./utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    search: jest.fn(),
    chat: jest.fn(),
    model: jest.fn(),
    database: jest.fn(),
    api: jest.fn(),
    intent: jest.fn()
  }
}));

// Mock WebLLM dependency to avoid ES module issues
jest.mock('@mlc-ai/web-llm', () => ({
  CreateExtensionServiceWorkerMLCEngine: jest.fn(),
  prebuiltAppConfig: {}
}));

// Mock Hugging Face Transformers to avoid ES module issues
jest.mock('@huggingface/transformers', () => ({
  pipeline: jest.fn()
}));