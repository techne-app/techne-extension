export enum MessageType {
  // Requests
  CHAT_COMPLETION = 'CHAT_COMPLETION',
  NEW_TAG = 'NEW_TAG',
  GET_ALL_TAGS = 'GET_ALL_TAGS',
  
  // Responses
  TAGS_UPDATED = 'TAGS_UPDATED',
  ERROR = 'ERROR',
  STREAM_CHUNK = 'STREAM_CHUNK',
  COMPLETE = 'COMPLETE'
}

// Base message interface
interface BaseMessage {
  type: MessageType;
  data: unknown;
}

// Request message types
export interface ChatCompletionRequest extends BaseMessage {
  type: MessageType.CHAT_COMPLETION;
  data: {
    messages: any[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
  };
}

export interface NewTagRequest extends BaseMessage {
  type: MessageType.NEW_TAG;
  data: {
    tag: string;
    type: string;
    anchor: string;
  };
}

export interface GetAllTagsRequest extends BaseMessage {
  type: MessageType.GET_ALL_TAGS;
  data: Record<string, never>; // empty object for consistent structure
}

// Response message types
export interface ErrorResponse extends BaseMessage {
  type: MessageType.ERROR;
  data: {
    error: string;
  };
}

export interface CompleteResponse extends BaseMessage {
  type: MessageType.COMPLETE;
  data: {
    content: string;
  };
}

export interface StreamChunkResponse extends BaseMessage {
  type: MessageType.STREAM_CHUNK;
  data: {
    content: string;
  };
}

export interface TagsUpdatedResponse extends BaseMessage {
  type: MessageType.TAGS_UPDATED;
  data: Record<string, never>; // empty object for consistent structure
}

export type ExtensionRequest = 
  | ChatCompletionRequest 
  | NewTagRequest 
  | GetAllTagsRequest;

export type ExtensionResponse = 
  | ErrorResponse 
  | CompleteResponse 
  | StreamChunkResponse 
  | TagsUpdatedResponse; 