export const CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'development' 
        ? "https://techne.app"
        : "https://techne.app",
    ENDPOINTS: {
        STORY_TAGS: "/story-tags/",
        THREAD_TAGS: "/thread-tags/",
        COMMENT_TAGS: "/comment-tags/"
    },
    STYLES: {
        STORY_TAG: { 
            color: 'blue', 
            textDecoration: 'none' 
        },
        COMMENT_TAG: { 
            backgroundColor: '#FF6600',
            color: 'black',
            padding: '1px 3px',
            borderRadius: '2px',
            marginLeft: '4px'
        },
        EXPERTISE_TAG: {
            backgroundColor: '#4A90E2',
            color: 'white'
        },
        TOPIC_TAG: {
            backgroundColor: '#50B83C',
            color: 'white'
        }
    },
    MAX_STORY_TAGS: 3
}; 