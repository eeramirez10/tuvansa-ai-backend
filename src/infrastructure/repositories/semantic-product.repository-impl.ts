import {
  SemanticProductMatch,
  SemanticProductQueryOptions,
} from "../../domain/datasources/semantic-product.datasource";
import { SemanticProductDatasource } from "../../domain/datasources/semantic-product.datasource";
import { SemanticProductRepository } from "../../domain/repositories/semantic-product.repository";

export class SemanticProductRepositoryImpl implements SemanticProductRepository {
  constructor(private readonly datasource: SemanticProductDatasource) {}

  public queryByVector(
    vector: number[],
    options: SemanticProductQueryOptions,
  ): Promise<SemanticProductMatch[]> {
    return this.datasource.queryByVector(vector, options);
  }
}
