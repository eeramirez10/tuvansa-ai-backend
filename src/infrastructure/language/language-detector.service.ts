import { DetectedLanguage } from "../../domain/value-objects/detected-language";

export class LanguageDetectorService {
  private readonly englishHints: string[];
  private readonly spanishHints: string[];

  constructor() {
    this.englishHints = [
      "qty",
      "inch",
      "inches",
      "carbon steel",
      "valve",
      "pipe",
      "schedule",
      "gate",
      "check valve",
      "flange",
    ];

    this.spanishHints = [
      "cantidad",
      "acero",
      "valvula",
      "válvula",
      "cedula",
      "cédula",
      "tramo",
      "pieza",
      "metros",
      "tuberia",
      "tubería",
    ];
  }

  public detect(input: string): DetectedLanguage {
    const text = input.toLowerCase();
    const hasEnglish = this.englishHints.some((term) => text.includes(term));
    const hasSpanish = this.spanishHints.some((term) => text.includes(term));

    if (hasEnglish && hasSpanish) {
      return DetectedLanguage.MIXED;
    }

    if (hasEnglish) {
      return DetectedLanguage.EN;
    }

    return DetectedLanguage.ES;
  }
}
