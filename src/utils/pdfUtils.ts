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

const hexToRGB = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

export const addHeader = (
  pdf: jsPDF,
  headerConfig: PDFConfig["header"],
  margins: PDFConfig["margins"],
  pageNumber: number,
  totalPages: number
) => {
  if (!headerConfig?.text) return;

  const currentTextColor = pdf.getTextColor();
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFontSize(headerConfig.fontSize || 12);

  // Set the header color
  if (headerConfig.fontColor) {
    const color = hexToRGB(headerConfig.fontColor);
    pdf.setTextColor(color.r, color.g, color.b);
  } else {
    pdf.setTextColor(0, 0, 0);
  }

  const y = Math.min(margins?.top ?? 0, headerConfig.marginTop ?? 0);

  const x =
    headerConfig.align === "center"
      ? pageWidth / 2
      : headerConfig.align === "right"
      ? pageWidth - (margins?.right ?? 0)
      : margins?.left ?? 0;

  const text =
    typeof headerConfig.text === "string"
      ? headerConfig.text
          .replace(/{pageNumber}/g, pageNumber.toString())
          .replace(/{totalPages}/g, totalPages.toString())
      : headerConfig.text;

  pdf.text(text, x, y, {
    align: headerConfig.align || "center",
    baseline: "top",
  });

  pdf.setTextColor(currentTextColor);
};

export const addFooter = (
  pdf: jsPDF,
  footerConfig: PDFConfig["footer"],
  margins: PDFConfig["margins"],
  pageNumber: number,
  totalPages: number
) => {
  if (!footerConfig?.text) return;

  const currentTextColor = pdf.getTextColor();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(footerConfig.fontSize || 12);

  if (footerConfig.fontColor) {
    const color = hexToRGB(footerConfig.fontColor);
    pdf.setTextColor(color.r, color.g, color.b);
  } else {
    pdf.setTextColor(0, 0, 0);
  }

  const y = Math.max(
    pageHeight - (margins?.bottom ?? 0),
    pageHeight - (footerConfig.marginBottom ?? 0)
  );

  const x =
    footerConfig.align === "center"
      ? pageWidth / 2
      : footerConfig.align === "right"
      ? pageWidth - (margins?.right ?? 0)
      : margins?.left ?? 0;

  const text =
    typeof footerConfig.text === "string"
      ? footerConfig.text
          .replace(/{pageNumber}/g, pageNumber.toString())
          .replace(/{totalPages}/g, totalPages.toString())
      : footerConfig.text;

  pdf.text(text, x, y, {
    align: footerConfig.align || "center",
    baseline: "bottom",
  });

  pdf.setTextColor(currentTextColor);
};

const collectLinks = (
  element: HTMLElement,
  scale: number,
  sourceY: number,
  elementRect: DOMRect,
  mainCanvas: HTMLCanvasElement,
  contentWidth: number,
  margins: { top: number; left: number; bottom: number; right: number }
): Array<{
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}> => {
  const links: Array<{
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];
  const anchors = element.getElementsByTagName("a");

  for (const anchor of Array.from(anchors)) {
    const href = anchor.getAttribute("href");
    if (!href) continue;

    const rect = anchor.getBoundingClientRect();

    // Calculate position relative to the canvas
    const scaleFactor = contentWidth / mainCanvas.width;

    const x =
      ((rect.left - elementRect.left) / elementRect.width) *
        mainCanvas.width *
        scaleFactor +
      margins.left;
    const y =
      ((rect.top - elementRect.top) / elementRect.height) *
        mainCanvas.height *
        scaleFactor -
      sourceY * scale +
      margins.top;
    const width =
      (rect.width / elementRect.width) * mainCanvas.width * scaleFactor;
    const height =
      (rect.height / elementRect.height) * mainCanvas.height * scaleFactor;

    links.push({
      url: href,
      x,
      y,
      width,
      height,
    });
  }

  return links;
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

  // Use a higher default scale (2 instead of 1) and allow custom override
  const defaultScale = 2;
  const mainCanvas = await html2canvas(element as HTMLElement, {
    scale: mergedConfig.scale || defaultScale,
    useCORS: true,
    logging: false,
    backgroundColor: "transparent",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    imageTimeout: 0, // Wait for all images
    onclone: (clonedDoc) => {
      // Ensure fonts are rendered at high quality
      const style = clonedDoc.createElement("style");
      style.textContent = "* { -webkit-font-smoothing: antialiased; }";
      clonedDoc.head.appendChild(style);
    },
  });

  const scale = contentWidth / mainCanvas.width;
  const totalHeight = mainCanvas.height * scale;
  const elementRect = element.getBoundingClientRect();

  let remainingHeight = totalHeight;
  let sourceY = 0;
  let currentPage = 1;

  while (remainingHeight > 0) {
    let pageContentHeight = Math.min(availableHeight, remainingHeight);
    pageContentHeight = handleAutoBreak(
      pageContentHeight,
      sourceY,
      scale,
      element,
      mainCanvas
    );

    // Skip if there's no content to render (pageContentHeight is 0 or very small)
    if (pageContentHeight <= 1) {
      remainingHeight -= pageContentHeight;
      sourceY += pageContentHeight / scale;
      continue;
    }

    // Only add a new page if we have content to render
    if (currentPage > 1) {
      pdf.addPage();
    }

    const tempCanvas = document.createElement("canvas");
    // Increase canvas resolution
    const scaleFactor = 2;
    tempCanvas.width = pdf.internal.pageSize.getWidth() * scaleFactor;
    tempCanvas.height = pdf.internal.pageSize.getHeight() * scaleFactor;
    const ctx = tempCanvas.getContext("2d", {
      alpha: true,
      willReadFrequently: true,
    });

    if (ctx) {
      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.fillStyle = mergedConfig.styles?.backgroundColor ?? "#ffffff";
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      ctx.drawImage(
        mainCanvas,
        0,
        sourceY,
        mainCanvas.width,
        pageContentHeight / scale,
        margins.left * scaleFactor,
        margins.top * scaleFactor,
        contentWidth * scaleFactor,
        pageContentHeight * scaleFactor
      );

      // Check if the canvas has any non-transparent pixels
      const imageData = ctx.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );
      const hasContent = Array.from(imageData.data).some((pixel, index) => {
        // Check alpha channel (every 4th value)
        return index % 4 === 3 && pixel > 0;
      });

      if (hasContent) {
        const imgData = tempCanvas.toDataURL("image/png", 1.0);
        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          pdf.internal.pageSize.getWidth(),
          pdf.internal.pageSize.getHeight(),
          undefined,
          "FAST"
        );

        // Add links for this page
        const links = collectLinks(
          element,
          scale,
          sourceY,
          elementRect,
          mainCanvas,
          contentWidth,
          margins
        );

        for (const link of links) {
          // Only add links that are visible on the current page
          const linkTop = link.y - margins.top;
          const linkBottom = linkTop + link.height;
          const pageTop = 0;
          const pageBottom = pageContentHeight;

          if (linkBottom >= pageTop && linkTop <= pageBottom) {
            pdf.link(link.x, link.y, link.width, link.height, {
              url: link.url,
            });
          }
        }

        currentPage++;
      }
    }

    sourceY += pageContentHeight / scale;
    remainingHeight -= pageContentHeight;
  }

  const totalPages = currentPage - 1;

  if (mergedConfig.header?.text && totalPages > 0) {
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addHeader(pdf, mergedConfig.header, margins, i, totalPages);
    }
  }

  if (mergedConfig.footer?.text && totalPages > 0) {
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, mergedConfig.footer, margins, i, totalPages);
    }
  }

  // Add watermark if configured
  if (mergedConfig.watermark?.text && totalPages > 0) {
    for (let i = 1; i <= totalPages; i++) {
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
