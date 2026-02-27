import OpenAI from "openai";
import { QuoteAiExtractorPort } from "../../domain/contracts/quote-ai-extractor.port";
import { DocumentTextDto } from "../../domain/dtos/document-text.dto";
import { QuoteExtractionResult } from "../../domain/entities/quote-extraction-result.entity";
import { QuoteItem } from "../../domain/entities/quote-item.entity";
import { LanguageDetectorService } from "../language/language-detector.service";
import { QuantityNormalizerService } from "../normalization/quantity-normalizer.service";
import { UnitNormalizerService } from "../normalization/unit-normalizer.service";
import { AiRawResponseDto } from "./dtos/ai-raw-response.dto";
import { AiRawItemDto } from "./dtos/ai-raw-item.dto";

export class OpenAiQuoteAiExtractorService implements QuoteAiExtractorPort {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly unitNormalizer: UnitNormalizerService;
  private readonly quantityNormalizer: QuantityNormalizerService;
  private readonly languageDetector: LanguageDetectorService;

  constructor(
    apiKey: string,
    model: string,
    unitNormalizer: UnitNormalizerService,
    quantityNormalizer: QuantityNormalizerService,
    languageDetector: LanguageDetectorService,
  ) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.unitNormalizer = unitNormalizer;
    this.quantityNormalizer = quantityNormalizer;
    this.languageDetector = languageDetector;
  }

  public async extract(documentText: DocumentTextDto): Promise<QuoteExtractionResult> {


    const userContent = this.buildUserPrompt(documentText);
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(),
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("El modelo no devolvio contenido.");
    }

    const parsedJson = this.parseAssistantJson(rawContent);
    const responseDto = AiRawResponseDto.fromUnknown(parsedJson);
    const items = responseDto
      .getItems()
      .map((item) => this.mapToEntity(item))
      .filter((item): item is QuoteItem => item !== null);

    return new QuoteExtractionResult(items);
  }

  private mapToEntity(rawItem: AiRawItemDto): QuoteItem | null {
    const descriptionOriginal = this.compactWhitespace(rawItem.getDescriptionOriginal() ?? "");
    if (!descriptionOriginal) {
      return null;
    }

    const descriptionNormalized = this.compactWhitespace(
      rawItem.getDescriptionNormalized() ?? descriptionOriginal,
    );
    const quantity = this.quantityNormalizer.normalize(rawItem.getQuantity());
    const originalUnit = rawItem.getOriginalUnit()?.trim() || null;

    const normalizedFromModel = this.unitNormalizer.normalize(rawItem.getNormalizedUnit());
    const normalizedFromOriginal = this.unitNormalizer.normalize(originalUnit);
    const normalizedFromDescription = this.unitNormalizer.detectFromDescription(descriptionOriginal);
    const normalizedUnit = normalizedFromModel ?? normalizedFromOriginal ?? normalizedFromDescription;

    const language =
      rawItem.getLanguage() ?? this.languageDetector.detect(`${descriptionOriginal} ${descriptionNormalized}`);

    const requiresReview = quantity === null || normalizedUnit === null;

    return new QuoteItem({
      descriptionOriginal,
      descriptionNormalized,
      quantity,
      originalUnit,
      normalizedUnit,
      language,
      requiresReview,
    });
  }

  private compactWhitespace(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  private parseAssistantJson(content: string): unknown {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() ?? content.trim();

    try {
      return JSON.parse(candidate);
    } catch {
      const start = candidate.indexOf("{");
      const end = candidate.lastIndexOf("}");

      if (start >= 0 && end > start) {
        return JSON.parse(candidate.slice(start, end + 1));
      }

      throw new Error("La respuesta del modelo no contiene JSON valido.");
    }
  }

  private getSystemPrompt(): string {
    return `Eres un extractor de partidas de cotizacion industrial (acero al carbon, valvulas y relacionados).
Responde SOLO con JSON valido.

Objetivo:
- Extraer solo productos con: description_original, description_normalizada, cantidad, unidad_original, unidad_normalizada, idioma, requiere_revision.

Reglas:
1) Ignora encabezados, notas comerciales, precios, impuestos, subtotales/totales, firmas y texto no-producto.
2) Conserva description_original tal cual y crea description_normalizada limpia para busqueda ERP.
3) Soporta es/en/mixed.
4) Unidades canonicas permitidas: kg, m, ft, pza, tramo, se, null.
5) Si falta cantidad o unidad => usa null y requiere_revision=true.
6) No inventes datos.
7) Mantener orden de aparicion del documento.
8) Si llega EXTRACTION_HINTS:
   - usalo como apoyo, no como regla rigida.
   - CANDIDATE_DESCRIPTION_LINES ayuda para descripcion larga.
   - CANDIDATE_QTY_UNIT_LINES ayuda para cantidad/unidad.
   - empareja por similitud (marca/modelo/serie/material), no por indice forzado.
   - si hay duda, prioriza precision y marca requiere_revision=true.

Salida exacta:
{
  "items": [
    {
      "description_original": "string",
      "description_normalizada": "string",
      "cantidad": 0,
      "unidad_original": "string|null",
      "unidad_normalizada": "kg|m|ft|pza|tramo|se|null",
      "idioma": "es|en|mixed",
      "requiere_revision": false
    }
  ]
}`;
  }

  private buildUserPrompt(documentText: DocumentTextDto): string {
    const textContent = documentText.getTextContent();
    const extractionHints = documentText.getExtractionHints();

    //  return `Extrae y organiza la informacion de productos desde este contenido:\n\n${textContent}`;

    if (!extractionHints) {
      return `Extrae y organiza la informacion de productos desde este contenido:\n\n${textContent}`;
    }

    return `Extrae y organiza la informacion de productos usando este bloque de ayuda estructurada:\n\nEXTRACTION_HINTS\n${extractionHints}`;
  }
}
