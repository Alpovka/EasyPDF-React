import { PDFConfig } from "../types/config";
import { defaultConfig } from "./defaultConfig";
import { validateLicense } from "./license";

export interface EasyPdfInstance {
  config: PDFConfig;
  isValidated: boolean;
}

export const initializeEasyPdf = async (
  licenseKey: string
): Promise<EasyPdfInstance> => {
  let config: PDFConfig = defaultConfig;

  const isValidated = await validateLicense({ licenseKey });

  return {
    config,
    isValidated: isValidated ?? false,
  };
};
