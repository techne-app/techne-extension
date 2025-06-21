export const CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'development' 
        ? "https://techne.app"
        : "https://techne.app",
    ENDPOINTS: {
        STORY_TAGS: "/story-tags/",
        THREAD_TAGS: "/thread-tags/"
    },
    STYLES: {
        STORY_TAG: { 
            color: 'blue', 
            textDecoration: 'none' 
        },
        TOPIC_TAG: {
            backgroundColor: '#4A90E2',
            color: 'white'
        }
    },
    MAX_STORY_TAGS: 3
}; 