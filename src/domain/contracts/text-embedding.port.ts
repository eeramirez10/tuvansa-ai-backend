export interface TextEmbeddingPort {
  embed(text: string): Promise<number[]>;
}
