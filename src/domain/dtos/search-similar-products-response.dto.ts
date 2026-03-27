interface BranchProductSnapshot {
  branchCode: string;
  id: string;
  code: string;
  ean: string;
  description: string;
  stock: number;
  unit: string;
  currency: string;
  averageCost: number;
  lastCost: number;
}

interface SearchSimilarProductsResponseItem {
  ean: string;
  productId: string | null;
  description: string;
  originalDescription: string | null;
  semanticSimilarity: number;
  finalSimilarity: number;
  similarity: number;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  branchCode: string;
  branchProductCode: string | null;
  availableInBranch: boolean | null;
  availableInAnyBranch: boolean | null;
  resolvedBranchCode: string | null;
  branchProduct: BranchProductSnapshot | null;
}

interface SearchSimilarProductsResponseDtoProps {
  query: string;
  branchCode: string;
  items: SearchSimilarProductsResponseItem[];
}

export class SearchSimilarProductsResponseDto {
  private readonly query: string;
  private readonly branchCode: string;
  private readonly items: SearchSimilarProductsResponseItem[];

  constructor(props: SearchSimilarProductsResponseDtoProps) {
    this.query = props.query;
    this.branchCode = props.branchCode;
    this.items = props.items;
  }

  public toJSON(): {
    query: string;
    branchCode: string;
    itemsCount: number;
    items: Array<{
      ean: string;
      productId: string | null;
      description: string;
      originalDescription: string | null;
      semanticSimilarity: number;
      semanticSimilarityPercent: number;
      finalSimilarity: number;
      finalSimilarityPercent: number;
      similarity: number;
      similarityPercent: number;
      confidence: "high" | "medium" | "low";
      reasons: string[];
      branchCode: string;
      branchProductCode: string | null;
      availableInBranch: boolean | null;
      availableInAnyBranch: boolean | null;
      resolvedBranchCode: string | null;
      branchProduct: BranchProductSnapshot | null;
    }>;
  } {
    return {
      query: this.query,
      branchCode: this.branchCode,
      itemsCount: this.items.length,
      items: this.items.map((item) => ({
        ean: item.ean,
        productId: item.productId,
        description: item.description,
        originalDescription: item.originalDescription,
        semanticSimilarity: item.semanticSimilarity,
        semanticSimilarityPercent: Math.round(item.semanticSimilarity * 10000) / 100,
        finalSimilarity: item.finalSimilarity,
        finalSimilarityPercent: Math.round(item.finalSimilarity * 10000) / 100,
        similarity: item.similarity,
        similarityPercent: Math.round(item.similarity * 10000) / 100,
        confidence: item.confidence,
        reasons: item.reasons,
        branchCode: item.branchCode,
        branchProductCode: item.branchProductCode,
        availableInBranch: item.availableInBranch,
        availableInAnyBranch: item.availableInAnyBranch,
        resolvedBranchCode: item.resolvedBranchCode,
        branchProduct: item.branchProduct,
      })),
    };
  }
}

export type {
  SearchSimilarProductsResponseItem,
  SearchSimilarProductsResponseDtoProps,
  BranchProductSnapshot,
};
