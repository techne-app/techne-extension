import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { Tag } from '../types/tag';
import { pipeline } from "@huggingface/transformers";

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
    const historicalTagStrings = historicalTags.map(t => t.tag);

    /**
     * Singleton class to manage the embedding model
     */
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

    const embedder = await EmbedderSingleton.getInstance((data) => {
        // Progress tracking for embedder
      });
    
    // Get embeddings for all test words
    const historicalTagEmbeddings = await Promise.all(
    historicalTagStrings.map(word => 
        embedder(word, { pooling: 'mean', normalize: true })
    )
    );

    // Get embeddings for all test words
    const storyTagEmbeddings = await Promise.all(
        storyTags.map(word => 
            embedder(word, { pooling: 'mean', normalize: true })
        )
        );

    console.log(historicalTagEmbeddings);
    console.log(storyTagEmbeddings);

    const result = { tags: storyTags, types: tagTypes, anchors: tagAnchors };

    return result;
}