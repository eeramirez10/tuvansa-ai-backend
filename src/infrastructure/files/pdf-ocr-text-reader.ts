import OpenAI from "openai";

export class PdfOcrTextReader {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  public async read(buffer: Buffer): Promise<string> {
    const response = await this.client.responses.create({
      model: this.model,
      max_output_tokens: 12000,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: this.getPrompt(),
            },
            {
              type: "input_file",
              filename: "quote.pdf",
              file_data: buffer.toString("base64"),
            },
          ],
        },
      ],
    });

    const extractedText = response.output_text?.trim() ?? "";
    if (!extractedText) {
      throw new Error("OCR no devolvio texto.");
    }

    return extractedText;
  }

  private getPrompt(): string {
    return `Extrae todo el texto legible del PDF adjunto (OCR) y devuelvelo como texto plano.
Reglas:
- No resumas.
- No traduzcas.
- No inventes contenido.
- Mantener el orden de lectura del documento.
- Responde solo con texto extraido.`;
  }
}
