import OpenAI from "openai";
import {
  MissingProductNormalizationInput,
  MissingProductNormalizationOutput,
  MissingProductsNormalizerPort,
} from "../../domain/contracts/missing-products-normalizer.port";
import { QuantityNormalizerService } from "../normalization/quantity-normalizer.service";
import { UnitNormalizerService } from "../normalization/unit-normalizer.service";
import { MissingProductAiRawItemDto } from "./dtos/missing-product-ai-raw-item.dto";
import { MissingProductAiRawResponseDto } from "./dtos/missing-product-ai-raw-response.dto";

type OutputUnit = MissingProductNormalizationOutput["normalizedUnit"];

const MAX_BATCH_SIZE = 20;

export class OpenAiMissingProductsNormalizerService implements MissingProductsNormalizerPort {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly unitNormalizer: UnitNormalizerService;
  private readonly quantityNormalizer: QuantityNormalizerService;

  constructor(
    apiKey: string,
    model: string,
    unitNormalizer: UnitNormalizerService,
    quantityNormalizer: QuantityNormalizerService
  ) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.unitNormalizer = unitNormalizer;
    this.quantityNormalizer = quantityNormalizer;
  }

  public async normalize(items: MissingProductNormalizationInput[]): Promise<MissingProductNormalizationOutput[]> {
    if (items.length === 0) return [];

    const results: MissingProductNormalizationOutput[] = [];

    for (let i = 0; i < items.length; i += MAX_BATCH_SIZE) {
      const chunk = items.slice(i, i + MAX_BATCH_SIZE);
      const normalizedChunk = await this.normalizeChunk(chunk);
      results.push(...normalizedChunk);
    }

    return results;
  }

  private async normalizeChunk(
    inputChunk: MissingProductNormalizationInput[]
  ): Promise<MissingProductNormalizationOutput[]> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(),
        },
        {
          role: "user",
          content: this.buildUserPrompt(inputChunk),
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return inputChunk.map((item) => this.buildFallbackItem(item));
    }

    const parsedJson = this.parseAssistantJson(rawContent);
    const responseDto = MissingProductAiRawResponseDto.fromUnknown(parsedJson);
    const rawItems = responseDto.getItems();

    const byId = new Map<string, MissingProductAiRawItemDto>();
    rawItems.forEach((item) => {
      const id = item.getItemId();
      if (id) {
        byId.set(id, item);
      }
    });

    return inputChunk.map((inputItem, index) => {
      const rawItem = byId.get(inputItem.itemId) ?? rawItems[index] ?? null;
      if (!rawItem) {
        return this.buildFallbackItem(inputItem);
      }

      return this.mapToOutput(inputItem, rawItem);
    });
  }

  private mapToOutput(
    inputItem: MissingProductNormalizationInput,
    rawItem: MissingProductAiRawItemDto
  ): MissingProductNormalizationOutput {
    const descriptionOriginal = this.compactWhitespace(rawItem.getDescriptionOriginal() ?? inputItem.description);
    const descriptionNormalized = this.compactWhitespace(
      rawItem.getDescriptionNormalized() ?? descriptionOriginal
    ).toLowerCase();

    const quantity = this.quantityNormalizer.normalize(rawItem.getQuantity() ?? inputItem.quantity);
    const originalUnit = this.compactNullable(rawItem.getOriginalUnit() ?? inputItem.unit);
    const normalizedUnit = this.toOutputUnit(
      this.unitNormalizer.normalize(
        rawItem.getNormalizedUnit() ??
          rawItem.getOriginalUnit() ??
          inputItem.unit ??
          this.unitNormalizer.detectFromDescription(descriptionNormalized)
      )
    );
    const confidence = this.normalizeConfidence(rawItem.getConfidence(), quantity, normalizedUnit);

    const suggestedEanRaw = this.compactNullable(rawItem.getEanSuggested());
    const eanSuggested = this.normalizeEan(suggestedEanRaw);

    const requiresReviewFromModel = rawItem.getRequiresReview() ?? false;
    const requiresReview =
      requiresReviewFromModel || quantity === null || normalizedUnit === null || confidence < 0.6;

    return {
      itemId: inputItem.itemId,
      descriptionOriginal,
      descriptionNormalized,
      quantity,
      originalUnit,
      normalizedUnit,
      eanSuggested,
      confidence,
      requiresReview,
    };
  }

  private buildFallbackItem(item: MissingProductNormalizationInput): MissingProductNormalizationOutput {
    const descriptionOriginal = this.compactWhitespace(item.description);
    const descriptionNormalized = descriptionOriginal.toLowerCase();
    const quantity = this.quantityNormalizer.normalize(item.quantity);
    const normalizedUnit = this.toOutputUnit(
      this.unitNormalizer.normalize(item.unit ?? this.unitNormalizer.detectFromDescription(descriptionNormalized))
    );
    const requiresReview = quantity === null || normalizedUnit === null;

    return {
      itemId: item.itemId,
      descriptionOriginal,
      descriptionNormalized,
      quantity,
      originalUnit: this.compactNullable(item.unit),
      normalizedUnit,
      eanSuggested: null,
      confidence: requiresReview ? 0.45 : 0.8,
      requiresReview,
    };
  }

  private toOutputUnit(value: string | null): OutputUnit {
    if (!value) return null;
    if (value === "kg") return "KG";
    if (value === "m") return "M";
    if (value === "ft") return "FT";
    if (value === "pza") return "PZA";
    if (value === "tramo") return "TRAMO";
    if (value === "se") return "SE";
    return null;
  }

  private normalizeEan(value: string | null): string | null {
    if (!value) return null;

    const cleaned = value
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9-]/g, "");

    if (cleaned.length < 3) return null;
    return cleaned;
  }

  private normalizeConfidence(
    value: number | string | null,
    quantity: number | null,
    unit: OutputUnit
  ): number {
    let parsed: number | null = null;

    if (typeof value === "number" && Number.isFinite(value)) {
      parsed = value;
    } else if (typeof value === "string") {
      const number = Number(value);
      if (!Number.isNaN(number) && Number.isFinite(number)) {
        parsed = number;
      }
    }

    if (parsed === null) {
      parsed = quantity !== null && unit !== null ? 0.82 : 0.55;
    }

    if (parsed < 0) return 0;
    if (parsed > 1) return 1;
    return Number(parsed.toFixed(3));
  }

  private compactWhitespace(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  private compactNullable(text: string | null | undefined): string | null {
    if (!text) return null;
    const compact = this.compactWhitespace(text);
    return compact || null;
  }

  private parseAssistantJson(content: string): unknown {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() ?? content.trim();

    try {
      return JSON.parse(candidate);
    } catch {
      const startObject = candidate.indexOf("{");
      const endObject = candidate.lastIndexOf("}");
      if (startObject >= 0 && endObject > startObject) {
        return JSON.parse(candidate.slice(startObject, endObject + 1));
      }

      const startArray = candidate.indexOf("[");
      const endArray = candidate.lastIndexOf("]");
      if (startArray >= 0 && endArray > startArray) {
        return { items: JSON.parse(candidate.slice(startArray, endArray + 1)) };
      }

      throw new Error("La respuesta del modelo no contiene JSON valido.");
    }
  }

  private getSystemPrompt(): string {
    return `Eres un normalizador de productos industriales para cotizaciones (acero al carbon, valvulas, tuberia y conexiones).
Responde SOLO con JSON valido, sin markdown ni explicaciones.

Objetivo:
- Estandarizar descripciones de partidas faltantes de ERP para crear productos temporales locales.

Reglas:
1) Mantener descripcion_original entendible y generar description_normalized limpia para busqueda.
2) Unidades permitidas para unit_normalized: KG, M, FT, PZA, TRAMO, SE, null.
3) Si quantity o unit no son confiables, usa null y requires_review=true.
4) No inventar marca, modelo o medidas que no existan en el input.
5) ean_suggested SOLO si hay alta probabilidad; si no, null.
6) confidence debe ser decimal entre 0 y 1.
7) Mantener item_id exactamente igual.

Salida exacta:
{
  "items": [
    {
      "item_id": "string",
      "description_original": "string",
      "description_normalized": "string",
      "quantity": 0,
      "unit_original": "string|null",
      "unit_normalized": "KG|M|FT|PZA|TRAMO|SE|null",
      "ean_suggested": "string|null",
      "confidence": 0.0,
      "requires_review": false
    }
  ]
}`;
  }

  private buildUserPrompt(items: MissingProductNormalizationInput[]): string {
    const fewShotExamples = [
      {
        input: {
          item_id: "ex_1",
          description: 'Te mecanica roscada Mca. Victaulic Estilo 920N 4" x 1"',
          quantity: 2,
          unit: "PZAS",
        },
        output: {
          item_id: "ex_1",
          description_original: 'Te mecanica roscada Mca. Victaulic Estilo 920N 4" x 1"',
          description_normalized: "tee mecanica roscada victaulic estilo 920n 4 x 1",
          quantity: 2,
          unit_original: "PZAS",
          unit_normalized: "PZA",
          ean_suggested: null,
          confidence: 0.94,
          requires_review: false,
        },
      },
      {
        input: {
          item_id: "ex_2",
          description: 'Niple roscado negro con costura ced. 40 1-1/2" x 30 cm.',
          quantity: null,
          unit: null,
        },
        output: {
          item_id: "ex_2",
          description_original: 'Niple roscado negro con costura ced. 40 1-1/2" x 30 cm.',
          description_normalized: "niple roscado negro con costura cedula 40 1-1/2 x 30 cm",
          quantity: null,
          unit_original: null,
          unit_normalized: null,
          ean_suggested: null,
          confidence: 0.56,
          requires_review: true,
        },
      },
      {
        input: {
          item_id: "ex_3",
          description: 'TUBO DE ACERO AL CARBON CED 40 4" 120 MTS',
          quantity: 120,
          unit: "MTS",
        },
        output: {
          item_id: "ex_3",
          description_original: 'TUBO DE ACERO AL CARBON CED 40 4" 120 MTS',
          description_normalized: "tubo de acero al carbon cedula 40 4",
          quantity: 120,
          unit_original: "MTS",
          unit_normalized: "M",
          ean_suggested: null,
          confidence: 0.92,
          requires_review: false,
        },
      },
      {
        input: {
          item_id: "ex_4",
          description: 'Victaulic estilo 750 PZAS 4',
          quantity: 4,
          unit: "PZAS",
        },
        output: {
          item_id: "ex_4",
          description_original: "Victaulic estilo 750",
          description_normalized: "victaulic estilo 750",
          quantity: 4,
          unit_original: "PZAS",
          unit_normalized: "PZA",
          ean_suggested: null,
          confidence: 0.88,
          requires_review: false,
        },
      },
    ];

    return `Normaliza este lote de productos faltantes para alta LOCAL_TEMP.

FEW_SHOT_EXAMPLES:
${JSON.stringify(fewShotExamples, null, 2)}

INPUT_ITEMS:
${JSON.stringify(items, null, 2)}

Recuerda:
- output SOLO JSON valido con la llave "items"
- no agregues campos fuera del schema
- conserva item_id`;
  }
}
