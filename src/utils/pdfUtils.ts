import React from "react";
import type { Root } from "react-dom/client";
import type { jsPDF as jsPDFType } from "jspdf";
import { PDFConfig } from "../types/config";
import { defaultConfig } from "../types/defaultConfig";
import handlePageBreak from "./handlePageBreak";

// Deep-merges PDFConfig objects left to right. Later configs win.
// Nested objects (margins, styles, etc.) are merged rather than replaced.
export const mergeConfigs = (...configs: (PDFConfig | undefined)[]): PDFConfig => {
  let result: PDFConfig = {};
  for (const config of configs) {
    if (!config) continue;
    result = {
      ...result,
      ...config,
      margins: { ...result.margins, ...config.margins },
      metadata: { ...result.metadata, ...config.metadata },
      styles: { ...result.styles, ...config.styles },
      header: config.header ? { ...result.header, ...config.header } : result.header,
      footer: config.footer ? { ...result.footer, ...config.footer } : result.footer,
      watermark: config.watermark ? { ...result.watermark, ...config.watermark } : result.watermark,
    };
  }
  return result;
};

export const createTempElement = (): HTMLDivElement => {
  if (typeof document === "undefined") {
    throw new Error("[easypdf] createTempElement requires a browser environment.");
  }
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
): Promise<Root> => {
  if (typeof window === "undefined") {
    throw new Error("[easypdf] renderContent requires a browser environment.");
  }
  const { default: ReactDOM } = await import("react-dom/client");
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement("div", { className: "pdf-content" }, content));
  // Wait for React 18 concurrent rendering to complete (3 frames)
  await new Promise<void>((resolve) => {
    let frames = 0;
    const tick = () => {
      if (++frames >= 3) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  // Flush any pending async effects
  await new Promise((r) => setTimeout(r, 100));
  await loadImages(container);
  return root;
};

export const applyStyles = (element: HTMLElement, styles: PDFConfig["styles"]) => {
  const merged = { ...defaultConfig.styles, ...styles };
  if (!merged) return;
  if (merged.backgroundColor) element.style.backgroundColor = merged.backgroundColor;
  if (merged.defaultFontSize) element.style.fontSize = `${merged.defaultFontSize}px`;
  if (merged.defaultFontFamily) element.style.fontFamily = merged.defaultFontFamily;
  if (merged.defaultTextColor) element.style.color = merged.defaultTextColor;
  if (merged.customCSS) {
    const styleEl = document.createElement("style");
    styleEl.textContent = merged.customCSS;
    element.appendChild(styleEl);
  }
};

export const loadImages = async (element: HTMLElement) => {
  const images = element.getElementsByTagName("img");
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
};

export const calculateMargins = (config: PDFConfig) => ({
  top: config.margins?.top ?? 0,
  right: config.margins?.right ?? 0,
  bottom: config.margins?.bottom ?? 0,
  left: config.margins?.left ?? 0,
});

const hexToRGB = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
};

const resolveText = (
  text: string | string[],
  pageNumber: number,
  totalPages: number
): string | string[] => {
  if (typeof text === "string") {
    return text
      .replace(/{pageNumber}/g, pageNumber.toString())
      .replace(/{totalPages}/g, totalPages.toString());
  }
  return text;
};

export const addHeader = (
  pdf: jsPDFType,
  headerConfig: PDFConfig["header"],
  margins: PDFConfig["margins"],
  pageNumber: number,
  totalPages: number
) => {
  if (!headerConfig?.text) return;

  const savedColor = pdf.getTextColor();
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(headerConfig.fontSize ?? 12);

  if (headerConfig.fontColor) {
    const { r, g, b } = hexToRGB(headerConfig.fontColor);
    pdf.setTextColor(r, g, b);
  } else {
    pdf.setTextColor(0, 0, 0);
  }

  // Header config margin takes priority over page margin
  const y = headerConfig.marginTop ?? margins?.top ?? 10;

  const x =
    headerConfig.align === "center"
      ? pageWidth / 2
      : headerConfig.align === "right"
      ? pageWidth - (headerConfig.marginRight ?? margins?.right ?? 0)
      : headerConfig.marginLeft ?? margins?.left ?? 0;

  pdf.text(resolveText(headerConfig.text, pageNumber, totalPages), x, y, {
    align: headerConfig.align ?? "center",
    baseline: "top",
  });

  pdf.setTextColor(savedColor);
};

export const addFooter = (
  pdf: jsPDFType,
  footerConfig: PDFConfig["footer"],
  margins: PDFConfig["margins"],
  pageNumber: number,
  totalPages: number
) => {
  if (!footerConfig?.text) return;

  const savedColor = pdf.getTextColor();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(footerConfig.fontSize ?? 12);

  if (footerConfig.fontColor) {
    const { r, g, b } = hexToRGB(footerConfig.fontColor);
    pdf.setTextColor(r, g, b);
  } else {
    pdf.setTextColor(0, 0, 0);
  }

  // Footer config margin takes priority over page margin
  const y = pageHeight - (footerConfig.marginBottom ?? margins?.bottom ?? 10);

  const x =
    footerConfig.align === "center"
      ? pageWidth / 2
      : footerConfig.align === "right"
      ? pageWidth - (footerConfig.marginRight ?? margins?.right ?? 0)
      : footerConfig.marginLeft ?? margins?.left ?? 0;

  pdf.text(resolveText(footerConfig.text, pageNumber, totalPages), x, y, {
    align: footerConfig.align ?? "center",
    baseline: "bottom",
  });

  pdf.setTextColor(savedColor);
};

export const addWatermark = (
  pdf: jsPDFType,
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
  const angleRad = (angle * Math.PI) / 180;

  const spacingX = textWidth * 1.5;
  const spacingY = textHeight * 2;
  const rotatedSpacingX =
    Math.abs(spacingX * Math.cos(angleRad)) + Math.abs(spacingY * Math.sin(angleRad));
  const rotatedSpacingY =
    Math.abs(spacingX * Math.sin(angleRad)) + Math.abs(spacingY * Math.cos(angleRad));

  const startX = -pageWidth;
  const startY = -pageHeight;
  const numX = Math.ceil((pageWidth * 3) / rotatedSpacingX);
  const numY = Math.ceil((pageHeight * 3) / rotatedSpacingY);

  for (let i = 0; i < numX; i++) {
    for (let j = 0; j < numY; j++) {
      const x = startX + i * rotatedSpacingX;
      const y = startY + j * rotatedSpacingY;
      pdf.saveGraphicsState();
      pdf.setCurrentTransformationMatrix(
        pdf.Matrix(Math.cos(angleRad), Math.sin(angleRad), -Math.sin(angleRad), Math.cos(angleRad), x, y)
      );
      pdf.text(text, -startX, -startY, { align: "center", baseline: "middle" });
      pdf.restoreGraphicsState();
    }
  }

  pdf.restoreGraphicsState();
};

const collectLinks = (
  element: HTMLElement,
  scale: number,
  sourceY: number,
  elementRect: DOMRect,
  mainCanvas: HTMLCanvasElement,
  contentWidth: number,
  margins: { top: number; left: number; bottom: number; right: number }
) => {
  const links: Array<{ url: string; x: number; y: number; width: number; height: number }> = [];

  for (const anchor of Array.from(element.getElementsByTagName("a"))) {
    const href = anchor.getAttribute("href");
    if (!href) continue;

    const rect = anchor.getBoundingClientRect();

    const x =
      ((rect.left - elementRect.left) / elementRect.width) * mainCanvas.width * scale +
      margins.left;
    const y =
      ((rect.top - elementRect.top) / elementRect.height) * mainCanvas.height * scale -
      sourceY * scale +
      margins.top;
    const width = (rect.width / elementRect.width) * mainCanvas.width * scale;
    const height = (rect.height / elementRect.height) * mainCanvas.height * scale;

    links.push({ url: href, x, y, width, height });
  }

  return links;
};

type TextElement = {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
};

const collectTextContent = (
  element: HTMLElement,
  scale: number,
  elementRect: DOMRect,
  mainCanvas: HTMLCanvasElement,
  contentWidth: number
): TextElement[] => {
  const textElements: TextElement[] = [];

  const getAllTextNodes = (node: Node): Text[] => {
    const texts: Text[] = [];
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      texts.push(node as Text);
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      texts.push(...getAllTextNodes(node.childNodes[i]));
    }
    return texts;
  };

  for (const node of getAllTextNodes(element)) {
    const text = node.textContent;
    if (!text?.trim()) continue;

    const parentElement = node.parentElement || element;
    const computedStyle = window.getComputedStyle(parentElement);

    if (
      computedStyle.display === "none" ||
      computedStyle.visibility === "hidden" ||
      parseFloat(computedStyle.opacity) === 0
    ) {
      continue;
    }

    const fontFamily = computedStyle.fontFamily;

    try {
      const words = text.match(/\S+|\s+/g) || [];
      let currentPosition = 0;

      for (const word of words) {
        try {
          const wordRange = document.createRange();
          const start = text.indexOf(word, currentPosition);
          wordRange.setStart(node, start);
          wordRange.setEnd(node, start + word.length);
          currentPosition = start + word.length;

          const rects = wordRange.getClientRects();
          if (!rects.length) continue;

          const rect = rects[0];
          const x =
            ((rect.left - elementRect.left) / elementRect.width) * mainCanvas.width * scale;
          const y =
            ((rect.top - elementRect.top) / elementRect.height) * mainCanvas.height * scale;
          const renderedFontSize =
            (rect.height / elementRect.height) * mainCanvas.height * scale;

          textElements.push({
            text: word,
            x,
            y: y + renderedFontSize * 0.2,
            fontSize: renderedFontSize,
            fontFamily,
          });
        } catch {
          // skip word if range creation fails
        }
      }
    } catch {
      // fallback: use parent element position
      const parentRect = parentElement.getBoundingClientRect();
      const x =
        ((parentRect.left - elementRect.left) / elementRect.width) * mainCanvas.width * scale;
      const y =
        ((parentRect.top - elementRect.top) / elementRect.height) * mainCanvas.height * scale;
      const renderedFontSize =
        (parentRect.height / elementRect.height) * mainCanvas.height * scale;

      textElements.push({
        text,
        x,
        y: y + renderedFontSize * 0.2,
        fontSize: renderedFontSize,
        fontFamily,
      });
    }
  }

  const LINE_HEIGHT_THRESHOLD = 5;
  return textElements.sort((a, b) => {
    const yDiff = a.y - b.y;
    return Math.abs(yDiff) < LINE_HEIGHT_THRESHOLD ? a.x - b.x : yDiff;
  });
};

export const generatePDFFromElement = async (
  element: HTMLElement,
  pdfConfig: PDFConfig
): Promise<jsPDFType> => {
  if (typeof window === "undefined") {
    throw new Error("[easypdf] PDF generation requires a browser environment. Call this only from a client-side event handler.");
  }

  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  const config = mergeConfigs(defaultConfig, pdfConfig);

  const pdf = new jsPDF({
    unit: "px",
    format:
      typeof config.pageSize === "object"
        ? [config.pageSize.width, config.pageSize.height]
        : config.pageSize ?? "a4",
  });

  pdf.setProperties({
    title: config.metadata?.title ?? "",
    author: config.metadata?.author ?? "",
    subject: config.metadata?.subject ?? "",
    keywords: config.metadata?.keywords?.join(", ") ?? "",
    creator: config.metadata?.creator ?? "EasyPDF",
  });

  await loadImages(element);

  if (config.container?.style) {
    Object.assign(element.style, config.container.style);
  }
  if (config.container?.className) {
    element.className = config.container.className;
  }

  // Props to force-inline from computed styles so CSS-in-JS (Emotion/MUI/styled-components)
  // renders correctly in the html2canvas clone, which loses insertRule() injected styles.
  const FORCE_INLINE_PROPS = [
    "display", "position", "top", "left", "right", "bottom",
    "width", "height", "min-width", "min-height", "max-width", "max-height",
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "background-color", "background-image", "background-size", "background-position", "background-repeat",
    "color", "font-size", "font-weight", "font-family", "font-style", "font-variant",
    "line-height", "letter-spacing", "text-align", "text-decoration", "text-transform",
    "white-space", "word-break", "overflow-wrap", "vertical-align",
    "border", "border-top", "border-right", "border-bottom", "border-left",
    "border-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
    "border-width", "border-style", "border-radius",
    "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius",
    "box-shadow", "outline", "outline-color", "outline-width", "outline-style",
    "flex", "flex-direction", "flex-wrap", "flex-grow", "flex-shrink", "flex-basis",
    "align-items", "align-self", "align-content", "justify-content", "justify-self", "justify-items",
    "gap", "row-gap", "column-gap",
    "grid-template-columns", "grid-template-rows", "grid-column", "grid-row",
    "overflow", "overflow-x", "overflow-y",
    "opacity", "visibility", "box-sizing", "z-index",
    "list-style", "list-style-type",
    "table-layout", "border-collapse", "border-spacing",
  ] as const;

  const mainCanvas = await html2canvas(element, {
    scale: config.scale ?? 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "transparent",
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    imageTimeout: 0,
    onclone: (clonedDoc, clonedElement) => {
      // 1. Force-inline computed styles from original DOM to cloned DOM.
      //    This captures CSS-in-JS (Emotion/MUI) styles that are injected via insertRule()
      //    and therefore lost during cloneNode(). getComputedStyle() gives the fully resolved value.
      if (clonedElement) {
        const origAll = [element, ...Array.from(element.querySelectorAll<HTMLElement>("*"))];
        const cloneAll = [clonedElement, ...Array.from(clonedElement.querySelectorAll<HTMLElement>("*"))];
        const len = Math.min(origAll.length, cloneAll.length);
        for (let i = 0; i < len; i++) {
          const orig = origAll[i];
          const clone = cloneAll[i];
          if (!orig || !clone) continue;
          const computed = window.getComputedStyle(orig);
          for (const prop of FORCE_INLINE_PROPS) {
            const val = computed.getPropertyValue(prop);
            if (val) clone.style.setProperty(prop, val);
          }
        }
      }

      // 2. Copy all CSSOM rules (insertRule-based stylesheets) as a fallback.
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          if (rules.length > 0) {
            const style = clonedDoc.createElement("style");
            style.textContent = rules.map((r) => r.cssText).join("\n");
            clonedDoc.head.appendChild(style);
          }
        } catch {
          // Skip cross-origin stylesheets (SecurityError)
        }
      }

      // 3. Copy CSS custom properties from :root (for MUI/shadcn CSS variable theming).
      const rootStyles = getComputedStyle(document.documentElement);
      const cssVars = Array.from(rootStyles).filter((p) => p.startsWith("--"));
      if (cssVars.length > 0) {
        const varStyle = clonedDoc.createElement("style");
        varStyle.textContent = `:root { ${cssVars
          .map((v) => `${v}: ${rootStyles.getPropertyValue(v)};`)
          .join("\n")} }`;
        clonedDoc.head.appendChild(varStyle);
      }

      const baseStyle = clonedDoc.createElement("style");
      baseStyle.textContent =
        "* { -webkit-font-smoothing: antialiased; box-sizing: border-box; }";
      clonedDoc.head.appendChild(baseStyle);
    },
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = calculateMargins(config);
  const contentWidth = pageWidth - margins.left - margins.right;
  const availableHeight = pageHeight - margins.top - margins.bottom;

  const scale = contentWidth / mainCanvas.width;
  const totalHeight = mainCanvas.height * scale;
  const elementRect = element.getBoundingClientRect();

  const allTextElements = collectTextContent(element, scale, elementRect, mainCanvas, contentWidth);

  let remainingHeight = totalHeight;
  let sourceY = 0;
  let currentPage = 1;

  const processNextPage = (): Promise<void> =>
    new Promise<void>((resolve) => {
      setTimeout(async () => {
        if (remainingHeight <= 0 || sourceY >= mainCanvas.height) {
          remainingHeight = 0;
          resolve();
          return;
        }

        let pageContentHeight = handlePageBreak(
          Math.min(availableHeight, remainingHeight),
          sourceY,
          scale,
          element,
          mainCanvas
        );

        if (pageContentHeight <= 0) {
          remainingHeight = 0;
          resolve();
          return;
        }

        const outputScale = 2;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = pageWidth * outputScale;
        tempCanvas.height = pageHeight * outputScale;
        const ctx = tempCanvas.getContext("2d", { alpha: true, willReadFrequently: true });

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.fillStyle = config.styles?.backgroundColor ?? "#ffffff";
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(
            mainCanvas,
            0, sourceY, mainCanvas.width, pageContentHeight / scale,
            margins.left * outputScale, margins.top * outputScale,
            contentWidth * outputScale, pageContentHeight * outputScale
          );

          const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const hasContent = Array.from(imageData.data).some(
            (pixel, index) => index % 4 === 3 && pixel > 0
          );

          if (hasContent) {
            if (currentPage > 1) pdf.addPage();

            pdf.addImage(
              tempCanvas.toDataURL("image/png", 1.0),
              "PNG", 0, 0, pageWidth, pageHeight,
              undefined, "FAST"
            );

            // Invisible but selectable/searchable text layer
            const pageTop = sourceY * scale;
            const pageTextElements = allTextElements.filter((el) => {
              const center = el.y - pageTop + el.fontSize / 2;
              return center >= 0 && center <= pageContentHeight;
            });

            pdf.setTextColor(255, 255, 255, 0);

            const lineThreshold = 2;
            const lines = pageTextElements.reduce((acc: TextElement[][], el) => {
              const lastLine = acc[acc.length - 1];
              if (lastLine && Math.abs(lastLine[0].y - el.y) <= lineThreshold) {
                lastLine.push(el);
              } else {
                acc.push([el]);
              }
              return acc;
            }, []);

            for (const line of lines) {
              line.sort((a, b) => a.x - b.x);
              for (const el of line) {
                pdf.setFontSize(el.fontSize);
                try {
                  pdf.text(el.text, el.x + margins.left, el.y - pageTop + margins.top, {
                    baseline: "top",
                    align: "left",
                    renderingMode: "invisible",
                  });
                } catch {
                  // skip if text rendering fails
                }
              }
            }

            pdf.setTextColor(0);

            // Clickable link layer
            const links = collectLinks(
              element, scale, sourceY, elementRect, mainCanvas, contentWidth, margins
            );
            for (const link of links) {
              const linkTop = link.y - margins.top;
              if (linkTop + link.height >= 0 && linkTop <= pageContentHeight) {
                pdf.link(link.x, link.y, link.width, link.height, { url: link.url });
              }
            }

            currentPage++;
          }
        }

        sourceY += pageContentHeight / scale;
        remainingHeight -= pageContentHeight;
        await processNextPage();
        resolve();
      }, 0);
    });

  await processNextPage();

  const totalPages = currentPage - 1;

  if (totalPages > 0) {
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addHeader(pdf, config.header, margins, i, totalPages);
      addFooter(pdf, config.footer, margins, i, totalPages);
      if (config.watermark?.text) {
        addWatermark(
          pdf,
          config.watermark.text,
          config.watermark.opacity,
          config.watermark.angle,
          config.watermark.fontSize,
          config.watermark.color
        );
      }
    }
  }

  return pdf;
};
