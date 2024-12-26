interface StoryData {
    id: number;
    tags: string[];
    tag_anchors: string[];
}

interface ThreadData {
    id: string;
    tags: string[];
}

interface CommentData {
    id: string;
    tags: string[];
}

interface CommentCategories {
    threadIds: number[];
    commentIds: number[];
}

export { StoryData, ThreadData, CommentData, CommentCategories };