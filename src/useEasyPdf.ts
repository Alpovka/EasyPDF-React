import React, { useCallback, useRef, useState } from "react";
import { PDFConfig } from "./types/config";
import { defaultConfig } from "./types/defaultConfig";
import {
  createTempElement,
  renderContent,
  applyStyles,
  generatePDFFromElement,
  mergeConfigs,
} from "./utils/pdfUtils";

export const useEasyPdf = (initialConfig?: PDFConfig) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getConfig = useCallback(
    (config?: PDFConfig) => mergeConfigs(defaultConfig, initialConfig, config),
    [initialConfig]
  );

  const downloadPDF = useCallback(
    async (
      refOrBlob: React.RefObject<HTMLDivElement> | Blob | string | null,
      config?: PDFConfig
    ) => {
      if (typeof window === "undefined") {
        throw new Error("[easypdf] downloadPDF requires a browser environment.");
      }
      const mergedConfig = getConfig(config);
      try {
        setIsLoading(true);
        setError(null);

        if (!refOrBlob) throw new Error("PDF reference or blob not found");

        let blob: Blob;
        if (refOrBlob instanceof Blob) {
          blob = refOrBlob;
        } else if (typeof refOrBlob === "string") {
          mergedConfig.filename = refOrBlob;
          if (!pdfRef.current) throw new Error("PDF container not found");
          blob = (await generatePDFFromElement(pdfRef.current, mergedConfig)).output("blob");
        } else {
          if (!refOrBlob.current) throw new Error("PDF container not found");
          blob = (await generatePDFFromElement(refOrBlob.current, mergedConfig)).output("blob");
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
        const e = err instanceof Error ? err : new Error("Failed to generate PDF");
        setError(e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [getConfig, pdfRef]
  );

  const createPDFBlob = useCallback(
    async (content: React.ReactNode, config?: PDFConfig): Promise<Blob> => {
      if (typeof window === "undefined") {
        throw new Error("[easypdf] createPDFBlob requires a browser environment.");
      }
      const tempDiv = createTempElement();
      let root: Awaited<ReturnType<typeof renderContent>> | undefined;
      try {
        setIsLoading(true);
        setError(null);
        root = await renderContent(tempDiv, content);
        const mergedConfig = getConfig(config);
        if (mergedConfig.styles) applyStyles(tempDiv, mergedConfig.styles);
        return (await generatePDFFromElement(tempDiv, mergedConfig)).output("blob");
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Failed to generate PDF");
        setError(e);
        throw e;
      } finally {
        setIsLoading(false);
        root?.unmount();
        document.body.removeChild(tempDiv);
      }
    },
    [getConfig]
  );

  const createPDF = useCallback(
    async (content: React.ReactNode, config?: PDFConfig) => {
      if (typeof window === "undefined") {
        throw new Error("[easypdf] createPDF requires a browser environment.");
      }
      const mergedConfig = getConfig(config);
      const blob = await createPDFBlob(content, config);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = mergedConfig.filename || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [getConfig, createPDFBlob]
  );

  const viewPDF = useCallback(
    async (content: React.ReactNode | Blob, config?: PDFConfig) => {
      if (typeof window === "undefined") {
        throw new Error("[easypdf] viewPDF requires a browser environment.");
      }
      try {
        const blob = content instanceof Blob ? content : await createPDFBlob(content, config);
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Failed to view PDF");
        setError(e);
        throw e;
      }
    },
    [createPDFBlob]
  );

  return {
    pdfRef,
    downloadPDF,
    createPDF,
    createPDFBlob,
    viewPDF,
    isLoading,
    error,
  };
};

export default useEasyPdf;
