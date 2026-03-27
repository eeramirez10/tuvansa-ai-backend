export interface SemanticProductMetadata {
  id: string | null;
  ean: string | null;
  description: string | null;
  originalDescription: string | null;
  tipo: string | null;
  product: string | null;
  subtipo: string | null;
  material: string | null;
  diameter: string | null;
  ced: string | null;
  costura: string | null;
  termino: string | null;
  figura: string | null;
  angulo: string | null;
  radio: string | null;
  presion: string | null;
}

export interface SemanticProductMatch {
  id: string;
  score: number;
  metadata: SemanticProductMetadata;
}

export interface SemanticProductQueryOptions {
  topK: number;
  namespace?: string | null;
  filters?: Record<string, string>;
}

export interface SemanticProductDatasource {
  queryByVector(vector: number[], options: SemanticProductQueryOptions): Promise<SemanticProductMatch[]>;
}
