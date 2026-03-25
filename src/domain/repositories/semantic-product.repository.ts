import {
  SemanticProductMatch,
  SemanticProductQueryOptions,
} from "../datasources/semantic-product.datasource";

export interface SemanticProductRepository {
  queryByVector(vector: number[], options: SemanticProductQueryOptions): Promise<SemanticProductMatch[]>;
}
