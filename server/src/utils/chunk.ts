export const chunkText = (text: string): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += 500)
    chunks.push(text.slice(i, i + 500));
  return chunks;
};
