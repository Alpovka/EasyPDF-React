import { PDFConfig } from "./types/config";
import { defaultConfig } from "./types/defaultConfig";
import { validateLicense } from "./utils/license";

export class EasyPdf {
  private static instance: EasyPdf | null = null;
  private config: PDFConfig;
  private isValidated: boolean;
  private licenseKey: string;

  private constructor(licenseKey: string) {
    this.config = defaultConfig;
    this.isValidated = false;
    this.licenseKey = licenseKey;
    // Start validation process asynchronously
    this.validateLicense();
  }

  static initialize(licenseKey: string): EasyPdf {
    if (!licenseKey) {
      throw new Error("License key is required");
    }

    if (!EasyPdf.instance) {
      EasyPdf.instance = new EasyPdf(licenseKey);
    }
    return EasyPdf.instance;
  }

  private async validateLicense(): Promise<void> {
    try {
      const isValid = await validateLicense({ licenseKey: this.licenseKey });
      this.isValidated = isValid ?? false;
    } catch (error) {
      console.error("License validation failed:", error);
      this.isValidated = false;
    }
  }

  static getInstance(): EasyPdf {
    if (!EasyPdf.instance) {
      throw new Error(
        "EasyPdf not initialized. Call EasyPdf.initialize(apiKey) first."
      );
    }
    return EasyPdf.instance;
  }

  getConfig(): PDFConfig {
    return this.config;
  }

  getValidationStatus(): boolean {
    return this.isValidated;
  }

  updateConfig(newConfig: Partial<PDFConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }
}
