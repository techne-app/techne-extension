export enum MessageType {
  // Requests
  NEW_TAG = 'NEW_TAG',
  RANK_TAGS = 'RANK_TAGS',
  
  // Responses
  RANK_TAGS_COMPLETE = 'RANK_TAGS_COMPLETE',
  TAGS_UPDATED = 'TAGS_UPDATED',
  ERROR = 'ERROR',
  
  // New message types
  TAG_MATCH_REQUEST = 'TAG_MATCH_REQUEST',
  TAG_MATCH_RESPONSE = 'TAG_MATCH_RESPONSE',
  NEW_SEARCH = 'NEW_SEARCH',
  SEARCHES_UPDATED = 'SEARCHES_UPDATED'
}

// Base message interface
interface BaseMessage {
  type: MessageType;
  data: unknown;
}

// Request message types
export interface NewTagRequest extends BaseMessage {
  type: MessageType.NEW_TAG;
  data: {
    tag: string;
    type: string;
    anchor: string;
  };
}


interface RankTagsRequest {
  type: MessageType.RANK_TAGS;
  data: {
    storyTags: string[];
    tagTypes: string[];
    tagAnchors: string[];
  };
}

// Response message types
export interface ErrorResponse extends BaseMessage {
  type: MessageType.ERROR;
  data: {
    error: string;
  };
}

export interface TagsUpdatedResponse extends BaseMessage {
  type: MessageType.TAGS_UPDATED;
  data: Record<string, never>; // empty object for consistent structure
}

interface RankTagsCompleteResponse {
  type: MessageType.RANK_TAGS_COMPLETE;
  data: {
    result: {
      tags: string[];
      types: string[];
      anchors: string[];
    };
  };
}

// Add these new interfaces
export interface TagMatchRequest extends BaseMessage {
  type: MessageType.TAG_MATCH_REQUEST;
  data: {
    inputText: string;
    tags: Array<{
      tag: string;
      type: string;
      anchor: string;
    }>;
  };
}

export interface TagMatchResponse extends BaseMessage {
  type: MessageType.TAG_MATCH_RESPONSE;
  data: {
    matches: Array<{
      tag: string;
      type: string;
      anchor: string;
      score: number;
    }>;
    error?: string;
  };
}

// Add new interfaces
export interface NewSearchRequest extends BaseMessage {
  type: MessageType.NEW_SEARCH;
  data: {
    query: string;
  };
}

export interface SearchesUpdatedResponse extends BaseMessage {
  type: MessageType.SEARCHES_UPDATED;
  data: Record<string, never>; // empty object for consistent structure
}

// Update the union types
export type ExtensionRequest = 
  | NewTagRequest 
  | RankTagsRequest
  | TagMatchRequest
  | NewSearchRequest;

export type ExtensionResponse = 
  | ErrorResponse 
  | TagsUpdatedResponse 
  | RankTagsCompleteResponse
  | TagMatchResponse
  | SearchesUpdatedResponse; 