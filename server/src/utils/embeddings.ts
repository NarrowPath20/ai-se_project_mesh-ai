import { getClient } from './openai-client.js';
export const createEmbedding = async (text: string): Promise<number[]> => {
  const response = await getClient().embeddings.create({
    model: 'Qwen/Qwen3-Embedding-8B',
    input: text,
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding?.length || !embedding.every(Number.isFinite))
    throw new Error('Invalid embedding response');
  return embedding;
};
