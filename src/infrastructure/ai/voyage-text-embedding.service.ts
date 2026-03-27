import { VoyageAIClient } from "voyageai";
import { TextEmbeddingPort } from "../../domain/contracts/text-embedding.port";

export class VoyageTextEmbeddingService implements TextEmbeddingPort {
  private readonly client: VoyageAIClient | null;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string = "voyage-3-large",
  ) {
    this.client = apiKey ? new VoyageAIClient({ apiKey }) : null;
  }

  public async embed(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error("Falta VOYAGEAI_API_KEY para busqueda semantica.");
    }

    const normalized = text.trim();
    if (!normalized) {
      throw new Error("La consulta para embedding no puede estar vacia.");
    }

    const response = await this.client.embed({
      input: [normalized],
      model: this.model,
    });

    const data = Array.isArray(response.data) ? response.data : [];
    const first = data[0];
    if (!first?.embedding || !Array.isArray(first.embedding) || first.embedding.length === 0) {
      throw new Error("Voyage no devolvio un embedding valido.");
    }

    return first.embedding;
  }
}
