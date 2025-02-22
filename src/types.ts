interface Tag {
    id?: number;
    tag?: string;
    text?: string;
    type: string;
    timestamp?: number;
    anchor?: string;
}

interface StoryData {
    id: number;
    tags: string[];
    tag_types: string[];
    tag_anchors: string[];
}

interface ThreadData {
    id: number;
    tags: string[];
}

interface ProfileCommentData {
    id: string;
    tags: Tag[];
}

interface CommentData {
    id: string;
    tags: string[] | null;
    tag_types: string[] | null;
}

interface CommentCategories {
    threadIds: number[];
    commentIds: number[];
}

export { 
    Tag, 
    StoryData, 
    ThreadData, 
    ProfileCommentData,
    CommentData, 
    CommentCategories 
};