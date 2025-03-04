import { pipeline } from "@huggingface/transformers";


class EmbedderSingleton {
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

export const embed_tags = async (tags) => {
  const embedder = await EmbedderSingleton.getInstance((data) => {
    // Progress tracking for embedder download and loading
  });

  const embeddings = await Promise.all(
    tags.map(tag => 
      embedder(tag, { pooling: 'mean', normalize: true })
    )
  );

  return embeddings;
};
