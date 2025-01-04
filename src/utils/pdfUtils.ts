import React from "react";
import ReactDOM from "react-dom/client";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import { PDFConfig } from "../types/config";
import { defaultConfig } from "./defaultConfig";
import { EasyPdfInstance } from "../utils/instance";
import handleAutoBreak from "./handlePageBreak";

// Validation Check
export interface ValidationCheckProps {
  instance: EasyPdfInstance;
  mode: "return" | "throw";
}
export const validationCheck = ({ instance, mode }: ValidationCheckProps) => {
  if (!instance.isValidated) {
    if (mode === "throw") {
      throw new Error(
        "EasyPDF: Invalid license - PDF operations are not allowed"
      );
    }
    return new Error(
      "EasyPDF: Invalid license - PDF operations are not allowed"
    );
  }
  return null;
};

export const createTempElement = (): HTMLDivElement => {
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  document.body.appendChild(tempDiv);
  return tempDiv;
};

export const renderContent = async (
  container: HTMLDivElement,
  content: React.ReactNode
): Promise<void> => {
  return new Promise((resolve) => {
    const root = ReactDOM.createRoot(container);
    root.render(
      React.createElement("div", { className: "pdf-content" }, content)
    );
    requestAnimationFrame(() => resolve());
  });
};

export const applyStyles = (
  element: HTMLElement,
  styles: PDFConfig["styles"]
) => {
  if (!styles) return;

  if (styles.backgroundColor) {
    element.style.backgroundColor = styles.backgroundColor;
  }
  if (styles.defaultFontSize) {
    element.style.fontSize = `${styles.defaultFontSize}px`;
  }
  if (styles.defaultFontFamily) {
    element.style.fontFamily = styles.defaultFontFamily;
  }
  if (styles.defaultTextColor) {
    element.style.color = styles.defaultTextColor;
  }
  if (styles.customCSS) {
    const styleElement = document.createElement("style");
    styleElement.textContent = styles.customCSS;
    element.appendChild(styleElement);
  }
};

export const loadImages = async (element: HTMLElement) => {
  const images = element.getElementsByTagName("img");
  const imagePromises = Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // Continue even if image fails
    });
  });
  await Promise.all(imagePromises);
};

export const calculateMargins = (config: PDFConfig) => {
  return {
    top: config.margins?.top ?? 0,
    right: config.margins?.right ?? 0,
    bottom: config.margins?.bottom ?? 0,
    left: config.margins?.left ?? 0,
  };
};

export const addWatermark = (
  pdf: jsPDF,
  text: string,
  opacity = 0.3,
  angle = -45,
  fontSize = 20,
  color = "#888888"
) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.saveGraphicsState();

  pdf.setFontSize(fontSize);
  pdf.setTextColor(color);
  pdf.setGState(pdf.GState({ opacity }));

  const textWidth = pdf.getTextWidth(text);
  const textHeight = 20;

  const spacingX = textWidth * 1.5;
  const spacingY = textHeight * 2;

  const angleInRadians = (angle * Math.PI) / 180;
  const rotatedSpacingX =
    Math.abs(spacingX * Math.cos(angleInRadians)) +
    Math.abs(spacingY * Math.sin(angleInRadians));
  const rotatedSpacingY =
    Math.abs(spacingX * Math.sin(angleInRadians)) +
    Math.abs(spacingY * Math.cos(angleInRadians));

  const startX = -pageWidth;
  const startY = -pageHeight;
  const endX = pageWidth * 2;
  const endY = pageHeight * 2;

  const numX = Math.ceil((endX - startX) / rotatedSpacingX);
  const numY = Math.ceil((endY - startY) / rotatedSpacingY);

  for (let i = 0; i < numX; i++) {
    for (let j = 0; j < numY; j++) {
      const x = startX + i * rotatedSpacingX;
      const y = startY + j * rotatedSpacingY;

      pdf.saveGraphicsState();

      const matrix = pdf.Matrix(
        Math.cos(angleInRadians),
        Math.sin(angleInRadians),
        -Math.sin(angleInRadians),
        Math.cos(angleInRadians),
        x,
        y
      );

      pdf.setCurrentTransformationMatrix(matrix);

      pdf.text(text, -startX, -startY, {
        align: "center",
        baseline: "middle",
      });

      pdf.restoreGraphicsState();
    }
  }

  pdf.restoreGraphicsState();
};

export const generatePDFFromElement = async (
  element: HTMLElement,
  pdfConfig: PDFConfig
): Promise<jsPDF> => {
  const mergedConfig = { ...defaultConfig, ...pdfConfig };

  // Initialize PDF with basic config
  const pdf = new jsPDF({
    orientation: mergedConfig.orientation || "portrait",
    unit: "px",
    format:
      typeof mergedConfig.pageSize === "object"
        ? [mergedConfig.pageSize.width, mergedConfig.pageSize.height]
        : mergedConfig.pageSize ?? "a4",
  });

  // Set metadata and load images
  pdf.setProperties({
    title: mergedConfig.metadata?.title || "Generated Document",
    author: mergedConfig.metadata?.author || "EasyPDF",
    subject: mergedConfig.metadata?.subject || "",
    keywords: mergedConfig.metadata?.keywords?.join(", ") || "",
    creator: mergedConfig.metadata?.creator || "EasyPDF Generator",
  });

  await loadImages(element);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = calculateMargins(mergedConfig);
  const availableHeight = pageHeight - margins.top - margins.bottom;
  const contentWidth = pageWidth - (margins.left + margins.right);

  const mainCanvas = await html2canvas(element as HTMLElement, {
    scale: mergedConfig.scale ?? 2,
    useCORS: true,
    logging: false,
    backgroundColor: mergedConfig.styles?.backgroundColor ?? "#ffffff",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const scale = contentWidth / mainCanvas.width;
  const totalHeight = mainCanvas.height * scale;

  let remainingHeight = totalHeight;
  let sourceY = 0;
  let currentPage = 1;

  while (remainingHeight > 0) {
    if (currentPage > 1) {
      pdf.addPage();
    }

    let pageContentHeight = Math.min(availableHeight, remainingHeight);
    pageContentHeight = handleAutoBreak(
      pageContentHeight,
      sourceY,
      scale,
      element,
      mainCanvas
    );

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = mainCanvas.width;
    tempCanvas.height = Math.ceil(pageContentHeight / scale);
    const ctx = tempCanvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = mergedConfig.styles?.backgroundColor ?? "#ffffff";
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(
        mainCanvas,
        0,
        sourceY,
        mainCanvas.width,
        pageContentHeight / scale,
        0,
        0,
        mainCanvas.width,
        pageContentHeight / scale
      );

      const imgData = tempCanvas.toDataURL("image/png");
      pdf.addImage(
        imgData,
        "PNG",
        margins.left,
        margins.top,
        contentWidth,
        pageContentHeight,
        undefined,
        "FAST"
      );
    }

    sourceY += pageContentHeight / scale;
    remainingHeight -= pageContentHeight;
    currentPage++;
  }

  // Add watermark if configured
  if (mergedConfig.watermark?.text) {
    for (let i = 1; i <= currentPage - 1; i++) {
      pdf.setPage(i);
      addWatermark(
        pdf,
        mergedConfig.watermark.text,
        mergedConfig.watermark.opacity,
        mergedConfig.watermark.angle,
        mergedConfig.watermark.fontSize,
        mergedConfig.watermark.color
      );
    }
  }

  return pdf;
};
