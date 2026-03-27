
import 'dotenv/config'
import { get } from "env-var";


export class Envs {


  public static readonly instance = new Envs()

  public readonly databaseUrl: string;
  public readonly port:number
  public readonly openAiApiKey: string;
  public readonly openAiModel: string;
  public readonly voyageApiKey?: string;
  public readonly voyageModel: string;
  public readonly pineconeApiKey?: string;
  public readonly pineconeIndex: string;
  public readonly pineconeNamespace?: string;
  public readonly erpProductsBaseUrl?: string;
  public readonly erpProductsTimeoutMs: number;

  constructor() {

    this.databaseUrl = get('DATABASE_URL').required().asString();
    this.port = get('PORT').asPortNumber() ?? 3000
    this.openAiApiKey = get('OPENAI_API_KEY').required().asString();
    this.openAiModel = get('OPENAI_MODEL').default('gpt-5-nano').asString();
    this.voyageApiKey = get('VOYAGEAI_API_KEY').asString() ?? undefined;
    this.voyageModel = get('VOYAGEAI_MODEL').default('voyage-3-large').asString();
    this.pineconeApiKey = get('PINECONE_API_KEY').asString() ?? undefined;
    this.pineconeIndex = get('PINECONE_INDEX').default('proscai').asString();
    this.pineconeNamespace = get('PINECONE_NAMESPACE').asString() ?? undefined;
    this.erpProductsBaseUrl = get('ERP_PRODUCTS_BASE_URL').asString() ?? undefined;
    this.erpProductsTimeoutMs = get('ERP_PRODUCTS_TIMEOUT_MS').default('3500').asInt();
  }




}

export const envs = Envs.instance
