import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { Tag } from '../types/tag';

export async function personalize_with_webllm(
    mlcHandler: ExtensionServiceWorkerMLCEngineHandler,
    historicalTags: Tag[],
    storyTags: string[],
    tagTypes: string[],
    tagAnchors: string[]
) {
    // Get historical tags directly from DB
    const historicalTagStrings = historicalTags.map(t => t.tag);
    
    const prompt = `Given:
                  Historical tags: [${historicalTagStrings.join(', ')}]
                  Story tags: [${storyTags.join(', ')}]

                  Select exactly 3 story tags most similar to historical tags.
                  Reply only with tags separated by commas.`;

    const completion = await mlcHandler.engine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.7,
        max_tokens: 128
    });

    let response = '';
    const stream = await completion;
    for await (const chunk of stream) {
        response += chunk.choices[0]?.delta?.content || '';
    }

    const selectedTags = response.split(',').map(t => t.trim());
    console.log('Techne: Selected tags:', selectedTags);
    
    // Map back to full tag data
    const result = { tags: [] as string[], types: [] as string[], anchors: [] as string[] };
    selectedTags.forEach(tag => {
        const index = storyTags.findIndex(t => t === tag);
        if (index !== -1) {
            result.tags.push(storyTags[index]);
            result.types.push(tagTypes[index]);
            result.anchors.push(tagAnchors[index]);
        }
    });

    return result;
} 