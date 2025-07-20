import { pipeline } from "@huggingface/transformers";
import { logger } from "../utils/logger.ts";


class EmbedderSingleton {
  static async getInstance(progress_callback) {
    return (this.fn ??= async (...args) => {
      this.instance ??= this.initializePipeline(progress_callback);

      return (this.promise_chain = (
        this.promise_chain ?? Promise.resolve()
      ).then(async () => (await this.instance)(...args)));
    });
  }

  static async initializePipeline(progress_callback) {
    try {
      // Try WebGPU first
      return await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        {
          progress_callback,
          device: "webgpu",
        },
      );
    } catch (error) {
      // Fallback to CPU if WebGPU fails
      logger.debug('WebGPU not available, falling back to CPU:', error);
      return await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        {
          progress_callback,
          device: "cpu",
        },
      );
    }
  }
}

export const embed_tags = async (tags) => {
  try {
    const embedder = await EmbedderSingleton.getInstance((_data) => {
      // Progress tracking for embedder download and loading
    });

    const embeddings = await Promise.all(
      tags.map(async tag => {
        try {
          return await embedder(tag, { pooling: 'mean', normalize: true });
        } catch (error) {
          // Log embedding errors but don't fail the entire operation
          logger.debug('Error embedding tag:', tag, error);
          // Return a zero embedding as fallback
          return { data: new Float32Array(384), dims: [1, 384] };
        }
      })
    );

    return embeddings;
  } catch (error) {
    logger.error('Error in embed_tags:', error);
    // Return empty embeddings as fallback
    return tags.map(() => ({ data: new Float32Array(384), dims: [1, 384] }));
  }
};
