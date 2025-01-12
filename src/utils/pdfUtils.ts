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

const collectTextContent = (
  element: HTMLElement,
  scale: number,
  elementRect: DOMRect,
  mainCanvas: HTMLCanvasElement,
  contentWidth: number
): Array<{
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
}> => {
  const textElements: Array<{
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
  }> = [];

  // Get absolutely all text nodes without any filtering
  const getAllTextNodes = (node: Node): Text[] => {
    const texts: Text[] = [];
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      texts.push(node as Text);
    }
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      texts.push(...getAllTextNodes(children[i]));
    }
    return texts;
  };

  // Get all text nodes
  const textNodes = getAllTextNodes(element);

  // Process each text node
  textNodes.forEach((node) => {
    const text = node.textContent;
    if (!text?.trim()) return;

    const parentElement = node.parentElement || element;
    const computedStyle = window.getComputedStyle(parentElement);

    // Skip if element is not visible
    if (
      computedStyle.display === "none" ||
      computedStyle.visibility === "hidden" ||
      parseFloat(computedStyle.opacity) === 0
    ) {
      return;
    }

    const fontFamily = computedStyle.fontFamily;

    try {
      // Create a range for the entire text node
      const range = document.createRange();
      range.selectNodeContents(node);

      // Split text into words while preserving whitespace
      const words = text.match(/\S+|\s+/g) || [];
      let currentPosition = 0;

      words.forEach((word) => {
        try {
          // Create a range for this word
          const wordRange = document.createRange();
          wordRange.setStart(node, text.indexOf(word, currentPosition));
          wordRange.setEnd(
            node,
            text.indexOf(word, currentPosition) + word.length
          );
          currentPosition = text.indexOf(word, currentPosition) + word.length;

          const rects = wordRange.getClientRects();
          if (!rects.length) return;

          // Use the first rect for positioning
          const rect = rects[0];
          const scaleFactor = contentWidth / mainCanvas.width;

          // Calculate exact position with scale factor
          const x =
            ((rect.left - elementRect.left) / elementRect.width) *
            mainCanvas.width *
            scaleFactor;
          const y =
            ((rect.top - elementRect.top) / elementRect.height) *
            mainCanvas.height *
            scaleFactor;

          // Get exact character dimensions
          const charHeight = rect.height;

          // Calculate the exact font size based on the rendered height
          const renderedFontSize =
            (charHeight / elementRect.height) * mainCanvas.height * scale;

          // Add the character with exact positioning
          textElements.push({
            text: word,
            x: x, // Remove the horizontal adjustment
            y: y + renderedFontSize * 0.2, // Minimal baseline adjustment
            fontSize: renderedFontSize,
            fontFamily,
          });
        } catch (e) {
          // Skip character if range creation fails
          console.warn("Failed to process character:", word);
        }
      });
    } catch (e) {
      // Fallback for any errors in main range creation
      const parentRect = parentElement.getBoundingClientRect();
      const scaleFactor = contentWidth / mainCanvas.width;
      const x =
        ((parentRect.left - elementRect.left) / elementRect.width) *
        mainCanvas.width *
        scaleFactor;
      const y =
        ((parentRect.top - elementRect.top) / elementRect.height) *
        mainCanvas.height *
        scaleFactor;

      // Calculate dimensions from parent element
      const renderedHeight =
        (parentRect.height / elementRect.height) * mainCanvas.height * scale;
      const renderedFontSize = renderedHeight;

      // Add the whole text as a fallback using the same positioning logic
      textElements.push({
        text,
        x: x,
        y: y + renderedFontSize * 0.2,
        fontSize: renderedFontSize,
        fontFamily,
      });
    }
  });

  // Sort text elements by their position (top to bottom, left to right)
  const LINE_HEIGHT_THRESHOLD = 5; // pixels
  return textElements.sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) < LINE_HEIGHT_THRESHOLD) {
      return a.x - b.x;
    }
    return yDiff;
  });
};

// Define the TextElement type
type TextElement = {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
};

export const generatePDFFromElement = async (
  element: HTMLElement,
  pdfConfig: PDFConfig
): Promise<jsPDF> => {
  const mergedConfig = { ...defaultConfig, ...pdfConfig };

  // Initialize PDF with basic config
  const pdf = new jsPDF({
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

  // Load images and prepare canvas
  await loadImages(element);

  // Apply container styles before canvas creation
  if (mergedConfig.container?.style) {
    Object.assign(element.style, mergedConfig.container.style);
  }

  // Apply container className canvas
  if (mergedConfig.container?.className) {
    element.className = mergedConfig.container?.className;
  }

  const defaultScale = 2;
  const mainCanvas = await html2canvas(element as HTMLElement, {
    scale: mergedConfig.scale || defaultScale,
    useCORS: true,
    logging: false,
    backgroundColor: "transparent",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    imageTimeout: 0,
    onclone: (clonedDoc) => {
      const style = clonedDoc.createElement("style");
      style.textContent = "* { -webkit-font-smoothing: antialiased; }";
      clonedDoc.head.appendChild(style);
    },
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = calculateMargins(mergedConfig);
  const availableHeight = pageHeight - margins.top - margins.bottom;
  const contentWidth = pageWidth - (margins.left + margins.right);

  const scale = contentWidth / mainCanvas.width;
  const totalHeight = mainCanvas.height * scale;
  const elementRect = element.getBoundingClientRect();

  // Collect all text content first
  const allTextElements = collectTextContent(
    element,
    scale,
    elementRect,
    mainCanvas,
    contentWidth
  );

  let remainingHeight = totalHeight;
  let sourceY = 0;
  let currentPage = 1;

  // Break up the rendering work into chunks using setTimeout
  const processNextChunk = () =>
    new Promise<void>((resolve) => {
      setTimeout(async () => {
        if (remainingHeight <= 0) {
          resolve();
          return;
        }

        let pageContentHeight = Math.min(availableHeight, remainingHeight);
        pageContentHeight = handleAutoBreak(
          pageContentHeight,
          sourceY,
          scale,
          element,
          mainCanvas
        );

        // Skip if there's no content to render
        if (pageContentHeight <= 1) {
          remainingHeight -= pageContentHeight;
          sourceY += pageContentHeight / scale;
          await processNextChunk();
          resolve();
          return;
        }

        // Only add a new page if we have content to render
        if (currentPage > 1) {
          pdf.addPage();
        }

        const tempCanvas = document.createElement("canvas");
        const scaleFactor = 2;
        tempCanvas.width = pdf.internal.pageSize.getWidth() * scaleFactor;
        tempCanvas.height = pdf.internal.pageSize.getHeight() * scaleFactor;
        const ctx = tempCanvas.getContext("2d", {
          alpha: true,
          willReadFrequently: true,
        });

        if (ctx) {
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

          const imageData = ctx.getImageData(
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
          );
          const hasContent = Array.from(imageData.data).some(
            (pixel, index) => index % 4 === 3 && pixel > 0
          );

          if (hasContent) {
            // Add the background image layer
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

            // Add text elements for this page
            const pageTop = sourceY * scale;

            // Filter text elements that belong to this page
            const pageTextElements = allTextElements.filter((textEl) => {
              const elementY = textEl.y - pageTop;
              const elementCenter = elementY + textEl.fontSize / 2;
              return elementCenter >= 0 && elementCenter <= pageContentHeight;
            });

            // Set text color to transparent for invisible but selectable text
            pdf.setTextColor(255, 255, 255, 0);

            // Group text elements by lines for better spacing
            const lineThreshold = 2; // pixels
            const lines = pageTextElements.reduce(
              (acc: TextElement[][], textEl) => {
                const lastLine = acc[acc.length - 1];
                if (
                  lastLine &&
                  Math.abs(lastLine[0].y - textEl.y) <= lineThreshold
                ) {
                  lastLine.push(textEl);
                } else {
                  acc.push([textEl]);
                }
                return acc;
              },
              []
            );

            // Process each line
            lines.forEach((lineElements) => {
              // Sort elements in the line by x position
              lineElements.sort((a: TextElement, b: TextElement) => a.x - b.x);

              // Render each element in the line
              lineElements.forEach((textEl: TextElement) => {
                pdf.setFontSize(textEl.fontSize);
                try {
                  const adjustedY = textEl.y - pageTop + margins.top;
                  const adjustedX = textEl.x + margins.left;

                  pdf.text(textEl.text, adjustedX, adjustedY, {
                    baseline: "top",
                    align: "left",
                    renderingMode: "invisible",
                  });
                } catch (e) {
                  console.warn("Failed to render text:", textEl.text);
                }
              });
            });

            // Reset text color
            pdf.setTextColor(0);

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
        await processNextChunk();
        resolve();
      }, 0);
    });

  await processNextChunk();

  const totalPages = currentPage - 1;

  // Add header, footer, and watermark after all pages are processed
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
