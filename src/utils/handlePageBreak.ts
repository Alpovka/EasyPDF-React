const handleAutoBreak = (
  proposedHeight: number,
  sourceY: number,
  scale: number,
  element: HTMLElement,
  mainCanvas: HTMLCanvasElement
): number => {
  console.log("proposedHeight", proposedHeight);
  let adjustedHeight = proposedHeight;

  // Get all elements that should not break
  const noBreakElements = Array.from(
    element.querySelectorAll("table, figure, img, pre, code, .no-break")
  );

  // Get all text blocks that should be considered for breaks
  const textBlocks = Array.from(
    element.querySelectorAll("p, h1, h2, h3, h4, h5, h6, div:not(:has(*))")
  );

  // First, handle elements that should not break
  for (const el of [...noBreakElements, ...textBlocks]) {
    const rect = el.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Calculate element's position and dimensions relative to the canvas
    const elTop =
      ((rect.top - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;
    const elBottom =
      ((rect.bottom - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;
    const elHeight = elBottom - elTop;

    // Only consider elements that start within current page
    if (elTop >= sourceY * scale && elTop < sourceY * scale + proposedHeight) {
      // If element would break across pages
      if (elBottom > sourceY * scale + proposedHeight) {
        // If element fits on a single page, move it to next page
        if (elHeight <= proposedHeight) {
          adjustedHeight = Math.min(adjustedHeight, elTop - sourceY * scale);
        }
      }
    }
  }

  // Then, handle text blocks
  for (const block of textBlocks) {
    const rect = block.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const blockTop =
      ((rect.top - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;
    const blockBottom =
      ((rect.bottom - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;

    // If text block starts before the proposed break and extends beyond it
    if (
      blockTop < sourceY * scale + proposedHeight &&
      blockBottom > sourceY * scale + proposedHeight
    ) {
      // Find the best breaking point (end of a paragraph or natural text break)
      const lines = block.getClientRects();
      let breakPoint = sourceY * scale;

      for (const line of Array.from(lines)) {
        const lineBottom =
          ((line.bottom - elementRect.top) / elementRect.height) *
          mainCanvas.height *
          scale;

        // Check if this line would fit on the current page
        if (lineBottom - sourceY * scale > proposedHeight) {
          break;
        }
        breakPoint = lineBottom;
      }

      // Adjust the height to break at the end of the last complete line
      if (breakPoint > sourceY * scale) {
        adjustedHeight = Math.min(adjustedHeight, breakPoint - sourceY * scale);
      }
    }
  }

  return adjustedHeight;
};

export default handleAutoBreak;
