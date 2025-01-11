import { PDFConfig } from "./types/config";
import { defaultConfig } from "./types/defaultConfig";

export class EasyPdf {
  private static instance: EasyPdf | null = null;
  private config: PDFConfig;

  private constructor() {
    this.config = defaultConfig;
  }

  static initialize(): EasyPdf {
    if (!EasyPdf.instance) {
      EasyPdf.instance = new EasyPdf();
    }
    return EasyPdf.instance;
  }

  getConfig(): PDFConfig {
    return this.config;
  }

  setConfig(config: Partial<PDFConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
