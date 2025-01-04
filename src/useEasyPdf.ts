import React, { useCallback, useRef, useState } from "react";
import { PDFConfig } from "./types/config";
import { useEasyPdfContext } from "./EasyPdfProvider";
import {
  createTempElement,
  renderContent,
  applyStyles,
  generatePDFFromElement,
  validationCheck,
} from "./utils/pdfUtils";

export const useEasyPdf = (initialConfig?: PDFConfig) => {
  const { instance } = useEasyPdfContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isCreatingBlob, setIsCreatingBlob] = useState(false);
  const [error, setError] = useState<Error | null>(
    validationCheck({ instance, mode: "return" })
  );

  const downloadPDF = useCallback(
    async (
      refOrBlob: React.RefObject<HTMLDivElement> | Blob | string | null,
      config?: PDFConfig
    ) => {
      const mergedConfig = {
        ...instance.config,
        ...initialConfig,
        ...config,
      };
      try {
        setIsDownloadingPDF(true);
        setError(null);
        validationCheck;
        if (!refOrBlob) {
          throw new Error("PDF reference or blob not found");
        }

        let blob: Blob;
        if (refOrBlob instanceof Blob) {
          blob = refOrBlob;
        } else if (typeof refOrBlob === "string") {
          mergedConfig.filename = refOrBlob;
          if (!containerRef.current) {
            throw new Error("PDF container not found");
          }
          const pdf = await generatePDFFromElement(
            containerRef.current,
            mergedConfig
          );
          blob = pdf.output("blob");
        } else {
          const element = refOrBlob?.current;
          if (!element) {
            throw new Error("PDF container not found");
          }
          console.log("element", element);
          const pdf = await generatePDFFromElement(element, mergedConfig);
          blob = pdf.output("blob");
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = mergedConfig.filename || "document.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to generate PDF");
        setError(error);
        throw error;
      } finally {
        setIsDownloadingPDF(false);
      }
    },
    [instance.config, initialConfig]
  );

  const createPDF = useCallback(
    async (content: React.ReactNode, config?: PDFConfig) => {
      validationCheck({ instance, mode: "throw" });
      const tempDiv = createTempElement();
      try {
        setIsGeneratingPDF(true);
        setError(null);
        await renderContent(tempDiv, content);
        const mergedConfig = {
          ...instance.config,
          ...initialConfig,
          ...config,
        };
        if (mergedConfig.styles) {
          applyStyles(tempDiv, mergedConfig.styles);
        }
        const pdf = await generatePDFFromElement(tempDiv, mergedConfig);
        pdf.save(config?.filename || "document.pdf");
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("PDF generation failed");
        setError(error);
        throw error;
      } finally {
        setIsGeneratingPDF(false);
        document.body.removeChild(tempDiv);
      }
    },
    [instance.config, initialConfig]
  );

  const createPDFBlob = useCallback(
    async (content: React.ReactNode, config?: PDFConfig): Promise<Blob> => {
      const tempDiv = createTempElement();
      validationCheck({ instance, mode: "throw" });
      try {
        setIsCreatingBlob(true);
        setError(null);
        await renderContent(tempDiv, content);
        const mergedConfig = {
          ...instance.config,
          ...initialConfig,
          ...config,
        };
        if (mergedConfig.styles) {
          applyStyles(tempDiv, mergedConfig.styles);
        }
        const pdf = await generatePDFFromElement(tempDiv, mergedConfig);
        return pdf.output("blob");
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("PDF blob generation failed");
        setError(error);
        throw error;
      } finally {
        setIsCreatingBlob(false);
        document.body.removeChild(tempDiv);
      }
    },
    [instance.config, initialConfig]
  );

  const viewPDF = useCallback(
    async (content: React.ReactNode | Blob, config?: PDFConfig) => {
      validationCheck({ instance, mode: "throw" });
      try {
        let blob: Blob;
        if (content instanceof Blob) {
          blob = content;
        } else {
          blob = await createPDFBlob(content, config);
        }
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to view PDF");
        setError(error);
        throw error;
      }
    },
    [createPDFBlob]
  );

  return {
    containerRef,
    pdfRef: containerRef,
    downloadPDF,
    createPDF,
    createPDFBlob,
    viewPDF,
    isDownloadingPDF,
    isGeneratingPDF,
    isCreatingBlob,
    error,
  };
};

export default useEasyPdf;
