export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  modelDisplayName: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

export enum CacheType {
  Cache = "cache",
  IndexDB = "index_db",
}

export interface ChatConfig {
  model: string;
  cacheType: CacheType;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface ModelOption {
  id: string;
  name: string;
  value: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "qwen",
    name: "Qwen2-0.5B (Balanced)", 
    value: "Qwen2-0.5B-Instruct-q4f16_1-MLC"
  },
  {
    id: "llama",
    name: "Llama-3.2-3B (Powerful)",
    value: "Llama-3.2-3B-Instruct-q4f16_1-MLC"
  },
  {
    id: "gemma",
    name:"gemma-2-2B", 
    value: "gemma-2-2b-it-q4f16_1-MLC"  
  },
  {
    id: "phi",
    name: "Phi-3.5-mini",
    value: "Phi-3.5-mini-instruct-q4f16_1-MLC"
  },
  {
    id: "r1-qwen",
    name: "DeepSeek-R1-Distill-Qwen", 
    value: "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC"
  }
];