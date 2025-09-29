declare module "@google/genai" {
  export interface GoogleGenAIOptions {
    apiKey?: string;
  }

  export interface UploadConfig {
    mimeType?: string;
  }

  export interface UploadResult {
    uri?: string;
    fileUri?: string;
    mimeType?: string;
    file?: UploadResult;
  }

  export interface FilesClient {
    upload(options: { file: Blob | File | ArrayBuffer; config?: UploadConfig }): Promise<UploadResult>;
  }

  export interface GenerateContentRequest {
    model: string;
    contents: Array<{
      role: string;
      parts: Array<{ text?: string; fileData?: { fileUri: string; mimeType?: string } }>;
    }>;
  }

  export interface GenerateContentResponse {
    response?: {
      text?: () => string | undefined;
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    text?: () => string | undefined;
  }

  export class ModelsClient {
    generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse>;
  }

  export class GoogleGenAI {
    constructor(options: GoogleGenAIOptions);
    readonly files: FilesClient;
    readonly models: ModelsClient;
  }

  export type UserContentPart =
    | string
    | {
        fileData: {
          fileUri: string;
          mimeType?: string;
        };
      };

  export function createUserContent(parts: UserContentPart[]): GenerateContentRequest["contents"];
  export function createPartFromUri(uri: string, mimeType?: string): UserContentPart;
}
