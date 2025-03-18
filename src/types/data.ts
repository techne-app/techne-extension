import { Tag } from './tag';

export interface StoryData {
    id: number;
    tags: string[];
    tag_types: string[];
    tag_anchors: string[];
}

export interface ThreadData {
    id: number;
    tags: string[];
    tag_types: string[];
}

export interface CommentData {
    id: string;
    tags: string[] | null;
    tag_types: string[] | null;
}

export interface ProfileCommentData {
    id: string;
    tags: Tag[];
}

export interface CommentCategories {
    threadIds: number[];
    commentIds: number[];
} 