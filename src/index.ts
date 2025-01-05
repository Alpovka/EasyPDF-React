// Export main components and hooks
export { EasyPdf } from "./EasyPdf";
export { EasyPdfProvider, useEasyPdfContext } from "./EasyPdfProvider";
export { useEasyPdf } from "./useEasyPdf";

// Export types
import type { PDFConfig } from "./types/config";
export type { PDFConfig };
export { defaultConfig } from "./types/defaultConfig";

// Export types for the hook return values
type UseEasyPdfReturn = {
  containerRef: React.RefObject<HTMLDivElement>;
  pdfRef: React.RefObject<HTMLDivElement>;
  downloadPDF: (
    refOrBlob: React.RefObject<HTMLDivElement> | Blob | string | null,
    config?: PDFConfig
  ) => Promise<void>;
  createPDF: (content: React.ReactNode, config?: PDFConfig) => Promise<void>;
  createPDFBlob: (
    content: React.ReactNode,
    config?: PDFConfig
  ) => Promise<Blob>;
  viewPDF: (
    content: React.ReactNode | Blob,
    config?: PDFConfig
  ) => Promise<void>;
  isDownloadingPDF: boolean;
  isGeneratingPDF: boolean;
  isCreatingBlob: boolean;
  error: Error | null;
};

export type { UseEasyPdfReturn };
