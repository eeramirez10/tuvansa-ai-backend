import { Index, Pinecone, RecordMetadata } from "@pinecone-database/pinecone";
import {
  SemanticProductDatasource,
  SemanticProductMatch,
  SemanticProductMetadata,
  SemanticProductQueryOptions,
} from "../../domain/datasources/semantic-product.datasource";

interface PineconeFilterCondition {
  $eq: string;
}

export class PineconeSemanticProductDatasource implements SemanticProductDatasource {
  private readonly index: Index<RecordMetadata> | null;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly indexName: string,
  ) {
    if (!apiKey) {
      this.index = null;
      return;
    }

    const pinecone = new Pinecone({ apiKey });
    this.index = pinecone.Index<RecordMetadata>(indexName);
  }

  public async queryByVector(
    vector: number[],
    options: SemanticProductQueryOptions,
  ): Promise<SemanticProductMatch[]> {
    if (!this.index) {
      throw new Error("Falta PINECONE_API_KEY para busqueda semantica.");
    }

    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error("Embedding invalido para consulta en Pinecone.");
    }

    const filter = this.buildFilter(options.filters);

    const queryOptions = {
      topK: options.topK,
      vector,
      includeMetadata: true,
      includeValues: false,
      ...(filter ? { filter } : {}),
    };

    const namespace = options.namespace?.trim();

    const result = namespace
      ? await this.index.namespace(namespace).query(queryOptions)
      : await this.index.query(queryOptions);

    return (result.matches ?? []).map((match) => {
      const metadata = this.mapMetadata(match.metadata);

      return {
        id: String(match.id ?? metadata.id ?? metadata.ean ?? ""),
        score: typeof match.score === "number" ? match.score : 0,
        metadata,
      };
    });
  }

  private buildFilter(filters?: Record<string, string>): Record<string, PineconeFilterCondition> | undefined {
    if (!filters) return undefined;

    const entries = Object.entries(filters)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value.length > 0);

    if (entries.length === 0) return undefined;

    return Object.fromEntries(entries.map(([key, value]) => [key, { $eq: value }]));
  }

  private mapMetadata(raw: RecordMetadata | undefined): SemanticProductMetadata {
    return {
      id: this.readString(raw, "id"),
      ean: this.readString(raw, "ean"),
      description: this.readString(raw, "description"),
      originalDescription: this.readString(raw, "originalDescription"),
      tipo: this.readString(raw, "tipo"),
      product: this.readString(raw, "product"),
      subtipo: this.readString(raw, "subtipo"),
      material: this.readString(raw, "material"),
      diameter: this.readString(raw, "diameter"),
      ced: this.readString(raw, "ced"),
      costura: this.readString(raw, "costura"),
      termino: this.readString(raw, "termino"),
      figura: this.readString(raw, "figura"),
      angulo: this.readString(raw, "angulo"),
      radio: this.readString(raw, "radio"),
      presion: this.readString(raw, "presion"),
    };
  }

  private readString(raw: RecordMetadata | undefined, key: string): string | null {
    if (!raw) return null;
    const value = raw[key];

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof value === "number") {
      return String(value);
    }

    return null;
  }
}
