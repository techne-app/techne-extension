import { CONFIG } from '../../config';
import { fetchTags, addStoryTags } from '../../utils/tag-utils';
import { StoryData } from '../../types';
import { getChatCompletion } from '../../utils/llm-utils';
import { Tag } from '../../background/db';

async function init(): Promise<void> {
    try {
        const athingElements = document.querySelectorAll('tr.athing');
        const story_ids = Array.from(athingElements).map(element => Number(element.getAttribute('id')));

        if (!story_ids.length) {
            console.log('Techne: No stories found on page');
            return;
        }

        // Create a map to store the relation between story IDs and their corresponding subtext elements
        const storySubtextMap = new Map();

        athingElements.forEach((athingElement) => {
            const storyId = Number(athingElement.getAttribute('id'));
            let subtextElement = athingElement.nextElementSibling;
            if (subtextElement) {
                const sublineElement = subtextElement.querySelector('.subline');
                if (sublineElement) {
                    storySubtextMap.set(storyId, sublineElement);
                }
            }
        });

        const data = await fetchTags<StoryData>(CONFIG.ENDPOINTS.STORY_TAGS, story_ids, 'story_ids');
        console.log('Techne: Fetched story tags:', data);

        // Get historical tags once at the start
        let historicalTags: Tag[] = [];
        try {
            historicalTags = await new Promise<Tag[]>((resolve, reject) => {
                const listener = (response: any) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve(response?.tags || []);
                };
                chrome.runtime.sendMessage({ type: 'GET_ALL_TAGS' }, listener);
            });
            console.log('Techne: Historical tags found:', historicalTags.map(t => t.tag));
        } catch (error) {
            console.log('Techne: Failed to get historical tags:', error);
            // Continue with empty historical tags
        }

        console.log('Techne: Starting tag processing for stories:', data.length);
        
        // Process stories one at a time
        for (const story of data) {
            const subtextElement = storySubtextMap.get(story.id);
            if (subtextElement && story.tags?.length) {
                console.log(`Techne: Processing story ${story.id} with original tags:`, story.tags);
                
                let selectedTags;
                // If 3 or fewer tags or no historical tags, use them directly without LLM processing
                if (story.tags.length <= 3 || historicalTags.length === 0) {
                    selectedTags = {
                        tags: story.tags.slice(0, 3),
                        types: story.tag_types.slice(0, 3),
                        anchors: story.tag_anchors.slice(0, 3)
                    };
                } else {
                    try {
                        selectedTags = await selectRelevantTags(
                            story.tags,
                            story.tag_types,
                            story.tag_anchors,
                            historicalTags
                        );
                    } catch (error) {
                        console.log('Techne: Failed to get LLM recommendations, using first 3 tags:', error);
                        selectedTags = {
                            tags: story.tags.slice(0, 3),
                            types: story.tag_types.slice(0, 3),
                            anchors: story.tag_anchors.slice(0, 3)
                        };
                    }
                }
                
                // Log the alternative universe (first 3 tags)
                console.log(`Techne: First 3 tags for story ${story.id}:`, story.tags.slice(0, 3));
                
                // Add tags to DOM immediately after processing each story
                console.log(`Techne: Adding tags to DOM for story ${story.id}:`, selectedTags.tags);
                addStoryTags(subtextElement, {
                    ...story,
                    tags: selectedTags.tags,
                    tag_types: selectedTags.types,
                    tag_anchors: selectedTags.anchors
                });
            } else {
                console.log(`Techne: Skipping story ${story.id} - no tags or subtext element`);
            }
        }

    } catch (error) {
        console.error('Techne: Error in main page initialization:', error);
    }
}

async function selectRelevantTags(
    storyTags: string[], 
    tagTypes: string[], 
    tagAnchors: string[],
    historicalTags: Tag[]
): Promise<{
    tags: string[],
    types: string[],
    anchors: string[]
}> {
    const historicalTagStrings = historicalTags.map(t => t.tag).join(', ');

    const prompt = `You are a tag recommender system. You match incoming tags to the user's historical interests.
    Given a user's historical interests: [${historicalTagStrings}] 
    And an incoming story's tags: [${storyTags.join(', ')}]
    Select the three (3) most relevant stroy tags that are most similar to the user's historical interests.

    Only respond with the exact stroy tags separated by commas.`;

    //console.log('Techne: LLM prompt:', prompt);

    try {
        const response = await getChatCompletion([
            { role: 'user', content: prompt }
        ]) as string;
        
        if (!response) {
            throw new Error('Empty response from LLM');
        }
        
        //console.log('Techne: LLM response:', response);

        const selectedTags = response.split(',').map(t => t.trim());
        //console.log('Techne: Parsed selected tags:', selectedTags);
        
        // If LLM returned more than 3 tags, just use first 3 from original list
        if (selectedTags.length > 3) {
            console.error('Error getting tag recommendations: LLM selected more than 3 tags!');

            return {
                tags: storyTags.slice(0, 3),
                types: tagTypes.slice(0, 3),
                anchors: tagAnchors.slice(0, 3)
            };
        }
        
        const result = {
            tags: [] as string[],
            types: [] as string[],
            anchors: [] as string[]
        };

        selectedTags.forEach(selectedTag => {
            const index = storyTags.findIndex(t => t === selectedTag);
            if (index !== -1) {
                result.tags.push(storyTags[index]);
                result.types.push(tagTypes[index]);
                result.anchors.push(tagAnchors[index]);
            }
        });

        // If no valid tags were found, fallback to first 3
        if (result.tags.length === 0) {
            return {
                tags: storyTags.slice(0, 3),
                types: tagTypes.slice(0, 3),
                anchors: tagAnchors.slice(0, 3)
            };
        }

        return result;
    } catch (error) {
        console.error('Error getting tag recommendations:', error);
        // Fallback to first 3 tags if LLM fails
        return {
            tags: storyTags.slice(0, 3),
            types: tagTypes.slice(0, 3),
            anchors: tagAnchors.slice(0, 3)
        };
    }
}

init();
