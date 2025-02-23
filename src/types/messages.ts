export enum MessageType {
  // Requests
  NEW_TAG = 'NEW_TAG',
  RANK_TAGS = 'RANK_TAGS',
  
  // Responses
  RANK_TAGS_COMPLETE = 'RANK_TAGS_COMPLETE',
  TAGS_UPDATED = 'TAGS_UPDATED',
  ERROR = 'ERROR'
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

export type ExtensionRequest = 
  | NewTagRequest 
  | RankTagsRequest;

export type ExtensionResponse = 
  | ErrorResponse 
  | TagsUpdatedResponse 
  | RankTagsCompleteResponse; 