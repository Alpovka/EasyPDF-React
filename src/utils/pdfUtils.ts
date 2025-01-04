import React from "react";
import ReactDOM from "react-dom/client";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import { PDFConfig } from "../types/config";
import { defaultConfig } from "../types/defaultConfig";
import handleAutoBreak from "./handlePageBreak";

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
  const mergedStyles = { ...defaultConfig.styles, ...styles };
  if (!mergedStyles) return;

  if (mergedStyles.backgroundColor) {
    element.style.backgroundColor = mergedStyles.backgroundColor;
  }
  if (mergedStyles.defaultFontSize) {
    element.style.fontSize = `${mergedStyles.defaultFontSize}px`;
  }
  if (mergedStyles.defaultFontFamily) {
    element.style.fontFamily = mergedStyles.defaultFontFamily;
  }
  if (mergedStyles.defaultTextColor) {
    element.style.color = mergedStyles.defaultTextColor;
  }
  if (mergedStyles.customCSS) {
    const styleElement = document.createElement("style");
    styleElement.textContent = mergedStyles.customCSS;
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

export const addHeader = (
  pdf: jsPDF,
  headerConfig: PDFConfig["header"],
  margins: PDFConfig["margins"],
  pageNumber: number,
  totalPages: number
) => {
  if (!headerConfig?.text) return;

  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFontSize(headerConfig.fontSize || 12);
  pdf.setTextColor(headerConfig.fontColor || "#000000");

  const y = Math.min(margins?.top ?? 0, headerConfig.marginTop ?? 0);

  // Always use the center of the page width for x coordinate
  const x =
    headerConfig.align === "center"
      ? pageWidth / 2
      : headerConfig.align === "right"
      ? pageWidth - (margins?.right ?? 0) - (headerConfig.marginRight ?? 0)
      : (margins?.left ?? 0) + (headerConfig.marginLeft ?? 0);

  // Replace placeholders with actual page numbers
  const text =
    typeof headerConfig.text === "string"
      ? headerConfig.text
          .replace(/{pageNumber}/g, pageNumber.toString())
          .replace(/{totalPages}/g, totalPages.toString())
      : headerConfig.text;

  // Force center alignment
  pdf.text(text, x, y, {
    align: "center",
    baseline: "alphabetic",
  });
};

export const addFooter = (
  pdf: jsPDF,
  footerConfig: PDFConfig["footer"],
  margins: { top: number; right: number; bottom: number; left: number },
  pageNumber: number,
  totalPages: number
) => {
  if (!footerConfig?.text) return;

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(footerConfig.fontSize || 12);
  pdf.setTextColor(footerConfig.fontColor || "#000000");

  const y = Math.max(
    pageHeight - (margins?.bottom ?? 0),
    pageHeight - (footerConfig.marginBottom ?? 0)
  );

  // Always use the center of the page width for x coordinate
  const x =
    footerConfig.align === "center"
      ? pageWidth / 2
      : footerConfig.align === "right"
      ? pageWidth - (margins?.right ?? 0) - (footerConfig.marginRight ?? 0)
      : (margins?.left ?? 0) + (footerConfig.marginLeft ?? 0);

  // Replace placeholders with actual page numbers
  const text =
    typeof footerConfig.text === "string"
      ? footerConfig.text
          .replace(/{pageNumber}/g, pageNumber.toString())
          .replace(/{totalPages}/g, totalPages.toString())
      : footerConfig.text;

  // Force center alignment
  pdf.text(text, x, y, {
    align: "center",
    baseline: "alphabetic",
  });
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
    scale: mergedConfig.scale,
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

  if (mergedConfig.header?.text) {
    for (let i = 1; i <= currentPage - 1; i++) {
      pdf.setPage(i);
      addHeader(pdf, mergedConfig.header, margins, i, currentPage - 1);
    }
  }

  if (mergedConfig.footer?.text) {
    const totalPages = currentPage - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, mergedConfig.footer, margins, i, totalPages);
    }
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
