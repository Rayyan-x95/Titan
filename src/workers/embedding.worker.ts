import { pipeline, env } from '@xenova/transformers';

// Disable local model loading since we fetch model assets from CDN and cache them
env.allowLocalModels = false;

interface Extractor {
  (
    text: string,
    options?: { pooling?: string; normalize?: boolean },
  ): Promise<{ data: ArrayLike<number> }>;
}

let embedPipeline: Extractor | null = null;

async function getPipeline(): Promise<Extractor> {
  if (embedPipeline) return embedPipeline;
  embedPipeline = (await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  })) as unknown as Extractor;
  return embedPipeline;
}

self.onmessage = async (event: MessageEvent) => {
  const data = event.data as { text?: string; id: string };
  const { text, id } = data;
  if (!text) {
    self.postMessage({ id, vector: [], success: true });
    return;
  }

  try {
    const extractor = await getPipeline();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);
    self.postMessage({ id, vector, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[EmbeddingWorker] Inference failed:', error);
    self.postMessage({ id, error: message, success: false });
  }
};
