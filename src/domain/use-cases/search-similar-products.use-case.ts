import { BranchProductLookupPort } from "../contracts/branch-product-lookup.port";
import { TextEmbeddingPort } from "../contracts/text-embedding.port";
import { SemanticProductMatch } from "../datasources/semantic-product.datasource";
import { SearchSimilarProductsRequestDto } from "../dtos/search-similar-products-request.dto";
import {
  BranchProductSnapshot,
  SearchSimilarProductsResponseDto,
  SearchSimilarProductsResponseItem,
} from "../dtos/search-similar-products-response.dto";
import { SemanticProductRepository } from "../repositories/semantic-product.repository";

interface RankedCandidate {
  ean: string;
  lookupKeys: string[];
  productId: string | null;
  description: string;
  originalDescription: string | null;
  semanticScore: number;
  finalScore: number;
  reasons: string[];
}

export class SearchSimilarProductsUseCase {
  constructor(
    private readonly embeddingPort: TextEmbeddingPort,
    private readonly repository: SemanticProductRepository,
    private readonly branchLookupPort: BranchProductLookupPort,
    private readonly defaultNamespace?: string,
  ) {}

  public async execute(requestDto: SearchSimilarProductsRequestDto): Promise<SearchSimilarProductsResponseDto> {
    const normalizedQuery = this.normalizeText(requestDto.query);
    const vector = await this.embeddingPort.embed(normalizedQuery);

    const rawMatches = await this.repository.queryByVector(vector, {
      topK: requestDto.topK,
      namespace: this.defaultNamespace ?? null,
      filters: this.buildFilter(requestDto),
    });

    const ranked = this.rankAndDeduplicate(rawMatches, normalizedQuery)
      .filter((item) => item.finalScore >= requestDto.minScore)
      .slice(0, requestDto.limit);

    const items = await this.enrichWithBranchData(ranked, requestDto.branchCode);

    return new SearchSimilarProductsResponseDto({
      query: requestDto.query,
      branchCode: requestDto.branchCode,
      items,
    });
  }

  private buildFilter(requestDto: SearchSimilarProductsRequestDto): Record<string, string> | undefined {
    const filterEntries = Object.entries(requestDto.filters).filter(([, value]) => !!value);
    if (filterEntries.length === 0) return undefined;

    return Object.fromEntries(
      filterEntries.map(([key, value]) => [key, this.normalizeText(value as string)]),
    );
  }

  private rankAndDeduplicate(matches: SemanticProductMatch[], normalizedQuery: string): RankedCandidate[] {
    const bestByEan = new Map<string, RankedCandidate>();

    for (const match of matches) {
      const lookupKeys = this.buildLookupKeys(match);
      if (lookupKeys.length === 0) continue;

      const ean = lookupKeys[0];

      const description = match.metadata.description ?? match.metadata.originalDescription ?? ean;
      const originalDescription = match.metadata.originalDescription;

      const rerank = this.computeRuleBasedScore(normalizedQuery, match);
      const baseScore = this.normalizeSemanticScore(match.score);
      const ruleBoost = Math.min(0.2, rerank.bonus);
      const finalScore = Math.min(0.9999, baseScore + ruleBoost * (1 - baseScore));
      const reasons = rerank.reasons;

      const previous = bestByEan.get(ean);
      if (!previous || finalScore > previous.finalScore) {
        bestByEan.set(ean, {
          ean,
          lookupKeys,
          productId: match.metadata.id ?? match.id,
          description,
          originalDescription,
          semanticScore: baseScore,
          finalScore,
          reasons,
        });
      }
    }

    return Array.from(bestByEan.values()).sort((a, b) => b.finalScore - a.finalScore);
  }

  private buildLookupKeys(match: SemanticProductMatch): string[] {
    const candidates = [match.metadata.ean, match.metadata.id, match.id];
    const unique = new Set<string>();

    for (const raw of candidates) {
      const value = typeof raw === "string" ? raw.trim() : "";
      if (!value) continue;
      if (unique.has(value)) continue;
      unique.add(value);
    }

    return Array.from(unique);
  }

  private computeRuleBasedScore(
    normalizedQuery: string,
    match: SemanticProductMatch,
  ): { bonus: number; reasons: string[] } {
    let bonus = 0;
    const reasons: string[] = [];

    const metadata = match.metadata;

    if (this.containsDiameter(normalizedQuery, metadata.diameter)) {
      bonus += 0.1;
      reasons.push("diameter match");
    }

    if (this.containsToken(normalizedQuery, metadata.material)) {
      bonus += 0.08;
      reasons.push("material match");
    }

    if (this.containsToken(normalizedQuery, metadata.product)) {
      bonus += 0.07;
      reasons.push("product match");
    }

    if (this.containsToken(normalizedQuery, metadata.tipo)) {
      bonus += 0.05;
      reasons.push("category match");
    }

    if (this.containsCed(normalizedQuery, metadata.ced)) {
      bonus += 0.05;
      reasons.push("schedule match");
    }

    if (this.containsCostura(normalizedQuery, metadata.costura)) {
      bonus += 0.04;
      reasons.push("seam type match");
    }

    const descriptionOverlap = this.computeDescriptionOverlap(
      normalizedQuery,
      metadata.description ?? metadata.originalDescription,
    );

    if (descriptionOverlap >= 0.35) {
      bonus += 0.05;
      reasons.push("description token overlap");
    }

    if (reasons.length === 0) {
      reasons.push("semantic similarity");
    }

    return {
      bonus,
      reasons,
    };
  }

  private containsDiameter(normalizedQuery: string, diameter: string | null): boolean {
    if (!diameter) return false;

    const normalizedDiameter = this.normalizeDimension(diameter);
    if (!normalizedDiameter) return false;

    const variants = new Set<string>([
      normalizedDiameter,
      normalizedDiameter.replace(/\s+/g, "-"),
      `${normalizedDiameter}"`,
      `${normalizedDiameter} PULG`,
      `${normalizedDiameter} IN`,
    ]);

    for (const variant of variants) {
      if (normalizedQuery.includes(variant)) return true;
    }

    return false;
  }

  private containsCed(normalizedQuery: string, ced: string | null): boolean {
    if (!ced) return false;

    const normalizedCed = this.normalizeText(ced);
    if (!normalizedCed) return false;
    const paddedQuery = ` ${normalizedQuery} `;

    if (/^\d+$/.test(normalizedCed)) {
      return (
        paddedQuery.includes(` CED ${normalizedCed} `) ||
        paddedQuery.includes(` SCH ${normalizedCed} `) ||
        paddedQuery.includes(` CED.${normalizedCed} `)
      );
    }

    return this.containsToken(normalizedQuery, normalizedCed);
  }

  private containsCostura(normalizedQuery: string, costura: string | null): boolean {
    if (!costura) return false;
    const token = this.normalizeText(costura);

    if (token.includes("SIN COSTURA")) {
      return (
        normalizedQuery.includes("SIN COSTURA") ||
        normalizedQuery.includes("S/C") ||
        normalizedQuery.includes("SC")
      );
    }

    if (token.includes("CON COSTURA")) {
      return (
        normalizedQuery.includes("CON COSTURA") ||
        normalizedQuery.includes("C/C") ||
        normalizedQuery.includes("CC")
      );
    }

    return this.containsToken(normalizedQuery, token);
  }

  private computeDescriptionOverlap(normalizedQuery: string, description: string | null): number {
    if (!description) return 0;

    const queryTokens = this.tokenize(normalizedQuery);
    const descriptionTokens = this.tokenize(this.normalizeText(description));

    if (queryTokens.size === 0 || descriptionTokens.size === 0) return 0;

    let overlaps = 0;
    for (const token of queryTokens) {
      if (descriptionTokens.has(token)) overlaps += 1;
    }

    return overlaps / queryTokens.size;
  }

  private tokenize(text: string): Set<string> {
    const stopWords = new Set([
      "DE",
      "DEL",
      "LA",
      "EL",
      "Y",
      "PARA",
      "CON",
      "SIN",
      "EN",
      "MM",
      "CM",
    ]);

    const words = text
      .split(/[^A-Z0-9/.-]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
      .filter((token) => !stopWords.has(token));

    return new Set(words);
  }

  private containsToken(normalizedQuery: string, value: string | null): boolean {
    if (!value) return false;

    const normalizedValue = this.normalizeText(value);
    if (!normalizedValue) return false;

    return normalizedQuery.includes(normalizedValue);
  }

  private normalizeDimension(value: string): string {
    return this.normalizeText(value)
      .replace(/\s+/g, " ")
      .replace(/\bPULGADAS?\b/g, "")
      .replace(/\bPULG\b/g, "")
      .replace(/\bINCH(?:ES)?\b/g, "")
      .trim();
  }

  private normalizeText(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .toUpperCase()
      .trim();
  }

  private async enrichWithBranchData(
    ranked: RankedCandidate[],
    branchCode: string,
  ): Promise<SearchSimilarProductsResponseItem[]> {
    const canResolveBranchProducts = this.branchLookupPort.isEnabled();

    if (!canResolveBranchProducts) {
      return ranked.map((candidate) => ({
        ean: candidate.ean,
        productId: candidate.productId,
        description: candidate.description,
        originalDescription: candidate.originalDescription,
        semanticSimilarity: Math.round(candidate.semanticScore * 10000) / 10000,
        finalSimilarity: Math.round(candidate.finalScore * 10000) / 10000,
        similarity: Math.round(candidate.finalScore * 10000) / 10000,
        confidence: this.resolveConfidence(candidate.finalScore),
        reasons: candidate.reasons,
        branchCode,
        branchProductCode: null,
        availableInBranch: null,
        availableInAnyBranch: null,
        resolvedBranchCode: null,
        branchProduct: null,
      }));
    }

    const items = await Promise.all(
      ranked.map(async (candidate) => {
        let branchProduct = null;
        for (const lookupKey of candidate.lookupKeys) {
          branchProduct = await this.branchLookupPort.findByEanAndBranch(lookupKey, branchCode);
          if (branchProduct) break;
        }

        const branchSnapshot: BranchProductSnapshot | null = branchProduct
          ? {
              branchCode: branchProduct.branchCode,
              id: branchProduct.id,
              code: branchProduct.code,
              ean: branchProduct.ean,
              description: branchProduct.description,
              stock: branchProduct.stock,
              unit: branchProduct.unit,
              currency: branchProduct.currency,
              averageCost: branchProduct.averageCost,
              lastCost: branchProduct.lastCost,
            }
          : null;

        return {
          ean: candidate.ean,
          productId: candidate.productId,
          description: candidate.description,
          originalDescription: candidate.originalDescription,
          semanticSimilarity: Math.round(candidate.semanticScore * 10000) / 10000,
          finalSimilarity: Math.round(candidate.finalScore * 10000) / 10000,
          similarity: Math.round(candidate.finalScore * 10000) / 10000,
          confidence: this.resolveConfidence(candidate.finalScore),
          reasons: candidate.reasons,
          branchCode,
          branchProductCode: branchProduct?.code ?? null,
          availableInBranch: branchSnapshot ? branchSnapshot.branchCode === branchCode : false,
          availableInAnyBranch: branchSnapshot ? true : false,
          resolvedBranchCode: branchSnapshot?.branchCode ?? null,
          branchProduct: branchSnapshot,
        };
      }),
    );

    return items;
  }

  private resolveConfidence(score: number): "high" | "medium" | "low" {
    if (score >= 0.86) return "high";
    if (score >= 0.75) return "medium";
    return "low";
  }

  private normalizeSemanticScore(rawScore: number): number {
    if (!Number.isFinite(rawScore)) return 0;
    if (rawScore >= 0 && rawScore <= 1) return rawScore;
    if (rawScore > 1) return rawScore / (rawScore + 1);
    return 0;
  }
}
