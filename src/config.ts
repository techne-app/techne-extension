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