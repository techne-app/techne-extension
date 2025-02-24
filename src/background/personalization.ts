import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { Tag } from '../types/tag';
import { pipeline } from "@huggingface/transformers";


class EmbedderSingleton {
    private static fn: any;
    private static instance: any;
    private static promise_chain: Promise<any>;
    static async getInstance(progress_callback) {
        return (this.fn ??= async (...args) => {
            this.instance ??= pipeline(
                "feature-extraction",
                "Xenova/all-MiniLM-L6-v2",
                {
                    progress_callback,
                    device: "webgpu",
                },
            );

            return (this.promise_chain = (
                this.promise_chain ?? Promise.resolve()
            ).then(async () => (await this.instance)(...args)));
        });
    }
}

  
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

// Compute cosine similarity between two vectors
export const cosineSimilarity = (vec1, vec2) => {
    const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (mag1 * mag2);
  };

export async function personalize_with_tjs_embeddings(
    historicalTags: Tag[],
    storyTags: string[],
    tagTypes: string[],
    tagAnchors: string[]
) {
    console.log('Techne: Starting personalization with TJS embeddings');
    console.log('Historical tags:', historicalTags.length, 'Story tags:', storyTags.length);

    try {
        const embedder = await EmbedderSingleton.getInstance((data) => {
            console.log('Embedder progress:', data);
        });

        console.log('Techne: Embedder initialized successfully');

        const historicalTagStrings = historicalTags.map(t => t.tag);

        // Process historical tags
        console.log('Processing historical tags:', historicalTagStrings);
        const historicalTagEmbeddings = await Promise.all(
            historicalTagStrings.map(async (word) => {
                console.log('Getting embedding for historical tag:', word);
                return embedder(word, { pooling: 'mean', normalize: true });
            })
        );

        // Process story tags
        console.log('Processing story tags:', storyTags);
        const storyTagEmbeddings = await Promise.all(
            storyTags.map(async (word) => {
                console.log('Getting embedding for story tag:', word);
                return embedder(word, { pooling: 'mean', normalize: true });
            })
        );

        console.log('Historical embeddings count:', historicalTagEmbeddings.length);
        console.log('Story embeddings count:', storyTagEmbeddings.length);

        // Calculate similarities
        const similarities = storyTagEmbeddings.map((storyEmbed, storyIndex) => {
            const maxSimilarity = Math.max(...historicalTagEmbeddings.map(histEmbed => 
                cosineSimilarity(
                    Array.from(storyEmbed.data),
                    Array.from(histEmbed.data)
                )
            ));
            return {
                index: storyIndex,
                similarity: maxSimilarity
            };
        });

        // Sort by similarity and take top 3
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topIndices = similarities.slice(0, 3).map(s => s.index);

        return {
            tags: topIndices.map(i => storyTags[i]),
            types: topIndices.map(i => tagTypes[i]),
            anchors: topIndices.map(i => tagAnchors[i])
        };
    } catch (error) {
        console.error('Error in personalize_with_tjs_embeddings:', error);
        // Return all tags if there's an error
        return { tags: storyTags, types: tagTypes, anchors: tagAnchors };
    }
}