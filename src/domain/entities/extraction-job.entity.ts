export enum ExtractionJobStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum ExtractionJobInputType {
  FILE = "file",
  TEXT = "text",
}

export enum ExtractionJobSource {
  EMAIL = "email",
  WHATSAPP = "whatsapp",
  MANUAL = "manual",
  FILE = "file"
}

export interface ExtractionJobPrimitives {
  id: string;
  file_name: string;
  file_path: string;
  status: ExtractionJobStatus;
  progress: number;
  result_json: unknown | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  input_type: ExtractionJobInputType | null
  input_text: string | null
  source: ExtractionJobSource | null
}

interface ExtractionJobProps {
  id: string;
  fileName: string;
  filePath: string;
  status: ExtractionJobStatus;
  progress: number;
  resultJson: unknown | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  inputType: ExtractionJobInputType | null
  inputText: string | null
  source: ExtractionJobSource | null
}

export class ExtractionJob {
  public readonly id: string;
  public readonly fileName: string;
  public readonly filePath: string;
  public readonly status: ExtractionJobStatus;
  public readonly progress: number;
  public readonly resultJson: unknown | null;
  public readonly errorMessage: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly startedAt: Date | null;
  public readonly completedAt: Date | null;
  public readonly inputType: ExtractionJobInputType | null
  public readonly inputText: string | null
  public readonly source: ExtractionJobSource | null

  constructor(props: ExtractionJobProps) {
    this.id = props.id;
    this.fileName = props.fileName;
    this.filePath = props.filePath;
    this.status = props.status;
    this.progress = props.progress;
    this.resultJson = props.resultJson;
    this.errorMessage = props.errorMessage;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.inputType = props.inputType ?? null
    this.inputText = props.inputText ?? null
    this.source = props.source ?? null
  }

  public getId(): string {
    return this.id
  }

  public getStatus(): ExtractionJobStatus {
    return this.status
  }

  public getResultJson(): unknown | null {
    return this.resultJson;
  }

  public toPrimitives(): ExtractionJobPrimitives {
    return {
      id: this.id,
      file_name: this.fileName,
      file_path: this.filePath,
      status: this.status,
      progress: this.progress,
      result_json: this.resultJson,
      error_message: this.errorMessage,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      started_at: this.startedAt ? this.startedAt.toISOString() : null,
      completed_at: this.completedAt ? this.completedAt.toISOString() : null,
      input_type: this.inputType ?? null,
      input_text: this.inputText ?? null,
      source: this.source ?? null,
    };
  }

}