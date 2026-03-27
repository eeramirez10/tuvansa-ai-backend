export interface BranchProductLookupResult {
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

export interface BranchProductLookupPort {
  isEnabled(): boolean;
  findByEanAndBranch(ean: string, branchCode: string): Promise<BranchProductLookupResult | null>;
}
