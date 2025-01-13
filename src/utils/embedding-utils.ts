import { pipeline } from '@xenova/transformers';

let embeddingPipeline: any = null;

export async function initEmbeddingPipeline() {
    if (!embeddingPipeline) {
        embeddingPipeline = await pipeline('feature-extraction', 
            'Xenova/bge-base-en-v1.5');
    }
    return embeddingPipeline;
}

export async function computeEmbeddings(texts: string[]): Promise<number[][]> {
    const pipeline = await initEmbeddingPipeline();
    const embeddings = await pipeline(texts, { pooling: 'mean', normalize: true });
    return embeddings.tolist();
}

export function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findBestMatchingTags(
    candidateTags: string[],
    userTags: string[],
    maxTags: number = 3
): Promise<string[]> {
    if (!userTags.length) return candidateTags.slice(0, maxTags);

    const allEmbeddings = await computeEmbeddings([...candidateTags, ...userTags]);
    const candidateEmbeddings = allEmbeddings.slice(0, candidateTags.length);
    const userEmbeddings = allEmbeddings.slice(candidateTags.length);

    const scores = candidateEmbeddings.map(candEmbed => {
        const avgSimilarity = userEmbeddings.reduce((sum, userEmbed) => {
            return sum + cosineSimilarity(candEmbed, userEmbed);
        }, 0) / userEmbeddings.length;
        return avgSimilarity;
    });

    return scores
        .map((score, idx) => ({ score, tag: candidateTags[idx] }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxTags)
        .map(item => item.tag);
} 