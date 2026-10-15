type ChunkCandidate = {
  id: string;
  documentId: string;
  text: string;
  embedding: number[];
};
const magnitude = (v: number[]): number =>
  Math.sqrt(v.reduce((sum, n) => sum + n * n, 0)) || 1;
export const rankBySimilarity = (
  query: number[],
  items: ChunkCandidate[],
  limit = 5,
) => {
  const queryMagnitude = magnitude(query);
  return items
    .map(({ embedding, ...item }) => ({
      ...item,
      score:
        query.reduce((sum, n, i) => sum + n * (embedding[i] ?? 0), 0) /
        (queryMagnitude * magnitude(embedding)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
