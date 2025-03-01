import * as ort from 'onnxruntime-web';

interface TagMatch {
    tag: string;
    score: number;
}

interface TagSimilarityResult {
    tag: string;
    matches: TagMatch[];
}

type NumericArray = Float32Array | Int32Array | Uint8Array | Int8Array | Uint16Array | Int16Array | Float64Array;

/**
 * Computes cosine similarity between a tensor and another tensor
 * @param tensor1 - First tensor
 * @param tensor2 - Second tensor
 * @returns Cosine similarity value
 */
export async function computeTensorSimilarity(tensor1: ort.Tensor, tensor2: ort.Tensor): Promise<number> {
    // Extract data from tensors - accessing the data property directly
    const data1 = tensor1.data as NumericArray;
    const data2 = tensor2.data as NumericArray;
    
    // Ensure tensors have the same dimensions
    if (data1.length !== data2.length) {
    throw new Error("Tensors must have the same dimensions");
    }
    
    // Single-pass calculation for efficiency
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < data1.length; i++) {
    dotProduct += data1[i] * data2[i];
    norm1 += data1[i] * data1[i];
    norm2 += data2[i] * data2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    // Handle edge cases
    if (norm1 === 0 || norm2 === 0) {
    return 0; // Zero similarity when one or both vectors are zero
    }
    
    return dotProduct / (norm1 * norm2);
}

/**
 * Computes a similarity matrix between two arrays of tensors
 * @param inputEmbeddings - Array of input tag embeddings
 * @param historicalTagEmbeddings - Array of historical tag embeddings
 * @returns 2D matrix of similarity scores
 */
async function computeSimilarityMatrix(
    inputEmbeddings: ort.Tensor[], 
    historicalTagEmbeddings: ort.Tensor[]
): Promise<number[][]> {
    const similarityMatrix: number[][] = [];
    
    // For each input embedding
    for (let i = 0; i < inputEmbeddings.length; i++) {
    const similarities: number[] = [];
    
    // Compute similarity against each historical embedding
    for (let j = 0; j < historicalTagEmbeddings.length; j++) {
        const similarity = await computeTensorSimilarity(
        inputEmbeddings[i], 
        historicalTagEmbeddings[j]
        );
        similarities.push(similarity);
    }
    
    similarityMatrix.push(similarities);
    }
    
    return similarityMatrix;
}

/**
 * Ranks the input tags based on their cumulative similarity to historical tags
 * @param inputEmbeddings - Array of input tag embeddings
 * @param historicalTagEmbeddings - Array of historical tag embeddings
 * @param inputTags - Original input tag strings
 * @param inputTagTypes - Original input tag types
 * @param inputTagAnchors - Original input tag anchors
 * @returns Reordered lists of tags, types, and anchors
 */
export async function rankTagsBySimilarity(
    inputEmbeddings: ort.Tensor[], 
    historicalTagEmbeddings: ort.Tensor[],
    inputTags: string[],
    inputTagTypes: string[],
    inputTagAnchors: string[]
): Promise<{tags: string[], types: string[], anchors: string[]}> {
    // Validate input
    if (inputEmbeddings.length !== inputTags.length || 
        inputTags.length !== inputTagTypes.length || 
        inputTags.length !== inputTagAnchors.length) {
        throw new Error("Input arrays must all have the same length");
    }
    
    // Compute similarity matrix
    const similarityMatrix = await computeSimilarityMatrix(inputEmbeddings, historicalTagEmbeddings);
    
    // Create indices array with cumulative similarity scores
    const indices = Array.from({length: inputTags.length}, (_, i) => i);
    
    // Calculate cumulative similarity for each input tag across all historical tags
    const cumulativeScores = similarityMatrix.map(similarities => 
        similarities.reduce((sum, score) => sum + score, 0)
    );
    
    // Sort indices by their cumulative similarity scores (descending)
    indices.sort((a, b) => cumulativeScores[b] - cumulativeScores[a]);
    
    // Reorder the input arrays based on sorted indices
    const sortedTags = indices.map(i => inputTags[i]);
    const sortedTypes = indices.map(i => inputTagTypes[i]);
    const sortedAnchors = indices.map(i => inputTagAnchors[i]);
    
    return {
        tags: sortedTags,
        types: sortedTypes,
        anchors: sortedAnchors
    };
}
